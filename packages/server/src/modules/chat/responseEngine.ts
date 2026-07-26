import { KnowledgeMatch, KnowledgeEngine } from './knowledgeEngine.js';
import { LanguageEngine, Language } from './languageEngine.js';
import { DEFAULT_QUICK_ACTIONS } from '@nestchat/shared';
import { InquiryEngine } from '../inquiry/inquiryEngine.js';

export interface BotResponse {
  content: string;
  messageType: 'text' | 'quickAction' | 'inquiry' | 'system';
  metadata: {
    matchedType: 'faq' | 'knowledge' | 'quickAction' | 'unknown' | 'inquiry_trigger';
    matchedId?: string;
    confidence: number;
  };
  quickActions?: typeof DEFAULT_QUICK_ACTIONS;
  suggestedQuestions?: string[];
  triggerInquiry?: boolean;
}

export interface ResponseEngineOptions {
  clientId: string;
  language: Language;
  query: string;
  clientName: string;
  conversationHistory?: Array<{ sender: string; content: string }>;
  isInquiryMode?: boolean;
}

export class ResponseEngine {
  static async generateResponse(options: ResponseEngineOptions): Promise<BotResponse> {
    const { clientId, language, query, clientName, conversationHistory, isInquiryMode } = options;

    if (InquiryEngine.isCancelRequest(query)) {
      return {
        content: LanguageEngine.getInquiryCancelled(language),
        messageType: 'text',
        metadata: {
          matchedType: 'unknown',
          confidence: 1,
        },
      };
    }

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
      const response = this.getQuickActionResponse(match.matchedId || '', language);
      const shouldTriggerInquiry = match.matchedId === 'get_quote' || match.matchedId === 'book_consultation';

      return {
        content: response,
        messageType: shouldTriggerInquiry ? 'inquiry' : 'quickAction',
        metadata: {
          matchedType: 'quickAction',
          matchedId: match.matchedId,
          confidence: match.confidence,
        },
        triggerInquiry: shouldTriggerInquiry,
      };
    }

    return this.buildUnknownResponse(language, '');
  }

  private static buildUnknownResponse(language: Language, query: string): BotResponse {
    const unknownMessage = LanguageEngine.getUnknownResponse(language);

    return {
      content: unknownMessage,
      messageType: 'inquiry',
      metadata: {
        matchedType: 'unknown',
        confidence: 0,
      },
      triggerInquiry: true,
    };
  }

  private static getQuickActionResponse(actionId: string, language: Language): string {
    const responses: Record<string, { en: string; hi: string }> = {
      menu: {
        en: '🍽️ **Luxe Restaurant Menu Highlights:**\n\n• Truffle Infused Risotto - $34\n• Wagyu Beef Tenderloin - $58\n• Pan-Seared Chilean Sea Bass - $46\n• Artisanal Tiramisu - $16\n\nWould you like to reserve a table or view our full menu?',
        hi: '🍽️ **Luxe Restaurant Menu Highlights:**\n\n• Truffle Infused Risotto - $34\n• Wagyu Beef Tenderloin - $58\n• Pan-Seared Chilean Sea Bass - $46\n• Artisanal Tiramisu - $16\n\nKya aap table reserve karna chahte hain?',
      },
      reservations: {
        en: '🍷 **Table Reservations:**\n\nYou can reserve a table by contacting us directly or letting us know your preferred date, time, and number of guests!',
        hi: '🍷 **Table Reservations:**\n\nAap humse sampark karke ya apni pasand ki date aur time batakar table reserve kar sakte hain!',
      },
      hours: {
        en: '⏰ **Opening Hours:**\n\nMonday - Sunday: 12:00 PM - 11:30 PM\nDinner Service: 5:00 PM - 11:00 PM',
        hi: '⏰ **Khulne ka Samay:**\n\nSomvar - Ravivar: 12:00 PM - 11:30 PM',
      },
      services: {
        en: 'We offer the following services:\n\n1. Gourmet Dining & Fine Wines\n2. Private Event Catering\n3. Table Reservations\n4. Chef Special Tasting Menus\n\nWould you like to know more about any specific service?',
        hi: 'Hum ye sevayein dete hain:\n\n1. Gourmet Dining & Fine Wines\n2. Private Event Catering\n3. Table Reservations\n4. Chef Special Tasting Menus',
      },
      pricing: {
        en: 'Our menu items range from $16 to $60 per dish. We also offer tasting menus starting at $95 per guest.',
        hi: 'Humare menu items $16 se $60 ke beech hain.',
      },
      portfolio: {
        en: 'You can view our dishes and gallery on our website under the GALLERY section!',
        hi: 'Aap humare dishes website ke GALLERY section mein dekh sakte hain!',
      },
      book_consultation: {
        en: 'I can help you book a table or event consultation.\n\nPlease share your details:\n• Name\n• Email\n• Phone\n• Date & Time\n\nOur team will confirm your booking within 24 hours.',
        hi: 'Main aapki table reservation mein madad kar sakta hu.\n\nKripya apni details share karein:\n• Naam\n• Email\n• Phone\n• Date & Time',
      },
      contact: {
        en: 'You can reach Luxe Restaurant at:\n\n📧 Email: contact@luxerestaurant.com\n📞 Phone: +1 234 567 890\n📍 Address: Gourmet Avenue, City\n\nOpening Hours: Mon-Sun, 12PM-11:30PM',
        hi: 'Aap humse yahan sampark kar sakte hain:\n\n📧 Email: contact@luxerestaurant.com\n📞 Phone: +1 234 567 890\n📍 Address: Gourmet Avenue, City\n\nOpening Hours: Mon-Sun, 12PM-11:30PM',
      },
      get_quote: {
        en: 'I can help you get a catering quote.\n\nPlease share your requirements:\n• Guest count\n• Event type\n• Preferred date',
        hi: 'Main aapki catering quote lene mein madad kar sakta hu.',
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
