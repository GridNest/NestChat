import { KnowledgeMatch, KnowledgeEngine } from './knowledgeEngine';
import { LanguageEngine, Language } from './languageEngine';
import { DEFAULT_QUICK_ACTIONS } from '@nestchat/shared';

export interface BotResponse {
  content: string;
  messageType: 'text' | 'quickAction' | 'inquiry' | 'system';
  metadata: {
    matchedType: 'faq' | 'knowledge' | 'quickAction' | 'unknown';
    matchedId?: string;
    confidence: number;
  };
  quickActions?: typeof DEFAULT_QUICK_ACTIONS;
  suggestedQuestions?: string[];
}

export interface ResponseEngineOptions {
  clientId: string;
  language: Language;
  query: string;
  clientName: string;
  conversationHistory?: Array<{ sender: string; content: string }>;
}

export class ResponseEngine {
  static async generateResponse(options: ResponseEngineOptions): Promise<BotResponse> {
    const { clientId, language, query, clientName, conversationHistory } = options;

    const match = await KnowledgeEngine.search({
      clientId,
      language,
      query,
    });

    if (match.found) {
      return this.buildMatchResponse(match, language);
    }

    return this.buildUnknownResponse(language, query);
  }

  private static buildMatchResponse(match: KnowledgeMatch, language: Language): BotResponse {
    if (match.type === 'faq' || match.type === 'knowledge') {
      const content = language === 'hi' && match.answerHi ? match.answerHi : match.answer || '';

      return {
        content,
        messageType: 'text',
        metadata: {
          matchedType: match.type,
          matchedId: match.matchedId,
          confidence: match.confidence,
        },
      };
    }

    if (match.type === 'quickAction') {
      return {
        content: this.getQuickActionResponse(match.matchedId || '', language),
        messageType: 'quickAction',
        metadata: {
          matchedType: 'quickAction',
          matchedId: match.matchedId,
          confidence: match.confidence,
        },
      };
    }

    return this.buildUnknownResponse(language, '');
  }

  private static buildUnknownResponse(language: Language, query: string): BotResponse {
    const unknownMessage = LanguageEngine.getUnknownResponse(language);

    return {
      content: unknownMessage,
      messageType: 'text',
      metadata: {
        matchedType: 'unknown',
        confidence: 0,
      },
      quickActions: DEFAULT_QUICK_ACTIONS,
    };
  }

  private static getQuickActionResponse(actionId: string, language: Language): string {
    const responses: Record<string, { en: string; hi: string }> = {
      services: {
        en: 'We offer the following services:\n\n1. Web Development\n2. Mobile App Development\n3. UI/UX Design\n4. Digital Marketing\n5. SEO Optimization\n\nWould you like to know more about any specific service?',
        hi: 'Hum ye sevayein dete hain:\n\n1. Web Development\n2. Mobile App Development\n3. UI/UX Design\n4. Digital Marketing\n5. SEO Optimization\n\nKya aap kisi specific service ke baare mein jaanna chahte hain?',
      },
      pricing: {
        en: 'Our pricing starts at:\n\n• Basic Plan: $99/month\n• Pro Plan: $199/month\n• Enterprise: Custom pricing\n\nWould you like to know more about any specific plan?',
        hi: 'Humari pricing aise shuru hoti hai:\n\n• Basic Plan: $99/month\n• Pro Plan: $199/month\n• Enterprise: Custom pricing\n\nKya aap kisi specific plan ke baare mein jaanna chahte hain?',
      },
      portfolio: {
        en: 'You can view our portfolio at:\n\n🌐 www.example.com/portfolio\n\nWe have completed 100+ projects across various industries.\n\nWould you like to see specific project examples?',
        hi: 'Aap humara portfolio yahan dekh sakte hain:\n\n🌐 www.example.com/portfolio\n\nHumne vibhinna industries mein 100+ projects complete kiye hain.\n\nKya aap specific project examples dekhna chahte hain?',
      },
      book_consultation: {
        en: 'I can help you book a consultation.\n\nPlease share your details:\n• Name\n• Email\n• Phone\n• Preferred time\n\nOur team will contact you within 24 hours.',
        hi: 'Main aapki consultation book karne mein madad kar sakta hu.\n\nKripya apni details share karein:\n• Naam\n• Email\n• Phone\n• Pasand ka time\n\nHamari team 24 ghante mein aapse contact karegi.',
      },
      contact: {
        en: 'You can reach us at:\n\n📧 Email: info@example.com\n📞 Phone: +1 234 567 890\n📍 Address: 123 Main Street, City\n\nOffice Hours: Mon-Fri, 9AM-6PM',
        hi: 'Aap humse yahan sampark kar sakte hain:\n\n📧 Email: info@example.com\n📞 Phone: +1 234 567 890\n📍 Address: 123 Main Street, City\n\nOffice Hours: Mon-Fri, 9AM-6PM',
      },
      get_quote: {
        en: 'I can help you get a quote.\n\nPlease share your requirements:\n• Project type\n• Budget range\n• Timeline\n\nOur team will provide a detailed quote within 24 hours.',
        hi: 'Main aapki quote lene mein madad kar sakta hu.\n\nKripya apni requirements share karein:\n• Project type\n• Budget range\n• Timeline\n\nHamari team 24 ghante mein detailed quote provide karegi.',
      },
    };

    const response = responses[actionId];
    if (response) {
      return language === 'hi' ? response.hi : response.en;
    }

    return language === 'hi'
      ? 'Main aapki madad karna chahta hu. Kripya batayein aapko kya chahiye?'
      : 'I would like to help you. Please let me know what you need?';
  }

  static getWelcomeResponse(language: Language, clientName: string): string {
    return LanguageEngine.getGreetingMessage(language, clientName);
  }

  static getTypingDelay(): number {
    return 1000;
  }

  static getSuggestedQuestions(language: Language): string[] {
    if (language === 'hi') {
      return [
        'Aapki sevayein kya hain?',
        'Kitna charge lagta hai?',
        'Aapka portfolio dikhaiye',
        'Consultation book karein',
        'Contact details batayein',
      ];
    }
    return [
      'What services do you offer?',
      'What are your pricing plans?',
      'Can I see your portfolio?',
      'Book a consultation',
      'What are your contact details?',
    ];
  }
}
