import { KnowledgeMatch, KnowledgeEngine } from './knowledgeEngine.js';
import { LanguageEngine, Language } from './languageEngine.js';
import { IntentDetector, Intent } from './intentDetector.js';
import { DEFAULT_QUICK_ACTIONS } from '@nestchat/shared';
import { InquiryEngine } from '../inquiry/inquiryEngine.js';
import { GroqService, cleanResponseText } from './groqService.js';
import { RagService } from './ragService.js';

import { FAQModel } from '../faq/faq.model.js';
import { KnowledgeModel } from '../knowledge/knowledge.model.js';
import { WebsiteContentModel } from '../websiteContent/websiteContent.model.js';
import { ClientModel } from '../client/client.model.js';
import { ClientConfigModel } from '../clientConfig/clientConfig.model.js';
import mongoose from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface BotResponse {
  content: string;
  messageType: 'text' | 'quickAction' | 'inquiry' | 'system';
  metadata: {
    matchedType: 'faq' | 'knowledge' | 'quickAction' | 'website' | 'unknown' | 'inquiry_trigger';
    matchedId?: string;
    confidence: number;
    inquiryCreated?: boolean;
    fallbackTriggered?: boolean;
    workflowType?: string;
    options?: any;
  };
  quickActions?: typeof DEFAULT_QUICK_ACTIONS;
  suggestedQuestions?: string[];
  triggerInquiry?: boolean;
  workflowType?: string;
}

export interface ResponseEngineOptions {
  clientId: string;
  language: Language;
  query: string;
  clientName: string;
  conversationHistory?: Array<{ sender: string; content: string }>;
  isInquiryMode?: boolean;
}

// ─── Response Engine ──────────────────────────────────────────────────────────

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

    // Cancel request check
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

    // Note: Intent-based high interest queries (menu, services, pricing, etc.) now check Knowledge Base FIRST.
    // If Knowledge Base contains details, it will answer from KB. If KB has no answer, buildPermissionResponse will trigger lead capture below.

    // Requirement 1: Contact, Location, Business Hours Dedicated Workflows
    if (['contact', 'location', 'hours'].includes(intent.intent)) {
      const clientObjIds = await this.resolveClientIds(clientId);
      const [client, clientConfig] = await Promise.all([
        ClientModel.findOne({ _id: { $in: clientObjIds } }).lean(),
        ClientConfigModel.findOne({ clientId: { $in: clientObjIds } }).lean(),
      ]);

      const phone = (clientConfig as any)?.contactPhone || (client as any)?.phone;
      const email = (clientConfig as any)?.contactEmail || (client as any)?.email;
      const address = (clientConfig as any)?.contactAddress;
      const hours = (clientConfig as any)?.businessHours;
      const websiteUrl = (client as any)?.website;

      if (intent.intent === 'contact') {
        const contactParts: string[] = [];
        if (phone) contactParts.push(`📞 Phone: ${phone}`);
        if (email) contactParts.push(`📧 Email: ${email}`);
        if (address) contactParts.push(`📍 Address: ${address}`);
        if (websiteUrl) contactParts.push(`🌐 Website: ${websiteUrl}`);

        if (contactParts.length > 0) {
          const content = language === 'hi'
            ? `Aap humse in madhyamon se sampark kar sakte hain:\n\n${contactParts.join('\n')}`
            : `You can reach us through the following contact details:\n\n${contactParts.join('\n')}`;
          return {
            content,
            messageType: 'text',
            metadata: { matchedType: 'knowledge', confidence: 0.95 },
          };
        }
      }

      if (intent.intent === 'location') {
        if (address) {
          const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
          const content = language === 'hi'
            ? `📍 Hamara pata:\n${address}\n\n🗺️ Google Maps link: ${mapsUrl}`
            : `📍 Our Address:\n${address}\n\n🗺️ Google Maps link: ${mapsUrl}`;
          return {
            content,
            messageType: 'text',
            metadata: { matchedType: 'knowledge', confidence: 0.95 },
          };
        }
      }

      if (intent.intent === 'hours') {
        if (hours) {
          const content = language === 'hi'
            ? `🕒 Hamari timing/working hours:\n${hours}`
            : `🕒 Our Business Hours:\n${hours}`;
          return {
            content,
            messageType: 'text',
            metadata: { matchedType: 'knowledge', confidence: 0.95 },
          };
        }
      }
    }

    // ── KNOWLEDGE UNDERSTANDING & RESPONSE GENERATION PIPELINE ──────────────

    const clientConfig = await ClientConfigModel.findOne({
      clientId: { $in: await this.resolveClientIds(clientId) }
    }).lean();

    const aiEnabled = clientConfig ? (clientConfig as any).enableAI !== false : true;

    if (aiEnabled) {
      // 1. Try RAG semantic vector search first
      const ragResult = await this.generateResponseWithRAG({
        clientId, language, query, clientName, conversationHistory, intent: intent.intent,
      });
      if (ragResult && ragResult.metadata.confidence > 0.3) {
        return ragResult;
      }

      // 2. Keyword Search in Knowledge Engine for relevant context
      let match = await KnowledgeEngine.search({ clientId, language, query });

      // Contextual re-match using last user message for follow-ups
      if (!match.found && conversationHistory && conversationHistory.length > 0) {
        const lastUserMsg = conversationHistory.filter(m => m.sender === 'user').pop();
        if (lastUserMsg && lastUserMsg.content && lastUserMsg.content.trim() !== query.trim()) {
          const contextualQuery = `${lastUserMsg.content.trim()} ${query.trim()}`;
          const contextMatch = await KnowledgeEngine.search({ clientId, language, query: contextualQuery });
          if (contextMatch.found) match = contextMatch;
        }
      }

      if (!match.found && conversationHistory && conversationHistory.length >= 2) {
        const lastBotMsg = [...conversationHistory].reverse().find(m => m.sender === 'bot');
        if (lastBotMsg && this.isFollowUpQuery(query)) {
          const combinedQuery = `${lastBotMsg.content} ${query}`;
          const followUpMatch = await KnowledgeEngine.search({ clientId, language, query: combinedQuery });
          if (followUpMatch.found) match = followUpMatch;
        }
      }

      // 3. If Knowledge Engine found matching context, route through LLM synthesis (do NOT dump verbatim match!)
      if (match.found && match.type !== 'quickAction' && match.answer) {
        const clientObjIds = await this.resolveClientIds(clientId);
        const client = await ClientModel.findOne({ _id: { $in: clientObjIds } }).lean();

        const synthesizedResult = await GroqService.generateCompletion({
          clientName,
          companyName: (client as any)?.companyName || clientName,
          botName: (client as any)?.botName || 'Assistant',
          language,
          query: this.buildContextAwareQuery(query, conversationHistory),
          intent: intent.intent,
          ragContext: `Matched Context (${match.matchedTitle || match.type}):\n${match.answer}`,
          conversationHistory,
          isRAGMode: true,
        });

        if (synthesizedResult && !synthesizedResult.isUnknown) {
          return {
            content: synthesizedResult.content,
            messageType: 'text',
            metadata: {
              matchedType: match.type,
              matchedId: match.matchedId,
              confidence: synthesizedResult.confidence,
            },
          };
        }
      }

      // 4. Try Full Context Groq fallback if no specific match was found
      const legacyResult = await this.generateGroqWithFullContext({
        clientId, language, query, clientName, conversationHistory, intent: intent.intent,
      });
      if (legacyResult) return legacyResult;

      // Handle quickAction match
      if (match.found && match.type === 'quickAction') {
        return this.buildMatchResponse(match, language, clientId, query);
      }
    } else {
      // Non-AI fallback mode (when enableAI is explicitly false)
      let match = await KnowledgeEngine.search({ clientId, language, query });
      if (match.found) {
        return this.buildMatchResponse(match, language, clientId, query);
      }
    }

    // Default permission / inquiry fallback
    return this.buildPermissionResponse(language, intent.intent, query);
  }

  // ─── RAG Response Generator ─────────────────────────────────────────────────

  private static async generateResponseWithRAG(options: {
    clientId: string;
    language: Language;
    query: string;
    clientName: string;
    conversationHistory?: Array<{ sender: string; content: string }>;
    intent?: Intent;
  }): Promise<BotResponse | null> {
    const { clientId, language, query, clientName, conversationHistory, intent } = options;

    try {
      // Step 1: Check if embeddings exist for this client
      const hasEmbeddings = await RagService.hasEmbeddings(clientId);
      if (!hasEmbeddings) return null;

      // Step 2: Retrieve semantically relevant chunks
      const ragResult = await RagService.retrieveRelevantChunks(clientId, query, 5);

      // Step 3: Confidence gate — if no relevant chunks, skip Groq and fall back to inquiry
      if (!ragResult.found || ragResult.maxSimilarity < 0.35) {
        return null;
      }

      // Step 4: Load supplementary data (FAQs, client config)
      const clientObjIds = await this.resolveClientIds(clientId);
      const [faqs, client, clientConfig] = await Promise.all([
        FAQModel.find({ clientId: { $in: clientObjIds }, isActive: true, isDeleted: false }).limit(8).lean(),
        ClientModel.findOne({ _id: { $in: clientObjIds } }).lean(),
        ClientConfigModel.findOne({ clientId: { $in: clientObjIds } }).lean(),
      ]);

      const websiteUrl = (client as any)?.website || (clientConfig as any)?.websiteUrl;

      // Step 5: Build enhanced query that includes conversation context
      const effectiveQuery = this.buildContextAwareQuery(query, conversationHistory);

      // Step 6: Call Groq in RAG mode
      const groqResult = await GroqService.generateCompletion({
        clientName,
        companyName: (client as any)?.companyName || clientName,
        botName: (client as any)?.botName || 'Assistant',
        websiteUrl,
        businessHours: (clientConfig as any)?.businessHours,
        contactEmail: (clientConfig as any)?.contactEmail,
        contactPhone: (clientConfig as any)?.contactPhone,
        contactAddress: (clientConfig as any)?.contactAddress,
        language,
        query: effectiveQuery,
        intent: intent || 'unknown',
        ragContext: ragResult.context,
        faqs: faqs.map(f => ({ question: f.question, answer: f.answer })),
        conversationHistory,
        isRAGMode: true,
      });

      if (!groqResult) return null;

      // Step 7: If Groq says "I don't know", trigger inquiry flow
      if (groqResult.isUnknown) {
        return this.buildPermissionResponse(language, intent);
      }

      return {
        content: groqResult.content,
        messageType: 'text',
        metadata: {
          matchedType: 'knowledge',
          confidence: groqResult.confidence,
        },
      };
    } catch (err) {
      // Non-critical — fall through to legacy or inquiry
      return null;
    }
  }

  // ─── Legacy Groq (fallback when embeddings not yet generated) ───────────────

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

      const [faqs, knowledgeItems, webContent] = await Promise.all([
        FAQModel.find(queryFilter).limit(10).lean(),
        KnowledgeModel.find(queryFilter).limit(10).lean(),
        WebsiteContentModel.find(queryFilter).sort({ priority: -1 }).limit(20).lean(),
      ]);

      const websiteUrl = (client as any)?.website || (clientConfig as any)?.websiteUrl;

      const groqResult = await GroqService.generateCompletion({
        clientName,
        companyName: (client as any)?.companyName || clientName,
        botName: (client as any)?.botName || 'Assistant',
        websiteUrl,
        businessHours: (clientConfig as any)?.businessHours,
        contactEmail: (clientConfig as any)?.contactEmail,
        contactPhone: (clientConfig as any)?.contactPhone,
        contactAddress: (clientConfig as any)?.contactAddress,
        language,
        query,
        intent: intent || 'unknown',
        faqs: faqs.map(f => ({ question: f.question, answer: f.answer })),
        knowledgeItems: knowledgeItems.map(k => ({ title: k.title, content: k.content, tags: k.tags })),
        websiteContent: webContent.map(w => ({ title: w.title, content: w.content, category: w.category })),
        conversationHistory,
        isRAGMode: false,
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

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Build a context-aware query by prepending the last bot message when the
   * current query is a follow-up (e.g., "how much?" after a service description).
   */
  private static buildContextAwareQuery(
    query: string,
    conversationHistory?: Array<{ sender: string; content: string }>
  ): string {
    if (!conversationHistory || conversationHistory.length === 0) return query;

    const lowerQuery = query.toLowerCase().trim();
    const followUpTriggers = ['how much', 'price', 'cost', 'what is the', 'tell me more',
      'more details', 'about it', 'about that', 'which one', 'can you', 'kitna',
      'kya price', 'aur batao', 'kitne', 'what about'];

    const isFollowUp = followUpTriggers.some(t => lowerQuery.startsWith(t) || lowerQuery === t);

    if (isFollowUp) {
      const lastBotMsg = [...conversationHistory].reverse().find(m => m.sender === 'bot');
      if (lastBotMsg && lastBotMsg.content.length < 500) {
        return `Context: "${lastBotMsg.content.trim()}"\n\nUser question: ${query}`;
      }
    }

    return query;
  }

  private static isFollowUpQuery(query: string): boolean {
    const followUpWords = [
      'price', 'cost', 'how much', 'tell me more', 'more', 'details',
      'about', 'what about', 'show me', 'example', 'information', 'phone', 'email',
      'address', 'timing', 'hours', 'location', 'contact', 'menu', 'rate', 'charges',
      'book', 'reserve', 'order', 'delivery', 'available',
      'kitna', 'kya price', 'aur', 'batao', 'bata', 'woh', 'yeh',
    ];
    const lower = query.toLowerCase();
    return followUpWords.some(w => lower.includes(w) || lower === w);
  }

  private static buildMatchResponse(match: KnowledgeMatch, language: Language, clientId: string, query: string): BotResponse {
    if (match.type === 'faq' || match.type === 'knowledge') {
      const rawContent = language === 'hi' && match.answerHi ? match.answerHi : match.answer || '';
      const content = cleanResponseText(rawContent);

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

  private static buildPermissionResponse(language: Language, intent?: Intent, query?: string): BotResponse {
    const isHighInterestIntent = intent && ['sales_intent', 'booking', 'services', 'products', 'menu', 'pricing', 'offers'].includes(intent);
    const qLower = (query || '').toLowerCase();
    const isBookingOrAvailability = intent === 'booking' || /\b(available|availability|room|book|booking|table|appointment|slot|stay|reservation|check-in|checkin|pax|guests?)\b/i.test(qLower);

    let content = '';
    if (isBookingOrAvailability) {
      content = language === 'hi'
        ? 'Main aapki booking / availability request me poori madad kar sakta hoon! Abhi direct live booking connected nahi hai, par main aapki requirement aur contact details note kar leta hoon taaki hamari team aapko confirm kar sake. Kripya apna Poora Naam batayein?'
        : 'I would be glad to assist with your booking & availability request! Live automated checking is not connected, but I can record your requirement details for our team to confirm. May I know your Full Name?';
    } else if (isHighInterestIntent) {
      content = language === 'hi'
        ? 'Main aapki isme poori madad kar sakta hoon! Kripya apna Poora Naam batayein taaki hamari team aapko poori jankari de sake.'
        : 'I would be happy to assist you with that! May I know your Full Name so our team can provide you with complete details?';
    } else {
      content = language === 'hi'
        ? 'Mujhe yeh jaankari nahi mili.\n\nKya aap chahenge ki hamari team aapko contact kare?'
        : "I'm sorry, I couldn't find that information.\n\nWould you like our team to contact you?";
    }

    return {
      content,
      messageType: 'inquiry',
      metadata: {
        matchedType: isHighInterestIntent || isBookingOrAvailability ? 'quickAction' : 'unknown',
        matchedId: intent || 'unknown',
        confidence: 0,
        workflowType: isBookingOrAvailability ? 'booking' : 'general_inquiry',
      },
      triggerInquiry: true,
      workflowType: isBookingOrAvailability ? 'booking' : 'general_inquiry',
    };
  }

  // ─── Utility Helpers ──────────────────────────────────────────────────────────

  static getWelcomeResponse(language: Language, clientName: string): string {
    return LanguageEngine.getGreetingMessage(language, clientName);
  }

  static getTypingDelay(): number {
    return 800;
  }

  static getSuggestedQuestions(language: Language): string[] {
    if (language === 'hi') {
      return [
        'Aap kya services provide karte hain?',
        'Aapka contact number kya hai?',
        'Timing/working hours kya hain?',
        'Price/charges kya hain?',
        'Appointment/booking kaise karein?',
      ];
    }
    return [
      'What services do you offer?',
      'What are your contact details?',
      'What are your working hours?',
      'What are your pricing plans?',
      'How do I get in touch?',
    ];
  }
}
