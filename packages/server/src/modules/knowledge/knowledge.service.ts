import { CreateKnowledgeRequest, UpdateKnowledgeRequest, PaginationQuery } from '@nestchat/shared';
import { KnowledgeModel, KnowledgeDocument } from './knowledge.model';
import { ApiError } from '../../utils/apiError';
import { omitUndefined, slugify } from '../../utils/helpers';

export interface KnowledgeListItem {
  id: string;
  clientId: string;
  pageName: string;
  slug: string;
  title: string;
  content: string;
  metaDescription?: string;
  tags: string[];
  category: string;
  language: 'en' | 'hi' | 'both';
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class KnowledgeService {
  static async create(data: CreateKnowledgeRequest, createdBy?: string): Promise<KnowledgeListItem> {
    const slug = slugify(data.pageName);

    const existing = await KnowledgeModel.findOne({
      clientId: data.clientId,
      slug,
      isDeleted: false,
    });

    if (existing) {
      throw ApiError.conflict('Knowledge entry with this page name already exists');
    }

    const knowledge = await KnowledgeModel.create({
      ...data,
      slug,
      createdBy,
      updatedBy: createdBy,
    });

    return this.formatKnowledge(knowledge);
  }

  static async getById(id: string): Promise<KnowledgeListItem> {
    const knowledge = await KnowledgeModel.findOne({ _id: id, isDeleted: false });
    if (!knowledge) {
      throw ApiError.notFound('Knowledge entry not found');
    }
    return this.formatKnowledge(knowledge);
  }

  static async update(id: string, data: UpdateKnowledgeRequest, updatedBy?: string): Promise<KnowledgeListItem> {
    const knowledge = await KnowledgeModel.findOne({ _id: id, isDeleted: false });
    if (!knowledge) {
      throw ApiError.notFound('Knowledge entry not found');
    }

    if (data.pageName && data.pageName !== knowledge.pageName) {
      const slug = slugify(data.pageName);
      const existing = await KnowledgeModel.findOne({
        clientId: knowledge.clientId,
        slug,
        _id: { $ne: id },
        isDeleted: false,
      });
      if (existing) {
        throw ApiError.conflict('Knowledge entry with this page name already exists');
      }
      knowledge.slug = slug;
    }

    const updateData = omitUndefined(data as Record<string, any>);
    Object.assign(knowledge, updateData);
    knowledge.updatedBy = updatedBy as any;
    await knowledge.save();

    return this.formatKnowledge(knowledge);
  }

  static async delete(id: string): Promise<void> {
    const knowledge = await KnowledgeModel.findOne({ _id: id, isDeleted: false });
    if (!knowledge) {
      throw ApiError.notFound('Knowledge entry not found');
    }

    knowledge.isDeleted = true;
    knowledge.isActive = false;
    await knowledge.save();
  }

  static async list(clientId: string, query: PaginationQuery): Promise<{
    items: KnowledgeListItem[];
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
        { title: { $regex: query.search, $options: 'i' } },
        { pageName: { $regex: query.search, $options: 'i' } },
        { content: { $regex: query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(query.search, 'i')] } },
      ];
    }

    const sortField = (query.sort as string) || 'priority';
    const sortOrder = query.order === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      KnowledgeModel.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      KnowledgeModel.countDocuments(filter),
    ]);

    return {
      items: items.map(item => this.formatKnowledge(item as unknown as KnowledgeDocument)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  static async getAllActive(clientId: string): Promise<KnowledgeListItem[]> {
    const items = await KnowledgeModel.find({
      clientId,
      isActive: true,
      isDeleted: false,
    })
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    return items.map(item => this.formatKnowledge(item as unknown as KnowledgeDocument));
  }

  static async search(clientId: string, query: string, language?: string): Promise<KnowledgeListItem[]> {
    const filter: any = {
      clientId,
      isActive: true,
      isDeleted: false,
    };

    if (language && language !== 'both') {
      filter.$or = [{ language }, { language: 'both' }];
    }

    if (query) {
      filter.$text = { $search: query };
    }

    const items = await KnowledgeModel.find(filter)
      .sort(query ? { score: { $meta: 'textScore' }, priority: -1 } : { priority: -1 })
      .limit(10)
      .lean();

    return items.map(item => this.formatKnowledge(item as unknown as KnowledgeDocument));
  }

  static async getBySlug(clientId: string, slug: string): Promise<KnowledgeListItem | null> {
    const knowledge = await KnowledgeModel.findOne({
      clientId,
      slug,
      isActive: true,
      isDeleted: false,
    }).lean();

    return knowledge ? this.formatKnowledge(knowledge as unknown as KnowledgeDocument) : null;
  }

  static async getByCategory(clientId: string, category: string): Promise<KnowledgeListItem[]> {
    const items = await KnowledgeModel.find({
      clientId,
      category,
      isActive: true,
      isDeleted: false,
    })
      .sort({ priority: -1 })
      .lean();

    return items.map(item => this.formatKnowledge(item as unknown as KnowledgeDocument));
  }

  private static formatKnowledge(knowledge: KnowledgeDocument): KnowledgeListItem {
    return {
      id: knowledge._id.toString(),
      clientId: knowledge.clientId.toString(),
      pageName: knowledge.pageName,
      slug: knowledge.slug,
      title: knowledge.title,
      content: knowledge.content,
      metaDescription: knowledge.metaDescription,
      tags: knowledge.tags,
      category: knowledge.category,
      language: knowledge.language,
      priority: knowledge.priority,
      isActive: knowledge.isActive,
      createdAt: knowledge.createdAt,
      updatedAt: knowledge.updatedAt,
    };
  }
}
