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
        options.conversationHistory.slice(-8).forEach(msg => {
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
          max_tokens: 1024,
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
                        lowerAnswer.includes('not mentioned in the');

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
      clientName, companyName, botName, language,
      faqs, knowledgeItems, websiteContent,
      businessHours, contactEmail, contactPhone, contactAddress
    } = options;

    const faqContext = (faqs || []).map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
    const kbContext = (knowledgeItems || []).map(k => `Title: ${k.title}\nContent: ${k.content}`).join('\n\n');
    const webContext = (websiteContent || []).map(w => `[${w.category.toUpperCase()}] ${w.title}: ${w.content}`).join('\n');

    const businessInfo = [
      `Business Name: ${companyName || clientName}`,
      businessHours ? `Business Hours: ${businessHours}` : null,
      contactEmail ? `Contact Email: ${contactEmail}` : null,
      contactPhone ? `Contact Phone: ${contactPhone}` : null,
      contactAddress ? `Address: ${contactAddress}` : null,
    ].filter(Boolean).join('\n');

    return `You are "${botName || 'Assistant'}", the official AI assistant for "${companyName || clientName}".

=== BUSINESS INFORMATION ===
${businessInfo || 'No specific business information provided.'}

=== FAQ CONTEXT ===
${faqContext || 'No FAQs available.'}

=== KNOWLEDGE BASE ===
${kbContext || 'No knowledge base articles available.'}

=== WEBSITE CONTENT ===
${webContext || 'No website content indexed.'}

=== STRICT RULES ===
1. Respond in ${language === 'hi' ? 'Hindi (or Hinglish)' : 'English'}.
2. ONLY answer using the business information, FAQs, Knowledge Base, and Website Content provided above.
3. NEVER invent, hallucinate, or guess information not present in the provided context.
4. NEVER make up menu items, prices, services, contact details, or any business information.
5. If the information exists in the context, provide it clearly and directly.
6. If you cannot find the answer in the provided context, say: "I couldn't find that specific information in our database." Then ask if they'd like to contact the business.
7. Keep responses friendly, professional, concise, and helpful.
8. For menu-related queries, list available items with their details if present in the context.`;
  }
}
