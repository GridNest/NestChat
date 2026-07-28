import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export interface GroqContextOptions {
  clientName: string;
  companyName: string;
  websiteType?: string;
  botName?: string;
  businessHours?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  language: string;
  query: string;
  intent?: string;
  faqs?: Array<{ question: string; answer: string }>;
  knowledgeItems?: Array<{ title: string; content: string }>;
  websiteContent?: Array<{ title: string; content: string; category: string }>;
  conversationHistory?: Array<{ sender: string; content: string }>;
}

export interface GroqResponse {
  content: string;
  confidence: number;
  isUnknown: boolean;
}

// Cleans raw scraped website content before sending to AI
function cleanScrapedContent(raw: string): string {
  return raw
    // Remove tag prefixes like [MENU_ITEM], [PRICING], [CTA], [STRUCTURED DATA], etc.
    .replace(/^\s*\[[\w_ ]+\]\s*/gm, '')
    // Remove structured data blocks entirely
    .replace(/\[STRUCTURED DATA\].*?(\n|$)/g, '')
    // Remove navigation boilerplate (e.g., "Home Menu Gallery About Testimonials Contact")
    .replace(/^(Home|Menu|Gallery|About|Testimonials|Contact|Login|Register|Sign In|Sign Up|Cart|Search|Navigation)[\s|•|/]+.{0,200}$/gm, '')
    // Remove repeated whitespace/newlines
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{3,}/g, ' ')
    .trim();
}

function truncate(str: string, maxLen: number): string {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}

export class GroqService {
  static async generateCompletion(options: GroqContextOptions): Promise<GroqResponse | null> {
    const apiKey = env.GROQ_API_KEY;
    if (!apiKey) {
      logger.warn('[GroqService] No Groq API Key configured');
      return null;
    }

    try {
      const systemPrompt = this.buildSystemPrompt(options);
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
      ];

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
          temperature: 0.2,
          max_tokens: 800,
        }),
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
      const isUnknown = lowerAnswer.includes('do not have that information') ||
                        lowerAnswer.includes("don't have that detail") ||
                        lowerAnswer.includes('kripya hamari team se contact') ||
                        lowerAnswer.includes('cannot answer') ||
                        lowerAnswer.includes('cannot provide') ||
                        lowerAnswer.includes('not available in the context provided') ||
                        lowerAnswer.includes('no information about') ||
                        lowerAnswer.includes('not mentioned in the') ||
                        lowerAnswer.includes("couldn't find that specific information");

      return {
        content: answer,
        confidence: isUnknown ? 0.2 : 0.9,
        isUnknown,
      };
    } catch (error) {
      logger.error('[GroqService] Exception during completion:', error);
      return null;
    }
  }

  private static buildSystemPrompt(options: GroqContextOptions): string {
    const {
      clientName, companyName, botName, language, intent,
      faqs, knowledgeItems, websiteContent,
      businessHours, contactEmail, contactPhone, contactAddress
    } = options;

    const faqContext = (faqs || [])
      .map(f => `Q: ${f.question}\nA: ${truncate(f.answer, 400)}`)
      .join('\n\n');

    const kbContext = (knowledgeItems || [])
      .map(k => `${k.title}: ${truncate(k.content, 400)}`)
      .join('\n\n');

    // Clean and deduplicate website content, limit to 15 most relevant
    const cleanedWebContent = (websiteContent || [])
      .slice(0, 15)
      .map(w => {
        const cleaned = cleanScrapedContent(w.content);
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
      businessHours ? `Business Hours: ${businessHours}` : null,
      contactEmail ? `Contact Email: ${contactEmail}` : null,
      contactPhone ? `Contact Phone: ${contactPhone}` : null,
      contactAddress ? `Address: ${contactAddress}` : null,
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

=== WEBSITE CONTENT (scraped from website) ===
${cleanedWebContent || 'None'}${intentGuidance}

=== STRICT RULES ===
1. Reply ONLY in ${language === 'hi' ? 'Hindi or Hinglish (natural mix)' : 'English'}.
2. ONLY answer using the information provided above. Do NOT use general knowledge.
3. NEVER invent prices, services, contact details, hours, or any business info not in the context above.
4. NEVER assume this is a restaurant or hotel. Answer based on what the business actually is per the context.
5. NEVER show raw tags like [MENU_ITEM], [PRICING], [STRUCTURED DATA], HTML code, or navigation text.
6. NEVER mention OpenAI, Groq, Llama, or any AI model.
7. If the information is not in the context, say: "I couldn't find that specific information. Would you like to contact the team directly?" Do NOT make up an answer.
8. Keep responses concise (3-6 sentences max for most queries), friendly, and helpful.
9. When listing items (services, plans, prices etc.), use a clean bullet list format.`;
  }
}

  }
}
