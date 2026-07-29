import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface GroqContextOptions {
  clientName: string;
  companyName: string;
  websiteUrl?: string;
  websiteType?: string;
  botName?: string;
  businessHours?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  language: string;
  query: string;
  intent?: string;
  // RAG: Pre-retrieved context (replaces raw websiteContent array)
  ragContext?: string;
  // Legacy: still accepted for non-RAG fallback
  faqs?: Array<{ question: string; answer: string }>;
  knowledgeItems?: Array<{ title: string; content: string }>;
  websiteContent?: Array<{ title: string; content: string; category: string }>;
  conversationHistory?: Array<{ sender: string; content: string }>;
  isRAGMode?: boolean;  // When true, uses strict RAG-only prompt
}

export interface GroqResponse {
  content: string;
  confidence: number;
  isUnknown: boolean;
}

// ─── Content Cleaning ─────────────────────────────────────────────────────────

/**
 * Cleans raw scraped website content before sending to Groq.
 * Applied in legacy (non-RAG) mode only — RAG chunks are already clean.
 */
function cleanScrapedContent(raw: string): string {
  return raw
    // Remove tag prefixes like [MENU_ITEM], [PRICING], [CTA], [STRUCTURED DATA], etc.
    .replace(/^\s*\[[\w_ ]+\]\s*/gm, '')
    // Remove structured data blocks entirely
    .replace(/\[STRUCTURED DATA\].*?(\n|$)/g, '')
    // Remove navigation boilerplate (e.g., "Home Menu Gallery About Testimonials Contact")
    .replace(/^(Home|Menu|Gallery|About|Testimonials|Contact|Login|Register|Sign In|Sign Up|Cart|Search|Navigation)[\s|•|/]+.{0,200}$/gm, '')
    // Remove pure CTA lines
    .replace(/^(Read More|Learn More|Click Here|Book Now|Order Now|Get Started|Sign Up Now|View All|Show More|Explore Menu|View Menu|Check Menu|Shop Now|Buy Now|Try Free)[\s.!]*$/gim, '')
    // Remove repeated whitespace/newlines
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{3,}/g, ' ')
    // Remove HTML tag remnants
    .replace(/<[^>]+>/g, ' ')
    .trim();
}

/**
 * Deduplicate content lines — removes repeated identical paragraphs that
 * commonly appear on pages (e.g. footer text copied multiple times).
 */
function deduplicateContent(text: string): string {
  const lines = text.split('\n');
  const seen = new Set<string>();
  const result: string[] = [];

  for (const line of lines) {
    const key = line.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(line);
  }

  return result.join('\n');
}

function truncate(str: string, maxLen: number): string {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}

// ─── Groq Service ─────────────────────────────────────────────────────────────

export class GroqService {
  static async generateCompletion(options: GroqContextOptions): Promise<GroqResponse | null> {
    const apiKey = env.GROQ_API_KEY;
    if (!apiKey) {
      logger.warn('[GroqService] No Groq API Key configured');
      return null;
    }

    try {
      const systemPrompt = options.isRAGMode
        ? this.buildRAGSystemPrompt(options)
        : this.buildSystemPrompt(options);

      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
      ];

      // Include last 6 conversation turns for context memory
      if (options.conversationHistory && options.conversationHistory.length > 0) {
        options.conversationHistory.slice(-6).forEach(msg => {
          messages.push({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content,
          });
        });
      }

      messages.push({
        role: 'user',
        content: options.query,
      });

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.15,  // Lower temperature for factual, consistent answers
          max_tokens: 600,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`[GroqService] API request failed (${response.status}): ${errorText}`);
        return null;
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content?.trim();

      if (!answer) return null;

      const lowerAnswer = answer.toLowerCase();
      const isUnknown =
        lowerAnswer.includes("i'm sorry, i couldn't find") ||
        lowerAnswer.includes("i could not find that information") ||
        lowerAnswer.includes('do not have that information') ||
        lowerAnswer.includes("don't have that detail") ||
        lowerAnswer.includes('kripya hamari team se contact') ||
        lowerAnswer.includes('cannot answer') ||
        lowerAnswer.includes('cannot provide') ||
        lowerAnswer.includes('not available in the context provided') ||
        lowerAnswer.includes('no information about') ||
        lowerAnswer.includes('not mentioned in the') ||
        lowerAnswer.includes("couldn't find that specific information") ||
        lowerAnswer.includes('would you like our team to contact you') ||
        lowerAnswer.includes('would you like to contact the team');

      return {
        content: answer,
        confidence: isUnknown ? 0.2 : 0.85,
        isUnknown,
      };
    } catch (error: any) {
      if (error?.name === 'AbortError' || error?.message?.includes('abort')) {
        logger.warn('[GroqService] Request timed out');
      } else {
        logger.error('[GroqService] Exception during completion:', error);
      }
      return null;
    }
  }

  // ─── RAG System Prompt (Primary) ───────────────────────────────────────────

  /**
   * Strict RAG-mode prompt. Used when semantic chunks have been retrieved.
   * Groq ONLY uses the provided context — no general knowledge, no hallucination.
   */
  private static buildRAGSystemPrompt(options: GroqContextOptions): string {
    const {
      clientName, companyName, botName, language, ragContext,
      businessHours, contactEmail, contactPhone, contactAddress, websiteUrl,
      faqs, conversationHistory,
    } = options;

    const name = companyName || clientName;
    const bot = botName || 'Assistant';

    const contactInfo = [
      businessHours ? `Business Hours: ${businessHours}` : null,
      contactEmail  ? `Contact Email: ${contactEmail}`   : null,
      contactPhone  ? `Contact Phone: ${contactPhone}`   : null,
      contactAddress ? `Address: ${contactAddress}`      : null,
      websiteUrl    ? `Website: ${websiteUrl}`           : null,
    ].filter(Boolean).join('\n');

    const faqContext = (faqs || [])
      .slice(0, 8)
      .map(f => `Q: ${f.question}\nA: ${truncate(f.answer, 350)}`)
      .join('\n\n');

    const languageRule = language === 'hi'
      ? 'Reply ONLY in Hindi or natural Hinglish (Hindi-English mix). Never reply in English only.'
      : 'Reply ONLY in English. Do not switch to other languages.';

    return `You are "${bot}", the official AI assistant for "${name}".

Your ONLY job is to answer questions about "${name}" using the company knowledge provided below.

${contactInfo ? `=== CONTACT & HOURS ===\n${contactInfo}\n` : ''}
${faqContext ? `=== FAQs ===\n${faqContext}\n` : ''}
=== COMPANY KNOWLEDGE (retrieved for this question) ===
${ragContext || 'No specific knowledge found for this query.'}

=== STRICT RULES — FOLLOW EXACTLY ===
1. ${languageRule}
2. Answer ONLY from the company knowledge above. Do NOT use general knowledge.
3. NEVER invent or guess: products, services, prices, menu items, policies, hours, contact details, or staff names.
4. NEVER show navigation text, CTA button text, or HTML/code in your response.
5. NEVER repeat the same sentence or paragraph twice.
6. If the answer is NOT in the knowledge above, respond EXACTLY with:
   - English: "I'm sorry, I couldn't find that information. Would you like our team to contact you?"
   - Hindi: "Mujhe yeh jaankari nahi mili. Kya aap chahenge ki hamari team aapko contact kare?"
7. Keep responses concise: 2–5 sentences for most questions. Use bullet points for lists.
8. NEVER mention OpenAI, Groq, Llama, or any AI model or tool name.
9. Do NOT assume the business type — infer it from the knowledge provided above.
10. If answering a follow-up (e.g., "how much?") — resolve it from the conversation context above.`;
  }

  // ─── Legacy System Prompt (Fallback) ──────────────────────────────────────

  /**
   * Legacy prompt used when RAG chunks are not available (e.g., embeddings not yet generated).
   * Sends cleaned website content directly. Preserved for backward compatibility.
   */
  private static buildSystemPrompt(options: GroqContextOptions): string {
    const {
      clientName, companyName, botName, language, intent,
      faqs, knowledgeItems, websiteContent,
      businessHours, contactEmail, contactPhone, contactAddress, websiteUrl
    } = options;

    const faqContext = (faqs || [])
      .map(f => `Q: ${f.question}\nA: ${truncate(f.answer, 400)}`)
      .join('\n\n');

    const kbContext = (knowledgeItems || [])
      .filter(k => !k.tags?.includes?.('rag_chunk'))  // Skip RAG chunks in legacy mode
      .map(k => `${k.title}: ${truncate(k.content, 400)}`)
      .join('\n\n');

    // Clean and deduplicate website content
    const cleanedWebContent = (websiteContent || [])
      .slice(0, 15)
      .map(w => {
        const cleaned = cleanScrapedContent(deduplicateContent(w.content));
        if (!cleaned || cleaned.length < 10) return null;
        const cleanedTitle = cleanScrapedContent(w.title || '');
        const display = cleanedTitle && cleanedTitle !== cleaned
          ? `[${w.category.toUpperCase()}] ${cleanedTitle}: ${truncate(cleaned, 350)}`
          : `[${w.category.toUpperCase()}] ${truncate(cleaned, 400)}`;
        return display;
      })
      .filter(Boolean)
      .join('\n\n');

    const businessInfo = [
      `Business Name: ${companyName || clientName}`,
      websiteUrl    ? `Website: ${websiteUrl}`             : null,
      businessHours ? `Business Hours: ${businessHours}`   : null,
      contactEmail  ? `Contact Email: ${contactEmail}`     : null,
      contactPhone  ? `Contact Phone: ${contactPhone}`     : null,
      contactAddress ? `Address: ${contactAddress}`        : null,
    ].filter(Boolean).join('\n');

    const intentGuidance = intent && intent !== 'unknown'
      ? `\nThe user's intent appears to be: "${intent}". Focus your answer on this topic.`
      : '';

    return `You are "${botName || 'Assistant'}", the official AI chatbot for "${companyName || clientName}". You help visitors of this business's website with their questions.

IMPORTANT: You do NOT know the type of this business in advance. Figure it out from the context provided below. This business may be a web agency, hotel, restaurant, school, hospital, e-commerce store, or anything else. Do NOT assume it's a restaurant or hotel just because chatbot templates exist for those.

=== BUSINESS INFORMATION ===
${businessInfo || 'Not provided'}

=== FAQs ===
${faqContext || 'None'}

=== KNOWLEDGE BASE ===
${kbContext || 'None'}

=== WEBSITE CONTENT (from website scan) ===
${cleanedWebContent || 'None'}${intentGuidance}

=== STRICT RULES ===
1. Reply ONLY in ${language === 'hi' ? 'Hindi or Hinglish (natural mix)' : 'English'}.
2. PRIORITY ORDER for answering: FAQs > Knowledge Base > Website Content. Always prefer the most specific source.
3. ONLY answer using the information provided above. Do NOT use general knowledge or make up facts.
4. NEVER invent prices, services, contact details, hours, or any business info not in the context above.
5. NEVER assume this is a restaurant or hotel. Answer based on what the business actually is per the context.
6. NEVER show raw tags like [MENU_ITEM], [PRICING], [STRUCTURED DATA], HTML code, or navigation text in your response.
7. NEVER mention OpenAI, Groq, Llama, or any AI/tool names.
8. If the information is not in any of the provided context sections, say: "I couldn't find that specific information. Would you like to contact the team directly?" Do NOT make up an answer.
9. Keep responses concise (3-6 sentences for most queries), friendly, and helpful.
10. When listing items (services, plans, prices etc.), use a clean bullet list format.`;
  }
}
