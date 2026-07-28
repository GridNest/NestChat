import { CreateFAQRequest, UpdateFAQRequest, PaginationQuery } from '@nestchat/shared';
import { FAQModel, FAQDocument } from './faq.model.js';
import { ClientModel } from '../client/client.model.js';
import { ApiError } from '../../utils/apiError.js';
import { omitUndefined, slugify } from '../../utils/helpers.js';

export interface FAQImportRow {
  clientId: string;
  question: string;
  answer: string;
  category: string;
  priority: number;
  published: string;
  tags: string;
  _errors?: string[];
  _existing?: boolean;
}

export interface FAQImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: number;
  rows: Array<{
    row: number;
    question: string;
    status: 'imported' | 'skipped' | 'error';
    message: string;
  }>;
}

export interface FAQListItem {
  id: string;
  clientId: string;
  category: string;
  question: string;
  answer: string;
  answerHi?: string;
  keywords: string[];
  priority: number;
  language: string;
  isActive: boolean;
  status: 'published' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}

export class FAQService {
  static async create(data: CreateFAQRequest & { status?: string }): Promise<FAQListItem> {
    const createData: any = { ...data };
    if (data.status !== undefined) {
      createData.isActive = data.status === 'published';
      delete createData.status;
    }
    const faq = await FAQModel.create(createData);
    return this.formatFAQ(faq);
  }

  static async getById(id: string): Promise<FAQListItem> {
    const faq = await FAQModel.findOne({ _id: id, isDeleted: false });
    if (!faq) {
      throw ApiError.notFound('FAQ not found');
    }
    return this.formatFAQ(faq);
  }

  static async update(id: string, data: UpdateFAQRequest & { status?: string }): Promise<FAQListItem> {
    const faq = await FAQModel.findOne({ _id: id, isDeleted: false });
    if (!faq) {
      throw ApiError.notFound('FAQ not found');
    }

    const updateData = omitUndefined(data as Record<string, any>);

    if (updateData.status) {
      updateData.isActive = updateData.status === 'published';
      delete updateData.status;
    }

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

  static async list(clientId: string, query: PaginationQuery & { category?: string; status?: string; language?: string; ids?: string[] }): Promise<{
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

    if (query.category) {
      filter.category = query.category;
    }

    if (query.status) {
      filter.isActive = query.status === 'published';
    }

    if (query.language) {
      filter.language = query.language;
    }

    if (query.ids && query.ids.length > 0) {
      filter._id = { $in: query.ids };
    }

    const sortField = (query.sort as string) || 'priority';
    const sortOrder = query.order === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      FAQModel.find(filter)
        .populate('clientId', 'name companyName clientId')
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

  static async bulkDelete(ids: string[]): Promise<void> {
    await FAQModel.updateMany(
      { _id: { $in: ids }, isDeleted: false },
      { $set: { isDeleted: true, isActive: false } }
    );
  }

  static async bulkUpdateStatus(ids: string[], status: 'published' | 'draft'): Promise<void> {
    await FAQModel.updateMany(
      { _id: { $in: ids }, isDeleted: false },
      { $set: { isActive: status === 'published' } }
    );
  }

  static generateCsvTemplate(): string {
    const headers = ['clientId', 'question', 'answer', 'category', 'priority', 'published', 'tags'];
    const example = ['client-id-here', 'What are your hours?', 'We are open 9AM-6PM', 'general', '1', 'true', 'hours, timing'];
    return [headers.join(','), example.join(',')].join('\n');
  }

  static async exportToCsv(clientId?: string, filter: { ids?: string[]; status?: string; category?: string } = {}): Promise<string> {
    const query: any = { isDeleted: false };
    if (clientId) query.clientId = clientId;
    if (filter.ids) query._id = { $in: filter.ids };
    if (filter.status) query.isActive = filter.status === 'published';
    if (filter.category) query.category = filter.category;

    const faqs = await FAQModel.find(query).sort({ priority: -1 }).lean();

    const headers = ['clientId', 'question', 'answer', 'category', 'priority', 'published', 'tags'];
    const rows = faqs.map(faq => {
      const published = faq.isActive ? 'true' : 'false';
      const tags = (faq.keywords || []).join('; ');
      const escapedAnswer = `"${(faq.answer || '').replace(/"/g, '""')}"`;
      const escapedQuestion = `"${(faq.question || '').replace(/"/g, '""')}"`;
      return [faq.clientId.toString(), escapedQuestion, escapedAnswer, faq.category, faq.priority, published, tags].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  static async importFromCsv(csvContent: string): Promise<FAQImportResult> {
    const lines = csvContent.split('\n').map(l => l.trim()).filter(Boolean);
    const result: FAQImportResult = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: 0,
      rows: [],
    };

    if (lines.length < 2) {
      return { ...result, success: false, errors: 1, rows: [{ row: 0, question: '', status: 'error', message: 'CSV file is empty or missing header' }] };
    }

    const headerLine = lines[0].toLowerCase();
    const requiredColumns = ['clientid', 'question', 'answer'];
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

    for (const col of requiredColumns) {
      if (!headers.includes(col)) {
        return { ...result, success: false, errors: 1, rows: [{ row: 0, question: '', status: 'error', message: `Missing required column: ${col}` }] };
      }
    }

    const colIndex = (name: string) => headers.indexOf(name);
    const knownClients = new Map<string, string>();
    const knownQuestions = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = this.parseCsvLine(line);
      const rowNum = i + 1;

      const clientId = values[colIndex('clientid')]?.trim() || '';
      const question = values[colIndex('question')]?.trim() || '';
      const answer = values[colIndex('answer')]?.trim() || '';
      const category = values[colIndex('category')]?.trim() || 'general';
      const priority = parseInt(values[colIndex('priority')]?.trim()) || 0;
      const published = values[colIndex('published')]?.trim().toLowerCase() || 'true';
      const tagsRaw = values[colIndex('tags')]?.trim() || '';
      const tags = tagsRaw ? tagsRaw.split(';').map(t => t.trim()).filter(Boolean) : [];

      const rowErrors: string[] = [];

      if (!clientId) rowErrors.push('clientId is required');
      if (!question) rowErrors.push('question is required');
      if (!answer) rowErrors.push('answer is required');

      if (rowErrors.length > 0) {
        result.errors++;
        result.rows.push({ row: rowNum, question, status: 'error', message: rowErrors.join('; ') });
        continue;
      }

      if (knownQuestions.has(question.toLowerCase())) {
        result.skipped++;
        result.rows.push({ row: rowNum, question, status: 'skipped', message: 'Duplicate question in import' });
        continue;
      }
      knownQuestions.add(question.toLowerCase());

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
            result.rows.push({ row: rowNum, question, status: 'error', message: `Client "${clientId}" not found` });
            continue;
          }
        }
      }

      const resolvedClientId = knownClients.get(clientId);
      if (!resolvedClientId) {
        result.errors++;
        result.rows.push({ row: rowNum, question, status: 'error', message: `Client "${clientId}" not found` });
        continue;
      }

      const existing = await FAQModel.findOne({
        clientId: resolvedClientId,
        question: { $regex: `^${question.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
        isDeleted: false,
      }).lean();

      if (existing) {
        result.skipped++;
        result.rows.push({ row: rowNum, question, status: 'skipped', message: 'Duplicate: FAQ with this question already exists' });
        continue;
      }

      await FAQModel.create({
        clientId: resolvedClientId,
        question,
        answer,
        category,
        priority,
        isActive: published === 'true' || published === '1' || published === 'yes',
        keywords: tags,
      });

      result.imported++;
      result.rows.push({ row: rowNum, question, status: 'imported', message: 'Imported successfully' });
    }

    return result;
  }

  static async importPreview(csvContent: string): Promise<{
    total: number;
    valid: number;
    duplicates: number;
    errors: number;
    rows: Array<{ row: number; question: string; status: string; message: string }>;
  }> {
    const lines = csvContent.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      return { total: 0, valid: 0, duplicates: 0, errors: 0, rows: [] };
    }

    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const colIndex = (name: string) => headers.indexOf(name);

    const rows: Array<{ row: number; question: string; status: string; message: string }> = [];
    let valid = 0, duplicates = 0, errors = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      const question = values[colIndex('question')]?.trim() || '';
      const clientId = values[colIndex('clientid')]?.trim() || '';

      if (!question) {
        errors++;
        rows.push({ row: i + 1, question: '', status: 'error', message: 'Missing question' });
        continue;
      }
      if (!clientId) {
        errors++;
        rows.push({ row: i + 1, question, status: 'error', message: 'Missing clientId' });
        continue;
      }

      const existing = await FAQModel.findOne({
        question: { $regex: `^${question.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
        isDeleted: false,
      }).lean();

      if (existing) {
        duplicates++;
        rows.push({ row: i + 1, question, status: 'skipped', message: 'Duplicate question' });
      } else {
        valid++;
        rows.push({ row: i + 1, question, status: 'valid', message: 'Ready to import' });
      }
    }

    return { total: lines.length - 1, valid, duplicates, errors, rows };
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

  private static formatFAQ(faq: FAQDocument): FAQListItem {
    const rawClient = (faq as any).clientId;
    const clientIdVal = rawClient && typeof rawClient === 'object' && rawClient.clientId
      ? {
          id: rawClient._id?.toString() || rawClient.id,
          name: rawClient.name || '',
          companyName: rawClient.companyName || '',
          clientId: rawClient.clientId || '',
        }
      : rawClient?.toString() || '';

    return {
      id: faq._id.toString(),
      clientId: clientIdVal as any,
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      answerHi: faq.answerHi,
      keywords: faq.keywords,
      priority: faq.priority,
      language: faq.language || 'en',
      isActive: faq.isActive,
      status: faq.isActive ? 'published' as const : 'draft' as const,
      createdAt: faq.createdAt,
      updatedAt: faq.updatedAt,
    };
  }
}
