import { KnowledgeMatch, KnowledgeEngine } from './knowledgeEngine.js';
import { LanguageEngine, Language } from './languageEngine.js';
import { IntentDetector, Intent } from './intentDetector.js';
import { DEFAULT_QUICK_ACTIONS } from '@nestchat/shared';
import { InquiryEngine } from '../inquiry/inquiryEngine.js';
import { GroqService } from './groqService.js';
import { FAQModel } from '../faq/faq.model.js';
import { KnowledgeModel } from '../knowledge/knowledge.model.js';
import { WebsiteContentModel } from '../websiteContent/websiteContent.model.js';
import { ClientModel } from '../client/client.model.js';
import { ClientConfigModel } from '../clientConfig/clientConfig.model.js';
import mongoose from 'mongoose';

export interface BotResponse {
  content: string;
  messageType: 'text' | 'quickAction' | 'inquiry' | 'system';
  metadata: {
    matchedType: 'faq' | 'knowledge' | 'quickAction' | 'website' | 'unknown' | 'inquiry_trigger';
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

const MENU_CATEGORY_KEYWORDS: Record<string, string[]> = {
  breakfast: ['breakfast', 'morning', 'brunch'],
  lunch: ['lunch', 'afternoon'],
  dinner: ['dinner', 'evening', 'night'],
  desserts: ['dessert', 'sweet', 'ice cream', 'cake', 'pastry', 'mousse'],
  drinks: ['drink', 'beverage', 'juice', 'soda', 'cocktail', 'mocktail', 'coffee', 'tea', 'wine', 'beer'],
  appetizers: ['appetizer', 'starter', 'snack', 'finger food', 'appetiser'],
  main_course: ['main course', 'main', 'entree', 'entrée'],
  specials: ['special', 'chef special', 'today special', 'recommended'],
};

export class ResponseEngine {
  private static async resolveClientIds(clientId: string): Promise<mongoose.Types.ObjectId[]> {
    if (!clientId) return [];
    const validIds: mongoose.Types.ObjectId[] = [];

    if (mongoose.Types.ObjectId.isValid(clientId)) {
      validIds.push(new mongoose.Types.ObjectId(clientId));
    }

    const client = await ClientModel.findOne({
      $or: [
        { clientId: clientId.trim().toLowerCase() },
        ...(mongoose.Types.ObjectId.isValid(clientId) ? [{ _id: new mongoose.Types.ObjectId(clientId) }] : [])
      ]
    }).lean();

    if (client) {
      if (!validIds.some(id => id.toString() === client._id.toString())) {
        validIds.push(client._id as mongoose.Types.ObjectId);
      }
    }

    return validIds;
  }
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

    // Detect intent first
    const intent = IntentDetector.detect(query, language);

    // Handle greeting intent directly
    if (intent.intent === 'greeting' && intent.confidence > 0.6) {
      const greetingMsg = language === 'hi'
        ? `Namaste! 👋 Aap ${clientName} ke AI Assistant mein hain. Main aapki kaise madad kar sakta hoon?`
        : `Hello! 👋 You're chatting with the ${clientName} AI Assistant. How can I help you today?`;
      return {
        content: greetingMsg,
        messageType: 'text',
        metadata: { matchedType: 'unknown', confidence: 1 },
        suggestedQuestions: this.getSuggestedQuestions(language),
      };
    }

    // Handle FAQ intent - show only question list
    if (intent.intent === 'faq') {
      const faqMatch = await KnowledgeEngine.search({ clientId, language, query });
      if (faqMatch.found) {
        return this.buildMatchResponse(faqMatch, language, clientId, query);
      }
    }

    // Handle human agent intent
    if (intent.intent === 'human_agent') {
      return {
        content: language === 'hi'
          ? 'Main aapko humari team se connect kar raha hoon. Kripya kuch der pratiksha karein.'
          : 'I am connecting you with our team. Please wait a moment.',
        messageType: 'text',
        metadata: { matchedType: 'unknown', confidence: 1 },
        triggerInquiry: true,
      };
    }

    // Layer 1: Knowledge Engine Search (FAQ, KB, Website Content)
    let match = await KnowledgeEngine.search({
      clientId,
      language,
      query,
    });

    // Layer 2: Contextual re-match with conversation history
    if (!match.found && conversationHistory && conversationHistory.length > 0) {
      const lastUserMsg = conversationHistory.filter(m => m.sender === 'user').pop();
      if (lastUserMsg && lastUserMsg.content && lastUserMsg.content.trim() !== query.trim()) {
        const contextualQuery = `${lastUserMsg.content.trim()} ${query.trim()}`;
        const contextMatch = await KnowledgeEngine.search({
          clientId,
          language,
          query: contextualQuery,
        });
        if (contextMatch.found) {
          match = contextMatch;
        }
      }
    }

    // Check if it's a follow-up query about a previous topic (conversation memory)
    if (!match.found && conversationHistory && conversationHistory.length >= 2) {
      const lastBotMsg = [...conversationHistory].reverse().find(m => m.sender === 'bot');
      if (lastBotMsg && this.isFollowUpQuery(query, lastBotMsg.content)) {
        const combinedQuery = `${lastBotMsg.content} ${query}`;
        const followUpMatch = await KnowledgeEngine.search({
          clientId,
          language,
          query: combinedQuery,
        });
        if (followUpMatch.found) {
          match = followUpMatch;
        }
      }
    }

    if (match.found) {
      return this.buildMatchResponse(match, language, clientId, query);
    }

    // Layer 3: Groq AI with full context (if AI is enabled)
    const clientConfig = await ClientConfigModel.findOne({
      clientId: { $in: await this.resolveClientIds(clientId) }
    }).lean();

    const aiEnabled = clientConfig ? (clientConfig as any).enableAI !== false : true;

    if (aiEnabled) {
      const groqResult = await this.generateGroqWithFullContext({
        clientId, language, query, clientName, conversationHistory, intent: intent.intent,
      });
      if (groqResult) {
        return groqResult;
      }
    }

    // Layer 4: Inquiry Flow - Ask permission first
    return this.buildPermissionResponse(language);
  }

  private static isFollowUpQuery(query: string, lastBotContent: string): boolean {
    const followUpWords = ['price', 'cost', 'how much', 'tell me more', 'more', 'details',
      'about', 'what about', 'show me', 'example', 'information', 'phone', 'email',
      'address', 'timing', 'hours', 'location', 'contact', 'menu', 'rate', 'charges',
      'book', 'reserve', 'order', 'delivery', 'available'];
    const lower = query.toLowerCase();
    return followUpWords.some(w => lower.includes(w) || lower === w);
  }

  private static async generateGroqWithFullContext(options: {
    clientId: string;
    language: Language;
    query: string;
    clientName: string;
    conversationHistory?: Array<{ sender: string; content: string }>;
    intent?: Intent;
  }): Promise<BotResponse | null> {
    const { clientId, language, query, clientName, conversationHistory, intent } = options;

    try {
      let clientObjIds: any[] = [];
      if (mongoose.Types.ObjectId.isValid(clientId)) {
        clientObjIds.push(new mongoose.Types.ObjectId(clientId));
      } else {
        const client = await ClientModel.findOne({ clientId: clientId.trim().toLowerCase() }).lean();
        if (client) clientObjIds.push(client._id);
      }

      const queryFilter = clientObjIds.length > 0
        ? { clientId: { $in: clientObjIds }, isActive: true, isDeleted: false }
        : { isActive: true, isDeleted: false };

      const client = await ClientModel.findOne({ _id: { $in: clientObjIds } }).lean();
      const clientConfig = await ClientConfigModel.findOne({ clientId: { $in: clientObjIds } }).lean();

      // Filter content based on intent for better relevance
      const webFilter: any = { ...queryFilter, isActive: true, isDeleted: false };
      if (intent && intent !== 'unknown' && intent !== 'greeting') {
        const intentCategoryMap: Record<string, string[]> = {
          menu: ['menu', 'menu_item', 'heading'],
          pricing: ['pricing'],
          contact: ['contact'],
          hours: ['hours'],
          location: ['contact'],
          services: ['service', 'paragraph'],
          about: ['heading', 'paragraph'],
          gallery: ['gallery'],
          booking: ['booking', 'paragraph'],
          events: ['paragraph'],
          offers: ['pricing', 'paragraph'],
          products: ['paragraph'],
          order: ['menu_item', 'pricing'],
          delivery: ['paragraph'],
        };
        const categories = intentCategoryMap[intent];
        if (categories) {
          webFilter.contentType = { $in: categories };
        }
      }

      const [faqs, knowledgeItems, webContent] = await Promise.all([
        FAQModel.find(queryFilter).limit(10).lean(),
        KnowledgeModel.find(queryFilter).limit(10).lean(),
        WebsiteContentModel.find(webFilter)
          .sort({ priority: -1 })
          .limit(25)
          .lean(),
      ]);

      const groqResult = await GroqService.generateCompletion({
        clientName,
        companyName: clientName,
        botName: (client as any)?.botName || 'Assistant',
        businessHours: (clientConfig as any)?.businessHours,
        contactEmail: (clientConfig as any)?.contactEmail,
        contactPhone: (clientConfig as any)?.contactPhone,
        contactAddress: (clientConfig as any)?.contactAddress,
        language,
        query,
        intent: intent || 'unknown',
        faqs: faqs.map(f => ({ question: f.question, answer: f.answer })),
        knowledgeItems: knowledgeItems.map(k => ({ title: k.title, content: k.content })),
        websiteContent: webContent.map(w => ({ title: w.title, content: w.content, category: w.category })),
        conversationHistory,
      });

      if (groqResult && !groqResult.isUnknown && groqResult.content) {
        return {
          content: groqResult.content,
          messageType: 'text',
          metadata: {
            matchedType: 'knowledge',
            confidence: groqResult.confidence,
          },
        };
      }
    } catch (err) {
      // Fallback cleanly to Inquiry flow on AI failure
    }

    return null;
  }

  private static buildMatchResponse(match: KnowledgeMatch, language: Language, clientId: string, query: string): BotResponse {
    if (match.type === 'faq' || match.type === 'knowledge') {
      const content = language === 'hi' && match.answerHi ? match.answerHi : match.answer || '';

      const isMenuQuery = this.isMenuRelatedQuery(query);
      if (isMenuQuery && match.type === 'knowledge') {
        const subCategories = this.detectMenuSubCategory(query, content);
        if (subCategories && subCategories.length > 0) {
          return {
            content: this.formatMenuCategoryResponse(subCategories, language),
            messageType: 'text',
            metadata: {
              matchedType: match.type,
              matchedId: match.matchedId,
              confidence: match.confidence,
            },
            suggestedQuestions: subCategories.map(c => c.label),
          };
        }
      }

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
      const shouldTriggerInquiry = match.matchedId === 'get_quote' || match.matchedId === 'book_consultation';

      if (match.matchedId === 'contact') {
        return {
          content: language === 'hi'
            ? 'Aap humse in madhyamon se sampark kar sakte hain:\n\n📞 Phone\n📧 Email\n📍 Address\n\nKya aap specific contact details chahte hain?'
            : 'You can reach us through:\n\n📞 Phone\n📧 Email\n📍 Address\n\nWould you like specific contact details?',
          messageType: 'quickAction',
          metadata: {
            matchedType: 'quickAction',
            matchedId: match.matchedId,
            confidence: match.confidence,
          },
        };
      }

      const response = language === 'hi'
        ? `Main aapki ${match.matchedId} mein madad kar sakta hoon.`
        : `I can help you with ${match.matchedId}.`;

      return {
        content: response,
        messageType: shouldTriggerInquiry ? 'inquiry' : 'text',
        metadata: {
          matchedType: 'quickAction',
          matchedId: match.matchedId,
          confidence: match.confidence,
        },
        triggerInquiry: shouldTriggerInquiry,
      };
    }

    return this.buildPermissionResponse(language);
  }

  private static buildPermissionResponse(language: Language): BotResponse {
    const content = language === 'hi'
      ? 'Main yeh jaankari nahi dhundh paaya.\n\nKya aap chahte hain ki main aapki baat humari team tak pahuncha doon?'
      : 'I couldn\'t find that information.\n\nWould you like me to help you contact the business?';
    return {
      content,
      messageType: 'inquiry',
      metadata: {
        matchedType: 'unknown',
        confidence: 0,
      },
      triggerInquiry: true,
    };
  }

  private static isMenuRelatedQuery(query: string): boolean {
    const lower = query.toLowerCase();
    const menuWords = ['menu', 'food', 'dish', 'eat', 'order', 'breakfast', 'lunch', 'dinner',
      'dessert', 'drink', 'beverage', 'snack', 'meal', 'cuisine', 'special', 'today special',
      'recommend', 'popular', 'biriyani', 'biryani', 'curry', 'roti', 'naan', 'pizza', 'burger',
      'pasta', 'salad', 'soup', 'rice', 'bread', 'chicken', 'mutton', 'fish', 'paneer', 'dal'];
    return menuWords.some(w => lower.includes(w)) || this.isMenuTypeQuery(query);
  }

  private static isMenuTypeQuery(query: string): boolean {
    const lower = query.toLowerCase();
    for (const [category, keywords] of Object.entries(MENU_CATEGORY_KEYWORDS)) {
      if (keywords.some(k => lower.includes(k))) {
        return true;
      }
    }
    return false;
  }

  private static detectMenuSubCategory(query: string, context: string): Array<{ id: string; label: string }> | null {
    const lower = query.toLowerCase();

    if (this.isMenuTypeQuery(query)) {
      return null;
    }

    const categories = Object.entries(MENU_CATEGORY_KEYWORDS)
      .filter(([_, keywords]) => {
        return keywords.some(k => context.toLowerCase().includes(k)) ||
               context.toLowerCase().includes(this.getCategoryLabel(keywords[0]).toLowerCase());
      })
      .map(([id]) => ({
        id,
        label: this.getCategoryLabel(id),
      }));

    const generalMenuWords = ['menu', 'food', 'what do you have', 'items', 'dishes', 'options', 'list'];
    if (categories.length === 0 && generalMenuWords.some(w => lower.includes(w))) {
      return [
        { id: 'all', label: 'View All Items' },
        ...Object.entries(MENU_CATEGORY_KEYWORDS).map(([id]) => ({
          id,
          label: this.getCategoryLabel(id),
        })),
      ];
    }

    return categories.length > 0 ? categories : null;
  }

  private static getCategoryLabel(id: string): string {
    const labels: Record<string, string> = {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      desserts: 'Desserts',
      drinks: 'Drinks & Beverages',
      appetizers: 'Appetizers',
      main_course: 'Main Course',
      specials: 'Today\'s Specials',
      all: 'View All Items',
    };
    return labels[id] || id;
  }

  private static formatMenuCategoryResponse(categories: Array<{ id: string; label: string }>, language: Language): string {
    if (language === 'hi') {
      return 'Aap kis category ki menu dekhna chahenge?\n\n' +
        categories.map((c, i) => `${i + 1}. ${c.label}`).join('\n');
    }
    return 'Which menu category would you like to see?\n\n' +
      categories.map((c, i) => `${i + 1}. ${c.label}`).join('\n');
  }

  static getWelcomeResponse(language: Language, clientName: string): string {
    return LanguageEngine.getGreetingMessage(language, clientName);
  }

  static getTypingDelay(): number {
    return 800;
  }

  static getSuggestedQuestions(language: Language): string[] {
    if (language === 'hi') {
      return [
        'Menu kya hai?',
        'Aapki contact details kya hain?',
        'Kya timings hain?',
        'Price kya hai?',
        'Booking kaise karein?',
      ];
    }
    return [
      'What\'s on the menu?',
      'What are your contact details?',
      'What are your hours?',
      'What are your prices?',
      'How do I make a booking?',
    ];
  }
}
