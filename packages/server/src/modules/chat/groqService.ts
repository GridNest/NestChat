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
  language: string;
  query: string;
  faqs?: Array<{ question: string; answer: string }>;
  knowledgeItems?: Array<{ title: string; content: string }>;
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
          temperature: 0.3,
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
                        lowerAnswer.includes('kripya hamari team se contact');

      return {
        content: answer,
        confidence: isUnknown ? 0.3 : 0.9,
        isUnknown,
      };
    } catch (error) {
      logger.error('[GroqService] Exception during completion:', error);
      return null;
    }
  }

  private static buildSystemPrompt(options: GroqContextOptions): string {
    const { clientName, companyName, botName, language, faqs, knowledgeItems, businessHours, contactEmail, contactPhone } = options;

    const faqContext = (faqs || []).map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
    const kbContext = (knowledgeItems || []).map(k => `Title: ${k.title}\nContent: ${k.content}`).join('\n\n');

    return `You are "${botName || 'Assistant'}", an intelligent multi-tenant AI assistant for "${companyName || clientName}".

=== BUSINESS CONTEXT ===
Business Name: ${companyName || clientName}
Business Hours: ${businessHours || 'Monday-Sunday 12:00 PM - 11:30 PM'}
Contact Email: ${contactEmail || 'info@luxerestaurant.com'}
Contact Phone: ${contactPhone || '+1 234 567 890'}

=== FAQ CONTEXT ===
${faqContext || 'No additional FAQs registered.'}

=== KNOWLEDGE BASE CONTEXT ===
${kbContext || 'No additional Knowledge Base articles registered.'}

=== STRICT RULES ===
1. Respond in language: ${language === 'hi' ? 'Hindi (or Hinglish)' : 'English'}.
2. ONLY answer using the business context, FAQs, and Knowledge Base provided above.
3. NEVER invent or hallucinate information outside this business.
4. If you cannot answer based on the context, politely state that you don't have that specific detail and offer to connect them with the team or collect their contact details.
5. Keep responses friendly, professional, concise, and helpful.`;
  }
}
