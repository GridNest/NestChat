import { UnansweredModel, UnansweredQuestionDocument } from './unanswered.model.js';
import { FAQModel } from '../faq/faq.model.js';
import { ApiError } from '../../utils/apiError.js';
import { normalizeQuestion } from '@nestchat/shared';

export interface UnansweredListItem {
  id: string;
  clientId: string;
  question: string;
  count: number;
  firstAsked: Date;
  lastAsked: Date;
  convertedToFaq: boolean;
  faqId?: string;
  createdAt: Date;
}

export class UnansweredService {
  static async track(data: {
    clientId: string;
    question: string;
    sessionId: string;
    visitorId: string;
  }): Promise<void> {
    const normalized = normalizeQuestion(data.question);

    const existing = await UnansweredModel.findOne({
      clientId: data.clientId,
      question: { $regex: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (existing) {
      existing.count += 1;
      existing.lastAsked = new Date();
      await existing.save();
      return;
    }

    await UnansweredModel.create({
      clientId: data.clientId,
      question: data.question,
      sessionId: data.sessionId,
      visitorId: data.visitorId,
      count: 1,
      firstAsked: new Date(),
      lastAsked: new Date(),
    });
  }

  static async list(clientId: string, options: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    items: UnansweredListItem[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 10, 100);
    const skip = (page - 1) * limit;

    const filter: any = { clientId, convertedToFaq: false };

    if (options.search) {
      filter.question = { $regex: options.search, $options: 'i' };
    }

    const [items, total] = await Promise.all([
      UnansweredModel.find(filter)
        .sort({ count: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UnansweredModel.countDocuments(filter),
    ]);

    return {
      items: items.map(item => this.formatItem(item as unknown as UnansweredQuestionDocument)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  static async convertToFaq(
    id: string,
    data: {
      category: string;
      answer: string;
      answerHi?: string;
      keywords: string[];
    }
  ): Promise<{ faqId: string }> {
    const unanswered = await UnansweredModel.findOne({ _id: id });
    if (!unanswered) {
      throw ApiError.notFound('Unanswered question not found');
    }

    if (unanswered.convertedToFaq) {
      throw ApiError.badRequest('Already converted to FAQ');
    }

    const faq = await FAQModel.create({
      clientId: unanswered.clientId,
      category: data.category,
      question: unanswered.question,
      answer: data.answer,
      answerHi: data.answerHi,
      keywords: data.keywords,
      priority: 0,
    });

    unanswered.convertedToFaq = true;
    unanswered.faqId = faq._id;
    await unanswered.save();

    return { faqId: faq._id.toString() };
  }

  static async getStats(clientId: string): Promise<{
    total: number;
    converted: number;
    pending: number;
    topQuestions: Array<{ question: string; count: number }>;
  }> {
    const [total, converted, topQuestions] = await Promise.all([
      UnansweredModel.countDocuments({ clientId }),
      UnansweredModel.countDocuments({ clientId, convertedToFaq: true }),
      UnansweredModel.find({ clientId, convertedToFaq: false })
        .sort({ count: -1 })
        .limit(10)
        .select('question count')
        .lean(),
    ]);

    return {
      total,
      converted,
      pending: total - converted,
      topQuestions: topQuestions.map(q => ({
        question: q.question,
        count: q.count,
      })),
    };
  }

  private static formatItem(item: UnansweredQuestionDocument): UnansweredListItem {
    return {
      id: item._id.toString(),
      clientId: item.clientId.toString(),
      question: item.question,
      count: item.count,
      firstAsked: item.firstAsked,
      lastAsked: item.lastAsked,
      convertedToFaq: item.convertedToFaq,
      faqId: item.faqId?.toString(),
      createdAt: item.createdAt,
    };
  }
}
