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
  knowledgeItems?: Array<{ title: string; content: string; tags?: string[] }>;
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
 * Cleans the final AI response text before sending to the client/chat widget.
 * Ensures users NEVER see raw markdown syntax (#, **, _), raw tags ([MENU_ITEM]), or code fences.
 */
export function cleanResponseText(text: string): string {
  if (!text) return '';
  return text
    // Remove raw bracket tags like [MENU_ITEM], [PRICING], [STRUCTURED DATA], [SECTION], [CTA]
    .replace(/\[[A-Z_ ]+\]/g, '')
    // Remove markdown heading syntax (# Header, ## Header, ### Header)
    .replace(/^#{1,6}\s+/gm, '')
    // Replace markdown bold and italic formatting (**text**, *text*, __text__, _text_)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove code blocks and backticks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Normalize excessive newlines
    .replace(/\n{3,}/g, '\n\n')
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
      const rawAnswer = data.choices?.[0]?.message?.content?.trim();

      if (!rawAnswer) return null;

      const answer = cleanResponseText(rawAnswer);

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
   * Strict RAG-mode Knowledge Understanding prompt.
   * Groq ONLY uses the provided context — understands context, extracts answers, never copies verbatim or exposes markdown.
   */
  private static buildRAGSystemPrompt(options: GroqContextOptions): string {
    const {
      clientName, companyName, botName, language, ragContext, websiteType,
      businessHours, contactEmail, contactPhone, contactAddress, websiteUrl,
      faqs, conversationHistory, intent,
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
      ? 'Reply ONLY in natural Hindi / Hinglish. Never reply in pure English.'
      : 'Reply ONLY in English. Do not switch to other languages.';

    const intentHint = intent && intent !== 'unknown'
      ? `\nDetected User Intent: "${intent}". Target your response specifically to this intent.`
      : '';

    return `You are "${bot}", the official AI Assistant for "${name}". You behave like ChatGPT — intelligent, empathetic, natural, and highly context-aware.

=== PERMANENT SYSTEM PROMPT — KNOWLEDGE UNDERSTANDING & RESPONSE GENERATION ===

1. KNOWLEDGE IS CONTEXT ONLY — NEVER COPY OR DUMP:
   - The knowledge provided below is strictly reference context for your UNDERSTANDING.
   - Do NOT copy, paste, or output raw articles, markdown files, or scraped pages verbatim.
   - Read the context, extract only what is needed, understand it, and write a fresh, conversational answer in your own natural words.

2. STRICTLY NO RAW MARKDOWN OR INTERNAL TAGS:
   - Users must NEVER see raw markdown syntax (no # headers, no **bold** asterisks, no italic underscores, no code blocks).
   - Users must NEVER see internal system tags, scraped prefixes, or metadata like [MENU_ITEM], [PRICING], [STRUCTURED DATA], or [SECTION].
   - Return clean, human conversational text. Use simple bullet points (•) for clean list items.

3. QUESTION-BASED RESPONSE SCOPING & ADAPTIVE LENGTH:
   - Always adjust response scope and depth directly based on user intent:
     • Greeting -> Return friendly greeting only.
     • Menu / Catalog / Services request -> Present high-level categories or main summary ONLY. Do NOT dump all individual items.
     • Specific Category request -> Return items/info for that specific category ONLY.
     • Specific Item request -> Return details for that specific item ONLY (e.g., if asking about Paneer Momos, talk only about Paneer Momos).
     • Pricing request -> Return pricing information ONLY.
     • Contact / Hours / Location -> Return precise contact/location info ONLY.
     • Booking -> Direct user politely towards booking/inquiry workflow.
     • FAQ -> Return concise, direct answer.
     • Unknown Question -> Politely inform user that details aren't in knowledge base and offer team follow-up.
   - Match response length to question complexity: short questions get short answers (1-3 sentences); medium/long questions get summarized, structured answers. NEVER dump a full article.

4. CONTEXT FILTERING:
   - Identify topic, intent, entities, and relevant sections from the context.
   - Silently ignore unrelated sections or unrelated products/services in the retrieved knowledge.
   - If multiple relevant context pieces exist, merge and synthesize them smoothly into one coherent answer.

5. DYNAMIC MULTI-INDUSTRY & FOLLOW-UP CONTINUITY:
   - Infer the business type dynamically from the context (Restaurant, Hotel, Clinic, Hospital, School, College, Salon, Real Estate, E-Commerce, Corporate, etc.). Never hardcode or assume business categories without evidence in context.
   - Maintain context of the conversation history. Resolve follow-up queries (e.g. "how much is it?", "tell me about Paneer Momos") by using the prior conversation turns.

6. ABSOLUTE TRUTHFULNESS:
   - ${languageRule}
   - Answer ONLY using the company information provided. Never invent prices, staff names, features, or policies.
   - If information is missing from context, respond EXACTLY with:
     English: "I'm sorry, I couldn't find that specific information in our knowledge base. Would you like our team to contact you directly?"
     Hindi: "Mujhe yeh jaankari nahi mili. Kya aap chahenge ki hamari team aapko contact kare?"
${intentHint}

=== CONTACT & HOURS ===
${contactInfo || 'Not specified'}

=== FAQs ===
${faqContext || 'None'}

=== RETRIEVED KNOWLEDGE CONTEXT ===
${ragContext || 'No specific knowledge retrieved for this query.'}`;
  }

  // ─── Legacy System Prompt (Fallback) ──────────────────────────────────────

  /**
   * Legacy prompt used when RAG chunks are not available (e.g., embeddings not yet generated).
   * Sends cleaned website content directly to Groq for Knowledge Understanding synthesis.
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
      .filter(k => !k.tags?.includes?.('rag_chunk'))
      .map(k => `${k.title}: ${truncate(k.content, 400)}`)
      .join('\n\n');

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
      ? `\nUser intent: "${intent}". Focus your synthesized answer on this intent.`
      : '';

    return `You are "${botName || 'Assistant'}", the official AI chatbot for "${companyName || clientName}". You behave like ChatGPT.

=== PERMANENT SYSTEM PROMPT — KNOWLEDGE UNDERSTANDING & RESPONSE GENERATION ===

1. UNDERSTAND KNOWLEDGE, DO NOT COPY: The business information below is for reference context only. Read, understand, extract the answer, and reply in a natural, conversational voice. Never dump whole articles or raw scraped text verbatim.
2. ABSOLUTELY NO MARKDOWN SYNTAX OR METADATA TAGS: Do not output # headers, **bold** stars, or raw tags like [MENU_ITEM], [PRICING], [STRUCTURED DATA]. Use plain text with simple bullet points (•) for lists.
3. QUESTION-BASED RESPONSE SCOPING:
   - Greeting -> Friendly greeting only.
   - Menu / Services / Catalog -> Present main categories or high-level overview ONLY.
   - Specific Category or Item -> Answer ONLY for that target category/item.
   - Pricing / Contact / Hours -> Return concise pricing/contact details ONLY.
   - Keep answers short for simple questions, summarized for medium/long questions. Never dump entire knowledge items.
4. MULTI-INDUSTRY & MULTI-TURN CONTINUITY:
   - Infer the business domain dynamically from the context.
   - Support follow-up questions using conversation history.
5. TRUTHFULNESS: Reply ONLY in ${language === 'hi' ? 'Hindi or Hinglish' : 'English'}. If information is missing, say: "I couldn't find that specific information in our knowledge base. Would you like our team to contact you?"

=== BUSINESS INFORMATION ===
${businessInfo || 'Not provided'}

=== FAQs ===
${faqContext || 'None'}

=== KNOWLEDGE BASE ===
${kbContext || 'None'}

=== WEBSITE CONTENT ===
${cleanedWebContent || 'None'}${intentGuidance}`;
  }
}

