import { logger } from '../../utils/logger.js';

/**
 * Jina AI Reader Service
 *
 * Uses the free Jina AI Reader API (r.jina.ai) to fetch clean, readable
 * markdown text from any public website URL — no API key required.
 *
 * Results are cached in-memory for CACHE_TTL_MS to avoid re-fetching on
 * every user message within the same time window.
 */

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const FETCH_TIMEOUT_MS = 8000;        // 8 seconds
const MAX_CONTENT_LENGTH = 12000;     // chars sent to Groq (keep tokens low)

interface CacheEntry {
  content: string;
  fetchedAt: number;
}

const urlCache = new Map<string, CacheEntry>();

export class JinaReaderService {
  /**
   * Fetch clean text for a website URL using Jina AI Reader.
   * Returns null on failure so callers can gracefully fall back.
   */
  static async fetchWebsiteContent(websiteUrl: string): Promise<string | null> {
    if (!websiteUrl || !websiteUrl.startsWith('http')) return null;

    // Normalise URL (strip trailing slash)
    const normUrl = websiteUrl.trim().replace(/\/$/, '');

    // Check cache
    const cached = urlCache.get(normUrl);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      logger.info(`[JinaReader] Cache hit for ${normUrl}`);
      return cached.content;
    }

    const jinaUrl = `https://r.jina.ai/${normUrl}`;

    try {
      logger.info(`[JinaReader] Fetching ${jinaUrl}`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const response = await fetch(jinaUrl, {
        headers: {
          'Accept': 'text/plain,text/markdown',
          'X-Return-Format': 'markdown',
          'X-Timeout': '8',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        logger.warn(`[JinaReader] HTTP ${response.status} for ${normUrl}`);
        return null;
      }

      const rawText = await response.text();
      const content = this.cleanAndTruncate(rawText);

      if (!content || content.length < 50) {
        logger.warn(`[JinaReader] Empty/too-short content for ${normUrl}`);
        return null;
      }

      // Store in cache
      urlCache.set(normUrl, { content, fetchedAt: Date.now() });
      logger.info(`[JinaReader] Cached ${content.length} chars for ${normUrl}`);

      return content;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        logger.warn(`[JinaReader] Timeout fetching ${normUrl}`);
      } else {
        logger.error('[JinaReader] Fetch error:', err);
      }
      return null;
    }
  }

  /**
   * Clean Jina markdown output and truncate to keep Groq token count reasonable.
   */
  private static cleanAndTruncate(raw: string): string {
    return raw
      // Remove Jina header metadata lines (Title:, URL:, etc.)
      .replace(/^(Title|URL|Published Time|Description|Keywords):.*$/gm, '')
      // Remove markdown image syntax
      .replace(/!\[.*?\]\(.*?\)/g, '')
      // Remove HTML tags if any leaked through
      .replace(/<[^>]+>/g, ' ')
      // Remove excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{3,}/g, ' ')
      .trim()
      .slice(0, MAX_CONTENT_LENGTH);
  }

  /**
   * Clear the in-memory cache for a specific URL (e.g., after website resync).
   */
  static clearCache(websiteUrl?: string): void {
    if (websiteUrl) {
      const normUrl = websiteUrl.trim().replace(/\/$/, '');
      urlCache.delete(normUrl);
    } else {
      urlCache.clear();
    }
  }
}
