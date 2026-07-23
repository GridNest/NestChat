import { CreateFAQRequest, UpdateFAQRequest, PaginationQuery } from '@nestchat/shared';
import { FAQModel, FAQDocument } from './faq.model.js';
import { ApiError } from '../../utils/apiError.js';
import { omitUndefined } from '../../utils/helpers.js';

export interface FAQListItem {
  id: string;
  clientId: string;
  category: string;
  question: string;
  answer: string;
  answerHi?: string;
  keywords: string[];
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class FAQService {
  static async create(data: CreateFAQRequest): Promise<FAQListItem> {
    const faq = await FAQModel.create(data);
    return this.formatFAQ(faq);
  }

  static async getById(id: string): Promise<FAQListItem> {
    const faq = await FAQModel.findOne({ _id: id, isDeleted: false });
    if (!faq) {
      throw ApiError.notFound('FAQ not found');
    }
    return this.formatFAQ(faq);
  }

  static async update(id: string, data: UpdateFAQRequest): Promise<FAQListItem> {
    const faq = await FAQModel.findOne({ _id: id, isDeleted: false });
    if (!faq) {
      throw ApiError.notFound('FAQ not found');
    }

    const updateData = omitUndefined(data as Record<string, any>);
    Object.assign(faq, updateData);
    await faq.save();

    return this.formatFAQ(faq);
  }

  static async delete(id: string): Promise<void> {
    const faq = await FAQModel.findOne({ _id: id, isDeleted: false });
    if (!faq) {
      throw ApiError.notFound('FAQ not found');
    }

    faq.isDeleted = true;
    faq.isActive = false;
    await faq.save();
  }

  static async list(clientId: string, query: PaginationQuery): Promise<{
    items: FAQListItem[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const filter: any = { clientId, isDeleted: false };

    if (query.search) {
      filter.$or = [
        { question: { $regex: query.search, $options: 'i' } },
        { answer: { $regex: query.search, $options: 'i' } },
        { keywords: { $in: [new RegExp(query.search, 'i')] } },
        { category: { $regex: query.search, $options: 'i' } },
      ];
    }

    const sortField = (query.sort as string) || 'priority';
    const sortOrder = query.order === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      FAQModel.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      FAQModel.countDocuments(filter),
    ]);

    return {
      items: items.map(item => this.formatFAQ(item as unknown as FAQListItem as unknown as FAQDocument)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  static async getAllActive(clientId: string): Promise<FAQListItem[]> {
    const items = await FAQModel.find({
      clientId,
      isActive: true,
      isDeleted: false,
    })
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    return items.map(item => this.formatFAQ(item as unknown as FAQDocument));
  }

  static async getByCategory(clientId: string, category: string): Promise<FAQListItem[]> {
    const items = await FAQModel.find({
      clientId,
      category,
      isActive: true,
      isDeleted: false,
    })
      .sort({ priority: -1 })
      .lean();

    return items.map(item => this.formatFAQ(item as unknown as FAQDocument));
  }

  static async getAllCategories(clientId: string): Promise<string[]> {
    const categories = await FAQModel.distinct('category', {
      clientId,
      isActive: true,
      isDeleted: false,
    });
    return categories;
  }

  static async search(clientId: string, query: string, language?: string): Promise<FAQListItem[]> {
    const filter: any = {
      clientId,
      isActive: true,
      isDeleted: false,
    };

    if (query) {
      filter.$text = { $search: query };
    }

    const items = await FAQModel.find(filter)
      .sort(query ? { score: { $meta: 'textScore' }, priority: -1 } : { priority: -1 })
      .limit(10)
      .lean();

    return items.map(item => this.formatFAQ(item as unknown as FAQDocument));
  }

  private static formatFAQ(faq: FAQDocument): FAQListItem {
    return {
      id: faq._id.toString(),
      clientId: faq.clientId.toString(),
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      answerHi: faq.answerHi,
      keywords: faq.keywords,
      priority: faq.priority,
      isActive: faq.isActive,
      createdAt: faq.createdAt,
      updatedAt: faq.updatedAt,
    };
  }
}
