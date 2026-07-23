import { SearchService, SearchResult, SearchOptions } from './searchService.js';
import { FAQModel } from '../faq/faq.model.js';
import { KnowledgeModel } from '../knowledge/knowledge.model.js';
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
  static async search(options: KnowledgeEngineOptions): Promise<KnowledgeMatch> {
    const { clientId, language, query } = options;

    const faqMatch = await this.matchFAQ(clientId, query, language);
    if (faqMatch.found) return faqMatch;

    const knowledgeMatch = await this.matchKnowledge(clientId, query, language);
    if (knowledgeMatch.found) return knowledgeMatch;

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
    const normalizedQuery = normalizeQuestion(query);
    const queryKeywords = extractKeywords(normalizedQuery);

    const faqs = await FAQModel.find({
      clientId,
      isActive: true,
      isDeleted: false,
    }).lean();

    let bestMatch: any = null;
    let bestScore = 0;

    for (const faq of faqs) {
      const questionText = faq.question.toLowerCase();
      const keywordsText = faq.keywords.join(' ').toLowerCase();
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

    const knowledgeItems = await KnowledgeModel.find({
      clientId,
      isActive: true,
      isDeleted: false,
    }).lean();

    let bestMatch: any = null;
    let bestScore = 0;

    for (const kb of knowledgeItems) {
      const titleText = kb.title.toLowerCase();
      const contentText = kb.content.toLowerCase();
      const tagsText = kb.tags.join(' ').toLowerCase();
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

  private static matchQuickAction(
    query: string,
    language: string
  ): KnowledgeMatch {
    const normalizedQuery = normalizeQuestion(query);

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
