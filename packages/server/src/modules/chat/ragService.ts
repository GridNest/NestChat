import mongoose from 'mongoose';
import { KnowledgeModel } from '../knowledge/knowledge.model.js';
import { ClientModel } from '../client/client.model.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

// ─── Constants ──────────────────────────────────────────────────────────────

const EMBED_MODEL = 'nomic-embed-text-v1.5';
const EMBED_ENDPOINT = 'https://api.groq.com/openai/v1/embeddings';
const MIN_SIMILARITY_THRESHOLD = 0.35;
const TOP_K_CHUNKS = 5;
const MAX_CONTEXT_CHARS = 3500; // chars to pass per chunk to Groq

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RetrievedChunk {
  title: string;
  content: string;
  category: string;
  similarity: number;
  chunkIndex: number;
}

export interface RAGResult {
  found: boolean;
  chunks: RetrievedChunk[];
  context: string;
  maxSimilarity: number;
}

// ─── Embedding cache (in-memory, per-process) ────────────────────────────────
// Avoids re-embedding the same query text multiple times within a request batch.

const queryEmbeddingCache = new Map<string, { embedding: number[]; ts: number }>();
const QUERY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── RAG Service ─────────────────────────────────────────────────────────────

export class RagService {
  /**
   * Generate an embedding vector for a given text using Groq's embedding model.
   * Returns null if the API key is missing or the request fails.
   */
  static async generateEmbedding(text: string): Promise<number[] | null> {
    const apiKey = env.GROQ_API_KEY;
    if (!apiKey) {
      logger.warn('[RagService] No GROQ_API_KEY — cannot generate embeddings');
      return null;
    }

    // Clean and truncate text before embedding
    const cleanText = text.replace(/\s+/g, ' ').trim().slice(0, 4000);
    if (!cleanText || cleanText.length < 5) return null;

    // Check query cache
    const cached = queryEmbeddingCache.get(cleanText);
    if (cached && Date.now() - cached.ts < QUERY_CACHE_TTL_MS) {
      return cached.embedding;
    }

    try {
      const response = await fetch(EMBED_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: EMBED_MODEL,
          input: cleanText,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        const errText = await response.text();
        logger.error(`[RagService] Embedding API error (${response.status}): ${errText}`);
        return null;
      }

      const data = await response.json();
      const embedding = data?.data?.[0]?.embedding as number[] | undefined;

      if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
        logger.warn('[RagService] Empty embedding returned from API');
        return null;
      }

      // Cache the embedding
      queryEmbeddingCache.set(cleanText, { embedding, ts: Date.now() });

      return embedding;
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.message?.includes('abort')) {
        logger.warn('[RagService] Embedding request timed out');
      } else {
        logger.error('[RagService] Embedding request failed:', err);
      }
      return null;
    }
  }

  /**
   * Compute cosine similarity between two vectors.
   * Returns 0 if either vector is zero-length.
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length || a.length === 0) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    if (denom === 0) return 0;

    return dot / denom;
  }

  /**
   * Resolve a clientId string (could be ObjectId or short clientId slug)
   * to a list of MongoDB ObjectIds to use in queries.
   */
  private static async resolveClientIds(clientId: string): Promise<mongoose.Types.ObjectId[]> {
    if (!clientId) return [];
    const validIds: mongoose.Types.ObjectId[] = [];

    if (mongoose.Types.ObjectId.isValid(clientId)) {
      validIds.push(new mongoose.Types.ObjectId(clientId));
    }

    const client = await ClientModel.findOne({
      $or: [
        { clientId: clientId.trim().toLowerCase() },
        ...(mongoose.Types.ObjectId.isValid(clientId)
          ? [{ _id: new mongoose.Types.ObjectId(clientId) }]
          : []),
      ],
    }).lean();

    if (client) {
      const oid = client._id as mongoose.Types.ObjectId;
      if (!validIds.some(id => id.toString() === oid.toString())) {
        validIds.push(oid);
      }
    }

    return validIds;
  }

  /**
   * Core RAG retrieval:
   * 1. Generate embedding for the query
   * 2. Load all knowledge chunks for the client that have embeddings
   * 3. Score by cosine similarity
   * 4. Return top-K above the threshold
   */
  static async retrieveRelevantChunks(
    clientId: string,
    query: string,
    topK: number = TOP_K_CHUNKS
  ): Promise<RAGResult> {
    const empty: RAGResult = { found: false, chunks: [], context: '', maxSimilarity: 0 };

    // Step 1: Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);
    if (!queryEmbedding) {
      logger.warn('[RagService] Could not generate query embedding — RAG skipped');
      return empty;
    }

    // Step 2: Resolve client IDs
    const clientIds = await this.resolveClientIds(clientId);
    if (clientIds.length === 0) return empty;

    // Step 3: Load chunks that have embeddings stored.
    // Note: embedding has select:false in schema, so we must use '+embedding' to include it.
    const chunks = await KnowledgeModel.find({
      clientId: { $in: clientIds },
      isActive: true,
      isDeleted: false,
      embedding: { $exists: true, $ne: [] },
    })
      .select('+embedding title content category chunkIndex tags')
      .lean();

    if (chunks.length === 0) {
      logger.info('[RagService] No embedded chunks found for client — RAG returning empty');
      return empty;
    }

    // Step 4: Score all chunks by cosine similarity
    const scored: RetrievedChunk[] = [];

    for (const chunk of chunks) {
      const chunkEmbedding = (chunk as any).embedding as number[] | undefined;
      if (!chunkEmbedding || chunkEmbedding.length === 0) continue;

      const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding);

      if (similarity >= MIN_SIMILARITY_THRESHOLD) {
        scored.push({
          title: chunk.title || '',
          content: chunk.content || '',
          category: chunk.category || 'general',
          similarity,
          chunkIndex: (chunk as any).chunkIndex ?? 0,
        });
      }
    }

    if (scored.length === 0) {
      logger.info(`[RagService] No chunks above similarity threshold (${MIN_SIMILARITY_THRESHOLD}) for query`);
      return empty;
    }

    // Step 5: Sort by similarity descending, take top K
    scored.sort((a, b) => b.similarity - a.similarity);
    const topChunks = scored.slice(0, topK);
    const maxSimilarity = topChunks[0]?.similarity ?? 0;

    // Step 6: Build context string (clean, labelled by category)
    const context = this.buildContext(topChunks);

    logger.info(
      `[RagService] Retrieved ${topChunks.length} chunks (max sim: ${maxSimilarity.toFixed(3)}) for query: "${query.slice(0, 60)}"`
    );

    return {
      found: true,
      chunks: topChunks,
      context,
      maxSimilarity,
    };
  }

  /**
   * Format retrieved chunks into a clean context string for the Groq system prompt.
   * Each chunk is labelled with its category and truncated to MAX_CONTEXT_CHARS.
   */
  static buildContext(chunks: RetrievedChunk[]): string {
    return chunks
      .map((chunk, idx) => {
        const label = chunk.category.toUpperCase().replace(/_/g, ' ');
        const content = chunk.content.slice(0, MAX_CONTEXT_CHARS);
        const title = chunk.title && chunk.title !== chunk.content.slice(0, 60)
          ? `${chunk.title}\n`
          : '';
        return `[${label}]\n${title}${content}`;
      })
      .join('\n\n---\n\n');
  }

  /**
   * Check whether embeddings are available for a given client.
   * Useful for graceful fallback when embeddings haven't been generated yet.
   */
  static async hasEmbeddings(clientId: string): Promise<boolean> {
    const clientIds = await this.resolveClientIds(clientId);
    if (clientIds.length === 0) return false;

    const count = await KnowledgeModel.countDocuments({
      clientId: { $in: clientIds },
      isActive: true,
      isDeleted: false,
      embedding: { $exists: true, $ne: [] },
    });

    return count > 0;
  }
}
