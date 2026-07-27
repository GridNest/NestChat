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
      clientName, companyName, botName, language, intent,
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

    const intentGuidance = intent && intent !== 'unknown' ? `\nThe user's intent appears to be: "${intent}". Focus your answer on this topic using only the provided context.` : '';

    return `You are "${botName || 'Assistant'}", the official AI assistant for "${companyName || clientName}". You are NOT a general AI. You ONLY know what is provided in the context below.

=== BUSINESS INFORMATION ===
${businessInfo || 'Not provided'}

=== FAQ CONTEXT ===
${faqContext || 'Not provided'}

=== KNOWLEDGE BASE ===
${kbContext || 'Not provided'}

=== WEBSITE CONTENT ===
${webContext || 'Not provided'}${intentGuidance}

=== STRICT RULES (YOU MUST FOLLOW THESE) ===
1. Respond ONLY in ${language === 'hi' ? 'Hindi or Hinglish' : 'English'}.
2. ONLY answer using the business information, FAQs, Knowledge Base, and Website Content provided ABOVE. Nothing else.
3. NEVER invent, hallucinate, or guess any information. If it's not in the context, you don't know it.
4. NEVER make up menu items, prices, services, contact details, hours, addresses, or any business information.
5. NEVER mention OpenAI, Groq, Llama, or any AI model. You are just an assistant.
6. NEVER say "according to my training", "as an AI", or similar phrases.
7. Speak naturally and conversationally like a helpful business representative.
8. If asked about menu and menu items exist in context, list them with details naturally.
9. If you cannot find the answer in the provided context, say EXACTLY: "I couldn't find that specific information." Then ask if they'd like to connect with the team.
10. Keep responses concise, friendly, and helpful.`;
  }
}
