import { TranslationModel } from './translation.model.js';
import { ApiError } from '../../utils/apiError.js';

export interface TranslationListItem {
  id: string;
  clientId: string;
  language: string;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TranslationService {
  static async getByClient(clientId: string, language?: string): Promise<TranslationListItem[]> {
    const filter: any = { clientId };
    if (language) filter.language = language;
    const items = await TranslationModel.find(filter).sort({ language: 1, key: 1 }).lean();
    return items.map(item => this.format(item as any));
  }

  static async getByClientAsMap(clientId: string): Promise<Record<string, Record<string, string>>> {
    const items = await TranslationModel.find({ clientId }).lean();
    const map: Record<string, Record<string, string>> = {};
    for (const item of items) {
      if (!map[item.language]) map[item.language] = {};
      map[item.language][item.key] = item.value;
    }
    return map;
  }

  static async upsert(clientId: string, language: string, key: string, value: string): Promise<TranslationListItem> {
    const doc = await TranslationModel.findOneAndUpdate(
      { clientId, language, key },
      { $set: { value } },
      { upsert: true, new: true }
    ).lean();
    return this.format(doc as any);
  }

  static async bulkUpsert(clientId: string, translations: Array<{ language: string; key: string; value: string }>): Promise<number> {
    let count = 0;
    for (const t of translations) {
      await TranslationModel.findOneAndUpdate(
        { clientId, language: t.language, key: t.key },
        { $set: { value: t.value } },
        { upsert: true, new: true }
      );
      count++;
    }
    return count;
  }

  static async delete(clientId: string, language: string, key: string): Promise<void> {
    const result = await TranslationModel.findOneAndDelete({ clientId, language, key });
    if (!result) throw ApiError.notFound('Translation not found');
  }

  static async deleteByLanguage(clientId: string, language: string): Promise<number> {
    const result = await TranslationModel.deleteMany({ clientId, language });
    return result.deletedCount;
  }

  static async deleteByClient(clientId: string): Promise<number> {
    const result = await TranslationModel.deleteMany({ clientId });
    return result.deletedCount;
  }

  private static format(doc: any): TranslationListItem {
    return {
      id: doc._id.toString(),
      clientId: doc.clientId.toString(),
      language: doc.language,
      key: doc.key,
      value: doc.value,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}