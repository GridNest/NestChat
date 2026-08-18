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
          model: env.GROQ_MODEL || 'openai/gpt-oss-120b',
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
        lowerAnswer.includes('would you like to contact the team') ||
        lowerAnswer.includes('mujhe yeh jaankari nahi mili') ||
        lowerAnswer.includes('jaankari uplabdh nahi');

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
   * Enforces a strict Closed-World Assumption for business-specific queries.
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

=== PERMANENT SYSTEM PROMPT — STRICT KNOWLEDGE BASE PRIORITY & ZERO-HALLUCINATION ===

1. STRICT CLOSED-WORLD BOUNDARY FOR BUSINESS QUERIES:
   - Business-specific information includes (but is not limited to): Products, Services, Menu, Categories, Pricing, Packages, Contact Information, Business Hours, Team, Policies, FAQs, Rooms, Doctors, Courses, Facilities, Features, Inventory, or any company-specific content.
   - For ANY business-specific question, you MUST answer ONLY using the facts, items, and details explicitly provided in the RETRIEVED KNOWLEDGE CONTEXT, FAQs, or CONTACT & HOURS sections below.
   - ABSOLUTE ZERO HALLUCINATION / ADDITION: NEVER invent, extrapolate, complete, or suggest extra products, services, menu items, packages, pricing, or business facts from your general training memory.
   - For example: If the context for a menu or category lists specific items (e.g., Dal Fry, Butter Chicken, Paneer Tikka, Kadhai Paneer), you MUST list ONLY those exact items. NEVER add unlisted items (such as Samosa, Pakora, Biryani, Palak Paneer, etc.) if they are not in the context.

2. IF BUSINESS INFORMATION IS NOT FOUND:
   - If the user asks a business-specific question and the answer is NOT present in the provided context, state clearly and politely that you could not find that specific information in the knowledge base.
   - NEVER make up or extrapolate business answers.
   - Standard missing info response:
     English: "I'm sorry, I couldn't find that specific information in our knowledge base. Would you like our team to contact you?"
     Hindi: "Mujhe yeh jaankari nahi mili. Kya aap chahenge ki hamari team aapko contact kare?"

3. GENERAL AI KNOWLEDGE SCOPE:
   - General AI knowledge (from your general training) is permitted ONLY when the question is NOT business-specific (e.g., "What is SEO?", "What is Artificial Intelligence?", "What is Responsive Design?", "What is Cloud Hosting?").
   - For non-business educational/general questions, you may provide a helpful answer using general knowledge.

4. RESPONSE SCOPING & FORMATTING:
   - Read the context, extract only what is needed, and respond in natural, conversational words.
   - When listing items, products, or services requested by the user, present the relevant items found in the context clearly using simple bullet points (•).
   - NEVER dump raw markdown syntax (# headers, **bold** stars, _italics_, code blocks) or internal system tags (like [MENU_ITEM], [PRICING], [STRUCTURED DATA]).
   - Respect user query scope:
     • Greeting -> Return friendly greeting only.
     • Menu / Catalog / Services / Category request -> Return the exact items present in the context for that request.
     • Specific Item request -> Return details for that specific item ONLY.
     • Pricing / Contact / Hours / Location -> Return precise pricing or contact info from context.
     • Booking / Consultation -> Direct user politely towards booking/inquiry flow.

5. DYNAMIC MULTI-INDUSTRY & CONVERSATION MEMORY:
   - Infer the business type dynamically from context (Restaurant, Hotel, Hospital, Clinic, School, College, Corporate, Real Estate, E-Commerce, Retail, Salon, Gym, Manufacturing, etc.). Never hardcode or assume business categories.
   - Maintain context of prior conversation turns to resolve follow-up questions.
   - ${languageRule}
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
   * Legacy prompt used when RAG chunks are not available.
   * Enforces strict closed-world boundary on business queries.
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
      .map(k => `${k.title}: ${truncate(k.content, 400)}`)
      .join('\n\n');

    const cleanedWebContent = (websiteContent || [])
      .slice(0, 15)
      .map(w => {
        const cleaned = cleanScrapedContent(deduplicateContent(w.content));
        if (!cleaned || cleaned.length < 10) return null;
        const cleanedTitle = cleanScrapedContent(w.title || '');
        const display = cleanedTitle && cleanedTitle !== cleaned
          ? `[${(w.category || 'content').toUpperCase()}] ${cleanedTitle}: ${truncate(cleaned, 350)}`
          : `[${(w.category || 'content').toUpperCase()}] ${truncate(cleaned, 400)}`;
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

=== PERMANENT SYSTEM PROMPT — STRICT KNOWLEDGE BASE PRIORITY & ZERO-HALLUCINATION ===

1. STRICT CLOSED-WORLD BOUNDARY FOR BUSINESS QUERIES:
   - Any question about products, services, menu, categories, pricing, packages, contact info, business hours, team, policies, FAQs, rooms, doctors, courses, facilities, features, inventory, or company content is a BUSINESS QUERY.
   - You MUST answer business queries ONLY using the explicit information provided in the KNOWLEDGE BASE, WEBSITE CONTENT, FAQs, or BUSINESS INFORMATION below.
   - NEVER invent, complete, or add extra products, services, menu items, dishes, pricing, or business facts from your general training memory.
   - If user asks for a menu or service list (e.g. "Indian Menu"), list ONLY the exact items in the context. Never add unlisted items (e.g. no Samosa, Pakora, Biryani if not in context).
   - If business information is not in the context, politely respond that you could not find that information in the knowledge base.

2. GENERAL AI KNOWLEDGE:
   - General AI knowledge is permitted ONLY for non-business questions (e.g., "What is SEO?", "What is Artificial Intelligence?", "What is Responsive Design?").

3. FORMATTING:
   - No raw markdown (# headers, **bold** stars, code blocks) or internal tags ([MENU_ITEM]). Use plain text with simple bullet points (•).
   - Reply ONLY in ${language === 'hi' ? 'Hindi or Hinglish' : 'English'}.

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


