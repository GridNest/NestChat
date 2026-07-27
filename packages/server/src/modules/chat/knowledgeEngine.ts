import mongoose from 'mongoose';
import { SearchService, SearchResult, SearchOptions } from './searchService.js';
import { FAQModel } from '../faq/faq.model.js';
import { KnowledgeModel } from '../knowledge/knowledge.model.js';
import { WebsiteContentModel } from '../websiteContent/websiteContent.model.js';
import { ClientModel } from '../client/client.model.js';
import { normalizeQuestion, extractKeywords, calculateSimilarity } from '@nestchat/shared';
import { DEFAULT_QUICK_ACTIONS } from '@nestchat/shared';

export interface KnowledgeMatch {
  found: boolean;
  type: 'faq' | 'knowledge' | 'quickAction' | 'unknown';
  answer?: string;
  answerHi?: string;
  confidence: number;
  matchedId?: string;
  matchedTitle?: string;
  quickActions?: typeof DEFAULT_QUICK_ACTIONS;
}

export interface KnowledgeEngineOptions {
  clientId: string;
  language: string;
  query: string;
}

export class KnowledgeEngine {
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

  static async search(options: KnowledgeEngineOptions): Promise<KnowledgeMatch> {
    const { clientId, language, query } = options;

    const faqMatch = await this.matchFAQ(clientId, query, language);
    if (faqMatch.found) return faqMatch;

    const knowledgeMatch = await this.matchKnowledge(clientId, query, language);
    if (knowledgeMatch.found) return knowledgeMatch;

    const webMatch = await this.matchWebsiteContent(clientId, query, language);
    if (webMatch.found) return webMatch;

    const quickActionMatch = this.matchQuickAction(query, language);
    if (quickActionMatch.found) return quickActionMatch;

    return {
      found: false,
      type: 'unknown',
      confidence: 0,
      quickActions: DEFAULT_QUICK_ACTIONS,
    };
  }

  private static async matchFAQ(
    clientId: string,
    query: string,
    language: string
  ): Promise<KnowledgeMatch> {
    const normalizedQuery = normalizeQuestion(query).trim().toLowerCase();
    const queryKeywords = extractKeywords(normalizedQuery);

    const clientIds = await this.resolveClientIds(clientId);

    const faqs = await FAQModel.find({
      clientId: { $in: clientIds },
      isActive: true,
      isDeleted: false,
    }).lean();

    // Check for general FAQ requests - LIST QUESTIONS ONLY, NOT ANSWERS
    const isGeneralFaqQuery = ['faq', 'faqs', "faq's", 'frequently asked questions', 'questions'].includes(normalizedQuery);

    if (isGeneralFaqQuery) {
      if (faqs.length > 0) {
        const uniqueCategories = [...new Set(faqs.filter(f => f.category).map(f => f.category))];
        let faqList: string;

        if (uniqueCategories.length > 0) {
          faqList = uniqueCategories.map((cat, i) => {
            const catFaqs = faqs.filter(f => f.category === cat);
            const questions = catFaqs.map(f => `  • ${f.question}`).join('\n');
            const catLabel = cat.charAt(0).toUpperCase() + cat.slice(1);
            return `▼ **${catLabel}**\n${questions}`;
          }).join('\n\n');
        } else {
          faqList = faqs.map(f => `  • ${f.question}`).join('\n');
        }

        const header = language === 'hi'
          ? '📋 **Frequently Asked Questions:**\n\nKripya ek sawal chunein:\n\n'
          : '📋 **Frequently Asked Questions:**\n\nPlease select a question:\n\n';

        const footer = language === 'hi'
          ? '\n\nKisi sawal ka jawab paane ke liye uspar click karein ya type karein.'
          : '\n\nClick or type a question to see its answer.';

        return {
          found: true,
          type: 'faq',
          answer: `${header}${faqList}${footer}`,
          confidence: 1,
        };
      } else {
        const noFaqMsg = language === 'hi'
          ? 'Abhi koi FAQs uplabdh nahi hain. Aap koi bhi sawal puch sakte hain!'
          : 'No FAQs are available at the moment. Please feel free to ask your question!';
        return {
          found: true,
          type: 'faq',
          answer: noFaqMsg,
          confidence: 1,
        };
      }
    }

    let bestMatch: any = null;
    let bestScore = 0;

    for (const faq of faqs) {
      const questionText = (faq.question || '').toLowerCase();
      const keywordsText = (faq.keywords || []).join(' ').toLowerCase();
      const combinedText = `${questionText} ${keywordsText}`;

      const similarity = calculateSimilarity(query, combinedText);

      let keywordScore = 0;
      for (const keyword of queryKeywords) {
        if (combinedText.includes(keyword)) {
          keywordScore += 1;
        }
      }
      keywordScore = queryKeywords.length > 0 ? keywordScore / queryKeywords.length : 0;

      const exactMatch = questionText.includes(normalizedQuery) ? 0.3 : 0;

      const totalScore = (similarity * 0.4) + (keywordScore * 0.4) + exactMatch;

      if (totalScore > bestScore && totalScore > 0.3) {
        bestScore = totalScore;
        bestMatch = faq;
      }
    }

    if (bestMatch) {
      return {
        found: true,
        type: 'faq',
        answer: language === 'hi' && bestMatch.answerHi ? bestMatch.answerHi : bestMatch.answer,
        answerHi: bestMatch.answerHi,
        confidence: bestScore,
        matchedId: bestMatch._id.toString(),
        matchedTitle: bestMatch.question,
      };
    }

    return {
      found: false,
      type: 'unknown',
      confidence: 0,
    };
  }

  private static async matchKnowledge(
    clientId: string,
    query: string,
    language: string
  ): Promise<KnowledgeMatch> {
    const normalizedQuery = normalizeQuestion(query);
    const queryKeywords = extractKeywords(normalizedQuery);

    const clientIds = await this.resolveClientIds(clientId);

    const knowledgeItems = await KnowledgeModel.find({
      clientId: { $in: clientIds },
      isActive: true,
      isDeleted: false,
    }).lean();

    let bestMatch: any = null;
    let bestScore = 0;

    for (const kb of knowledgeItems) {
      const titleText = (kb.title || '').toLowerCase();
      const contentText = (kb.content || '').toLowerCase();
      const tagsText = (kb.tags || []).join(' ').toLowerCase();
      const combinedText = `${titleText} ${contentText} ${tagsText}`;

      const similarity = calculateSimilarity(query, combinedText);

      let keywordScore = 0;
      for (const keyword of queryKeywords) {
        if (combinedText.includes(keyword)) {
          keywordScore += 1;
        }
      }
      keywordScore = queryKeywords.length > 0 ? keywordScore / queryKeywords.length : 0;

      const titleMatch = titleText.includes(normalizedQuery) ? 0.3 : 0;

      const totalScore = (similarity * 0.4) + (keywordScore * 0.4) + titleMatch;

      if (totalScore > bestScore && totalScore > 0.25) {
        bestScore = totalScore;
        bestMatch = kb;
      }
    }

    if (bestMatch) {
      return {
        found: true,
        type: 'knowledge',
        answer: bestMatch.content,
        confidence: bestScore,
        matchedId: bestMatch._id.toString(),
        matchedTitle: bestMatch.title,
      };
    }

    return {
      found: false,
      type: 'unknown',
      confidence: 0,
    };
  }

  private static async matchWebsiteContent(
    clientId: string,
    query: string,
    language: string
  ): Promise<KnowledgeMatch> {
    const normalizedQuery = normalizeQuestion(query).trim().toLowerCase();
    const queryKeywords = extractKeywords(normalizedQuery);

    const clientIds = await this.resolveClientIds(clientId);

    const webItems = await WebsiteContentModel.find({
      clientId: { $in: clientIds },
      isActive: true,
      isDeleted: false,
    }).lean();

    let bestMatch: any = null;
    let bestScore = 0;

    for (const item of webItems) {
      const titleText = (item.title || '').toLowerCase();
      const contentText = (item.content || '').toLowerCase();
      const sectionText = (item.section || '').toLowerCase();
      const combinedText = `${titleText} ${contentText} ${sectionText}`;

      const similarity = calculateSimilarity(query, combinedText);

      let keywordScore = 0;
      for (const keyword of queryKeywords) {
        if (combinedText.includes(keyword)) {
          keywordScore += 1;
        }
      }
      keywordScore = queryKeywords.length > 0 ? keywordScore / queryKeywords.length : 0;

      const titleMatch = titleText.includes(normalizedQuery) ? 0.3 : 0;
      const exactContentMatch = contentText.includes(normalizedQuery) ? 0.2 : 0;

      const totalScore = (similarity * 0.3) + (keywordScore * 0.3) + titleMatch + exactContentMatch;

      if (totalScore > bestScore && totalScore > 0.2) {
        bestScore = totalScore;
        bestMatch = item;
      }
    }

    if (bestMatch) {
      return {
        found: true,
        type: 'knowledge',
        answer: bestMatch.content,
        confidence: bestScore,
        matchedId: bestMatch._id.toString(),
        matchedTitle: bestMatch.title,
      };
    }

    return {
      found: false,
      type: 'unknown',
      confidence: 0,
    };
  }

  private static matchQuickAction(
    query: string,
    language: string
  ): KnowledgeMatch {
    const normalizedQuery = normalizeQuestion(query).trim().toLowerCase();

    const customActionMap: Record<string, string> = {
      'menu': 'menu',
      'reservations': 'reservations',
      'reservation': 'reservations',
      'table': 'reservations',
      'opening hours': 'hours',
      'hours': 'hours',
      'timing': 'hours',
      'contact': 'contact',
      'contact us': 'contact',
      'phone': 'contact',
      'email': 'contact',
      'services': 'services',
      'pricing': 'pricing',
      'portfolio': 'portfolio',
      'quote': 'get_quote',
      'consultation': 'book_consultation',
    };

    for (const [key, actionId] of Object.entries(customActionMap)) {
      if (normalizedQuery === key || normalizedQuery.includes(key)) {
        return {
          found: true,
          type: 'quickAction',
          confidence: 0.95,
          matchedId: actionId,
          matchedTitle: key,
        };
      }
    }

    for (const action of DEFAULT_QUICK_ACTIONS) {
      const actionLabel = (language === 'hi' && action.labelHi ? action.labelHi : action.label).toLowerCase();
      const actionKeywords = action.id.replace(/_/g, ' ').toLowerCase();

      if (
        normalizedQuery.includes(actionLabel) ||
        actionLabel.includes(normalizedQuery) ||
        normalizedQuery.includes(actionKeywords)
      ) {
        return {
          found: true,
          type: 'quickAction',
          confidence: 0.9,
          matchedId: action.id,
          matchedTitle: action.label,
        };
      }
    }

    return {
      found: false,
      type: 'unknown',
      confidence: 0,
    };
  }

  static async getWelcomeResponse(
    clientId: string,
    language: string,
    clientName: string
  ): Promise<string> {
    if (language === 'hi') {
      return `Namaste! 👋\nNestChat mein aapka swagat hai\n${clientName} mein aapka swagat hai\n\nKripya apni bhasha chunein.`;
    }
    return `Hello! 👋\nWelcome to NestChat\nWelcome to ${clientName}\n\nPlease choose your preferred language.`;
  }

  static getQuickActionsResponse(language: string): string {
    if (language === 'hi') {
      return 'Aap niche diye gaye options mein se koi ek chun sakte hain:';
    }
    return 'You can choose from the options below:';
  }
}
