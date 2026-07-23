import { KnowledgeModel, KnowledgeDocument } from '../knowledge/knowledge.model.js';
import { FAQModel, FAQDocument } from '../faq/faq.model.js';
import { normalizeQuestion, extractKeywords, calculateSimilarity } from '@nestchat/shared';

export interface SearchResult {
  type: 'faq' | 'knowledge';
  id: string;
  title: string;
  content: string;
  score: number;
  matchedKeywords: string[];
  category?: string;
  language: string;
}

export interface SearchOptions {
  clientId: string;
  language?: string;
  limit?: number;
  minScore?: number;
}

export class SearchService {
  static async searchFAQ(options: SearchOptions): Promise<SearchResult[]> {
    const { clientId, language, limit = 10 } = options;

    const filter: any = {
      clientId,
      isActive: true,
      isDeleted: false,
    };

    if (language) {
      filter.$or = [{ answerHi: { $exists: true, $ne: null } }, { language: 'both' }];
    }

    const faqs = await FAQModel.find(filter).lean();

    return faqs.map(faq => ({
      type: 'faq' as const,
      id: faq._id.toString(),
      title: faq.question,
      content: language === 'hi' && faq.answerHi ? faq.answerHi : faq.answer,
      score: 0,
      matchedKeywords: [],
      category: faq.category,
      language: language || 'en',
    }));
  }

  static async searchKnowledge(options: SearchOptions): Promise<SearchResult[]> {
    const { clientId, language, limit = 10 } = options;

    const filter: any = {
      clientId,
      isActive: true,
      isDeleted: false,
    };

    if (language) {
      filter.$or = [{ language }, { language: 'both' }];
    }

    const knowledge = await KnowledgeModel.find(filter)
      .sort({ priority: -1 })
      .limit(limit)
      .lean();

    return knowledge.map(kb => ({
      type: 'knowledge' as const,
      id: kb._id.toString(),
      title: kb.title,
      content: kb.content,
      score: 0,
      matchedKeywords: [],
      category: kb.category,
      language: kb.language,
    }));
  }

  static calculateMatchScore(query: string, item: SearchResult): number {
    const normalizedQuery = normalizeQuestion(query);
    const queryKeywords = extractKeywords(normalizedQuery);

    const itemText = `${item.title} ${item.content} ${item.matchedKeywords.join(' ')}`.toLowerCase();
    const itemKeywords = extractKeywords(itemText);

    const similarity = calculateSimilarity(query, itemText);

    let keywordScore = 0;
    for (const keyword of queryKeywords) {
      if (itemText.includes(keyword)) {
        keywordScore += 1;
      }
    }
    keywordScore = queryKeywords.length > 0 ? keywordScore / queryKeywords.length : 0;

    const titleMatch = item.title.toLowerCase().includes(normalizedQuery) ? 0.3 : 0;

    return (similarity * 0.4) + (keywordScore * 0.4) + titleMatch;
  }

  static rankResults(query: string, results: SearchResult[]): SearchResult[] {
    const ranked = results.map(result => ({
      ...result,
      score: this.calculateMatchScore(query, result),
    }));

    ranked.sort((a, b) => b.score - a.score);

    return ranked;
  }

  static filterByMinScore(results: SearchResult[], minScore: number): SearchResult[] {
    return results.filter(result => result.score >= minScore);
  }

  static getTopResult(results: SearchResult[]): SearchResult | null {
    return results.length > 0 ? results[0] : null;
  }
}
