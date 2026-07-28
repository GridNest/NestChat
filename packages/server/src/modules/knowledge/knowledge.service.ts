import { Types } from 'mongoose';
import { CreateKnowledgeRequest, UpdateKnowledgeRequest, PaginationQuery } from '@nestchat/shared';
import { KnowledgeModel, KnowledgeDocument } from './knowledge.model.js';
import { ClientModel } from '../client/client.model.js';
import { ApiError } from '../../utils/apiError.js';
import { omitUndefined, slugify } from '../../utils/helpers.js';

export interface KnowledgeImportRow {
  clientId: string;
  pageName: string;
  title: string;
  content: string;
  category?: string;
  tags?: string;
  status?: string;
  language?: string;
  priority?: number;
}

export interface KnowledgeImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: number;
  rows: Array<{
    row: number;
    title: string;
    status: 'imported' | 'skipped' | 'error';
    message: string;
  }>;
}

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
  status: 'published' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}

export class KnowledgeService {
  static async create(data: CreateKnowledgeRequest & { status?: string }, createdBy?: string): Promise<KnowledgeListItem> {
    const slug = slugify(data.pageName);

    const existing = await KnowledgeModel.findOne({
      clientId: data.clientId,
      slug,
      isDeleted: false,
    });

    if (existing) {
      throw ApiError.conflict('Knowledge entry with this page name already exists');
    }

    const createData: any = {
      ...data,
      slug,
      createdBy,
      updatedBy: createdBy,
    };

    if (data.status) {
      createData.isActive = data.status === 'published';
      delete createData.status;
    }

    const knowledge = await KnowledgeModel.create(createData);

    return this.formatKnowledge(knowledge);
  }

  static async getById(id: string): Promise<KnowledgeListItem> {
    if (!id || id === 'undefined' || !Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid Knowledge ID');
    }
    const knowledge = await KnowledgeModel.findOne({ _id: id, isDeleted: false });
    if (!knowledge) {
      throw ApiError.notFound('Knowledge entry not found');
    }
    return this.formatKnowledge(knowledge);
  }

  static async update(id: string, data: UpdateKnowledgeRequest & { status?: string }, updatedBy?: string): Promise<KnowledgeListItem> {
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

    if (updateData.status) {
      updateData.isActive = updateData.status === 'published';
      delete updateData.status;
    }

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

  static async list(clientId: string, query: PaginationQuery & { category?: string; status?: string }): Promise<{
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

    if (query.category) {
      filter.category = query.category;
    }

    if (query.status) {
      filter.isActive = query.status === 'published';
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
      items: items.map((item: any) => this.formatKnowledge(item as unknown as KnowledgeDocument)),
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

    return items.map((item: any) => this.formatKnowledge(item as unknown as KnowledgeDocument));
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

    return items.map((item: any) => this.formatKnowledge(item as unknown as KnowledgeDocument));
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

    return items.map((item: any) => this.formatKnowledge(item as unknown as KnowledgeDocument));
  }

  static async bulkDelete(ids: string[]): Promise<void> {
    await KnowledgeModel.updateMany(
      { _id: { $in: ids }, isDeleted: false },
      { $set: { isDeleted: true, isActive: false } }
    );
  }

  static async bulkUpdateStatus(ids: string[], status: 'published' | 'draft'): Promise<void> {
    await KnowledgeModel.updateMany(
      { _id: { $in: ids }, isDeleted: false },
      { $set: { isActive: status === 'published' } }
    );
  }

  static async getCategories(clientId?: string): Promise<string[]> {
    const filter: any = { isDeleted: false };
    if (clientId && clientId !== 'categories') {
      if (Types.ObjectId.isValid(clientId)) {
        filter.clientId = new Types.ObjectId(clientId);
      } else {
        const client = await ClientModel.findOne({ clientId: clientId.trim().toLowerCase() }).lean();
        if (client) {
          filter.clientId = client._id;
        } else {
          return [];
        }
      }
    }
    const categories = await KnowledgeModel.distinct('category', filter);
    return categories.sort();
  }

  static async getAllCategories(clientId?: string): Promise<string[]> {
    return this.getCategories(clientId);
  }

  static generateCsvTemplate(): string {
    const headers = ['clientId', 'pageName', 'title', 'content', 'category', 'tags', 'status', 'language', 'priority'];
    const example = ['client-id-here', 'working-hours', 'Office Hours', 'We are open 9AM to 6PM Monday through Friday.', 'general', 'hours, schedule', 'published', 'en', '1'];
    return [headers.join(','), example.join(',')].join('\n');
  }

  static async exportToCsv(clientId?: string, filter: { ids?: string[]; status?: string; category?: string } = {}): Promise<string> {
    const query: any = { isDeleted: false };
    if (clientId) query.clientId = clientId;
    if (filter.ids) query._id = { $in: filter.ids };
    if (filter.status) query.isActive = filter.status === 'published';
    if (filter.category) query.category = filter.category;

    const articles = await KnowledgeModel.find(query).sort({ priority: -1 }).lean();

    const headers = ['clientId', 'pageName', 'title', 'content', 'category', 'tags', 'status', 'language', 'priority'];
    const rows = articles.map(article => {
      const status = (article as any).isActive ? 'published' : 'draft';
      const tags = ((article as any).tags || []).join('; ');
      const escapedContent = `"${((article as any).content || '').replace(/"/g, '""')}"`;
      const escapedTitle = `"${((article as any).title || '').replace(/"/g, '""')}"`;
      return [
        (article as any).clientId.toString(),
        (article as any).pageName,
        escapedTitle,
        escapedContent,
        (article as any).category,
        tags,
        status,
        (article as any).language || 'en',
        (article as any).priority || 0,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  static async importPreview(csvContent: string): Promise<{
    total: number;
    valid: number;
    duplicates: number;
    errors: number;
    rows: Array<{ row: number; title: string; status: string; message: string }>;
  }> {
    const lines = csvContent.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      return { total: 0, valid: 0, duplicates: 0, errors: 0, rows: [] };
    }

    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const colIndex = (name: string) => headers.indexOf(name);

    const rows: Array<{ row: number; title: string; status: string; message: string }> = [];
    let valid = 0, duplicates = 0, errors = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      const title = values[colIndex('title')]?.trim() || '';
      const pageName = values[colIndex('pagename')]?.trim() || '';
      const clientId = values[colIndex('clientid')]?.trim() || '';

      if (!title) {
        errors++;
        rows.push({ row: i + 1, title: '', status: 'error', message: 'Missing title' });
        continue;
      }
      if (!pageName) {
        errors++;
        rows.push({ row: i + 1, title, status: 'error', message: 'Missing pageName' });
        continue;
      }
      if (!clientId) {
        errors++;
        rows.push({ row: i + 1, title, status: 'error', message: 'Missing clientId' });
        continue;
      }

      const slug = slugify(pageName);
      const existing = await KnowledgeModel.findOne({
        slug,
        isDeleted: false,
      }).lean();

      if (existing) {
        duplicates++;
        rows.push({ row: i + 1, title, status: 'skipped', message: `Duplicate slug: ${slug}` });
      } else {
        valid++;
        rows.push({ row: i + 1, title, status: 'valid', message: 'Ready to import' });
      }
    }

    return { total: lines.length - 1, valid, duplicates, errors, rows };
  }

  static async importFromCsv(csvContent: string): Promise<KnowledgeImportResult> {
    const lines = csvContent.split('\n').map(l => l.trim()).filter(Boolean);
    const result: KnowledgeImportResult = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: 0,
      rows: [],
    };

    if (lines.length < 2) {
      return { ...result, success: false, errors: 1, rows: [{ row: 0, title: '', status: 'error', message: 'CSV file is empty or missing header' }] };
    }

    const headerLine = lines[0].toLowerCase();
    const requiredColumns = ['clientid', 'pagename', 'title', 'content'];
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

    for (const col of requiredColumns) {
      if (!headers.includes(col)) {
        return { ...result, success: false, errors: 1, rows: [{ row: 0, title: '', status: 'error', message: `Missing required column: ${col}` }] };
      }
    }

    const colIndex = (name: string) => headers.indexOf(name);
    const knownClients = new Map<string, string>();
    const knownSlugs = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      const rowNum = i + 1;

      const clientId = values[colIndex('clientid')]?.trim() || '';
      const pageName = values[colIndex('pagename')]?.trim() || '';
      const title = values[colIndex('title')]?.trim() || '';
      const content = values[colIndex('content')]?.trim() || '';
      const category = values[colIndex('category')]?.trim() || 'general';
      const tagsRaw = values[colIndex('tags')]?.trim() || '';
      const statusRaw = values[colIndex('status')]?.trim().toLowerCase() || 'published';
      const language = values[colIndex('language')]?.trim() || 'en';
      const priority = parseInt(values[colIndex('priority')]?.trim()) || 0;
      const tags = tagsRaw ? tagsRaw.split(';').map(t => t.trim()).filter(Boolean) : [];

      const rowErrors: string[] = [];
      if (!clientId) rowErrors.push('clientId is required');
      if (!pageName) rowErrors.push('pageName is required');
      if (!title) rowErrors.push('title is required');
      if (!content) rowErrors.push('content is required');

      if (rowErrors.length > 0) {
        result.errors++;
        result.rows.push({ row: rowNum, title, status: 'error', message: rowErrors.join('; ') });
        continue;
      }

      const slug = slugify(pageName);

      if (knownSlugs.has(slug)) {
        result.skipped++;
        result.rows.push({ row: rowNum, title, status: 'skipped', message: 'Duplicate slug in import' });
        continue;
      }
      knownSlugs.add(slug);

      if (!knownClients.has(clientId)) {
        const client = await ClientModel.findOne({ clientId }).lean();
        if (client) {
          knownClients.set(clientId, (client as any)._id.toString());
        } else {
          try {
            const clientById = await ClientModel.findById(clientId).lean();
            if (clientById) knownClients.set(clientId, (clientById as any)._id.toString());
          } catch {
            result.errors++;
            result.rows.push({ row: rowNum, title, status: 'error', message: `Client "${clientId}" not found` });
            continue;
          }
        }
      }

      const resolvedClientId = knownClients.get(clientId);
      if (!resolvedClientId) {
        result.errors++;
        result.rows.push({ row: rowNum, title, status: 'error', message: `Client "${clientId}" not found` });
        continue;
      }

      const existing = await KnowledgeModel.findOne({
        clientId: resolvedClientId,
        slug,
        isDeleted: false,
      }).lean();

      if (existing) {
        result.skipped++;
        result.rows.push({ row: rowNum, title, status: 'skipped', message: `Article with slug "${slug}" already exists` });
        continue;
      }

      await KnowledgeModel.create({
        clientId: resolvedClientId,
        pageName,
        slug,
        title,
        content,
        category,
        tags,
        language: language as any,
        priority,
        isActive: statusRaw === 'published' || statusRaw === 'true' || statusRaw === '1',
      });

      result.imported++;
      result.rows.push({ row: rowNum, title, status: 'imported', message: 'Imported successfully' });
    }

    return result;
  }

  private static parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  private static formatKnowledge(knowledge: KnowledgeDocument): KnowledgeListItem {
    return {
      id: ((knowledge as any)._id || (knowledge as any).id).toString(),
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
      status: knowledge.isActive ? 'published' as const : 'draft' as const,
      createdAt: knowledge.createdAt,
      updatedAt: knowledge.updatedAt,
    };
  }
}
