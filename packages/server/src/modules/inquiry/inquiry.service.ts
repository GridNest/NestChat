import { CreateInquiryRequest, UpdateInquiryRequest, PaginationQuery } from '@nestchat/shared';
import { InquiryModel, InquiryDocument } from './inquiry.model';
import { InquiryStateModel, InquiryStateDocument } from './inquiryState.model';
import { ExternalApiService } from './externalApiService';
import { ApiError } from '../../utils/apiError';
import { omitUndefined } from '../../utils/helpers';

export interface InquiryListItem {
  id: string;
  clientId: string;
  chatId?: string;
  sessionId?: string;
  visitorId?: string;
  name: string;
  email: string;
  phone: string;
  country?: string;
  state?: string;
  service: string;
  details: string;
  company?: string;
  source: 'chatbot' | 'website' | 'manual';
  status: 'new' | 'contacted' | 'converted' | 'closed';
  externalApiStatus: 'pending' | 'forwarded' | 'failed' | 'no_api';
  language: 'en' | 'hi';
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class InquiryService {
  static async create(data: CreateInquiryRequest & { chatId?: string; visitorId?: string; language?: string }): Promise<InquiryListItem> {
    const inquiry = await InquiryModel.create({
      clientId: data.clientId,
      chatId: data.chatId,
      sessionId: data.sessionId,
      visitorId: data.visitorId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      country: data.country,
      state: data.state,
      service: data.service,
      details: data.details,
      company: data.company,
      source: 'chatbot',
      language: data.language || 'en',
      externalApiStatus: 'pending',
    });

    const forwardResult = await ExternalApiService.forwardInquiry(inquiry, data.clientId);

    inquiry.externalApiStatus = forwardResult.status as any;
    inquiry.externalApiResponse = forwardResult.response;
    if (forwardResult.status === 'forwarded') {
      inquiry.forwardedAt = new Date();
    }
    await inquiry.save();

    return this.formatInquiry(inquiry);
  }

  static async forwardToExternal(
    inquiry: InquiryDocument,
    clientId: string
  ): Promise<{ success: boolean; status: string; response?: string }> {
    const result = await ExternalApiService.forwardInquiry(inquiry, clientId);
    return {
      success: result.success,
      status: result.status,
      response: result.response,
    };
  }

  static async retryForward(id: string): Promise<InquiryListItem> {
    const inquiry = await InquiryModel.findOne({ _id: id });
    if (!inquiry) {
      throw ApiError.notFound('Inquiry not found');
    }

    const result = await ExternalApiService.retryForward(inquiry, inquiry.clientId.toString());

    inquiry.externalApiStatus = result.status as any;
    inquiry.externalApiResponse = result.response || result.error;
    if (result.status === 'forwarded') {
      inquiry.forwardedAt = new Date();
    }
    await inquiry.save();

    return this.formatInquiry(inquiry);
  }

  static async getById(id: string): Promise<InquiryListItem> {
    const inquiry = await InquiryModel.findOne({ _id: id });
    if (!inquiry) {
      throw ApiError.notFound('Inquiry not found');
    }
    return this.formatInquiry(inquiry);
  }

  static async update(id: string, data: UpdateInquiryRequest): Promise<InquiryListItem> {
    const inquiry = await InquiryModel.findOne({ _id: id });
    if (!inquiry) {
      throw ApiError.notFound('Inquiry not found');
    }

    const updateData = omitUndefined(data as Record<string, any>);
    Object.assign(inquiry, updateData);
    await inquiry.save();

    return this.formatInquiry(inquiry);
  }

  static async list(clientId: string, query: PaginationQuery): Promise<{
    items: InquiryListItem[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const filter: any = { clientId };

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
        { service: { $regex: query.search, $options: 'i' } },
      ];
    }

    const sortField = (query.sort as string) || 'createdAt';
    const sortOrder = query.order === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      InquiryModel.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      InquiryModel.countDocuments(filter),
    ]);

    return {
      items: items.map(item => this.formatInquiry(item as unknown as InquiryDocument)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  static async getStats(clientId: string): Promise<{
    total: number;
    new: number;
    contacted: number;
    converted: number;
    closed: number;
  }> {
    const [total, newCount, contacted, converted, closed] = await Promise.all([
      InquiryModel.countDocuments({ clientId }),
      InquiryModel.countDocuments({ clientId, status: 'new' }),
      InquiryModel.countDocuments({ clientId, status: 'contacted' }),
      InquiryModel.countDocuments({ clientId, status: 'converted' }),
      InquiryModel.countDocuments({ clientId, status: 'closed' }),
    ]);

    return { total, new: newCount, contacted, converted, closed };
  }

  private static formatInquiry(inquiry: InquiryDocument): InquiryListItem {
    return {
      id: inquiry._id.toString(),
      clientId: inquiry.clientId.toString(),
      chatId: inquiry.chatId?.toString(),
      sessionId: inquiry.sessionId,
      visitorId: inquiry.visitorId,
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      country: inquiry.country,
      state: inquiry.state,
      service: inquiry.service,
      details: inquiry.details,
      company: inquiry.company,
      source: inquiry.source,
      status: inquiry.status,
      externalApiStatus: inquiry.externalApiStatus,
      language: inquiry.language,
      submittedAt: inquiry.submittedAt,
      createdAt: inquiry.createdAt,
      updatedAt: inquiry.updatedAt,
    };
  }
}
