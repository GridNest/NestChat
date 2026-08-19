import mongoose from 'mongoose';
import { CreateClientRequest, UpdateClientRequest, PaginationQuery } from '@nestchat/shared';
import { ClientModel, ClientDocument } from './client.model.js';
import { ClientConfigModel } from '../clientConfig/clientConfig.model.js';
import { ClientThemeModel } from '../clientTheme/clientTheme.model.js';
import { ClientModuleModel } from '../clientModule/clientModule.model.js';
import { KnowledgeModel } from '../knowledge/knowledge.model.js';
import { FAQModel } from '../faq/faq.model.js';
import { ChatModel } from '../chat/chat.model.js';
import { InquiryModel } from '../inquiry/inquiry.model.js';
import { WebsiteContentModel } from '../websiteContent/websiteContent.model.js';
import { WebsiteConnectorModel } from '../websiteConnector/websiteConnector.model.js';
import { ApiError } from '../../utils/apiError.js';
import { omitUndefined } from '../../utils/helpers.js';

import { WebsiteScraperService } from '../websiteContent/websiteScraper.service.js';
import { logger } from '../../utils/logger.js';

export interface ClientListItem {
  id: string;
  clientId: string;
  name: string;
  email: string;
  companyName: string;
  phone?: string;
  website?: string;
  websiteType: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  botName: string;
  defaultLanguage: string;
  timezone: string;
  status: 'active' | 'inactive' | 'suspended';
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  allowedDomains: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class ClientService {
  static async create(data: CreateClientRequest & { createdBy?: string }): Promise<ClientListItem> {
    const trimmedName = data.name.trim();
    const trimmedEmail = data.email.trim().toLowerCase();
    const slugId = (data.clientId && data.clientId.trim())
      ? data.clientId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
      : trimmedName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const existingClient = await ClientModel.findOne({ 
      $or: [
        { email: { $regex: `^${trimmedEmail}$`, $options: 'i' } },
        { clientId: slugId },
        { name: { $regex: `^${trimmedName}$`, $options: 'i' } }
      ]
    });
    
    if (existingClient) {
      throw new ApiError(400, 'Client with this email, name, or Client ID already exists');
    }

    const client = await ClientModel.create({
      clientId: slugId,
      name: trimmedName,
      email: trimmedEmail,
      companyName: data.companyName.trim(),
      phone: data.phone ? data.phone.trim() : undefined,
      website: data.website ? data.website.trim() : undefined,
      websiteType: data.websiteType || 'corporate',
      logo: data.logo,
      primaryColor: data.primaryColor || '#3B82F6',
      secondaryColor: data.secondaryColor || '#1E40AF',
      botName: data.botName || 'Assistant',
      defaultLanguage: data.defaultLanguage || 'en',
      timezone: data.timezone || 'Asia/Kolkata',
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      createdBy: data.createdBy,
    });

    if (client.website) {
      WebsiteScraperService.syncWebsite(client._id.toString()).catch((err) => {
        logger.warn(`[ClientService] Automatic website sync failed for ${client.clientId}:`, err);
      });
    }

    return this.formatClient(client);
  }

  static async list(query: PaginationQuery & { status?: string; search?: string }): Promise<{ clients: ClientListItem[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { clientId: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { website: { $regex: search, $options: 'i' } },
      ];
    }

    const [clients, total] = await Promise.all([
      ClientModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ClientModel.countDocuments(filter),
    ]);

    return {
      clients: clients.map(this.formatClient),
      total,
      page,
      limit,
    };
  }

  static async getById(id: string): Promise<ClientListItem> {
    const client = await ClientModel.findById(id);
    if (!client) {
      throw new ApiError(404, 'Client not found');
    }
    return this.formatClient(client);
  }

  static async getByClientId(clientId: string): Promise<ClientListItem> {
    const client = await ClientModel.findOne({ clientId });
    if (!client) {
      throw new ApiError(404, 'Client not found');
    }
    return this.formatClient(client);
  }

  static async update(id: string, data: UpdateClientRequest): Promise<ClientListItem> {
    const updatePayload = omitUndefined(data as Record<string, any>);
    const objId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;

    if (updatePayload.email || updatePayload.name) {
      const existing = await ClientModel.findOne({
        _id: { $ne: objId },
        $or: [
          ...(updatePayload.email ? [{ email: { $regex: `^${updatePayload.email.trim()}$`, $options: 'i' } }] : []),
          ...(updatePayload.name ? [{ name: { $regex: `^${updatePayload.name.trim()}$`, $options: 'i' } }] : [])
        ]
      });
      if (existing) {
        throw new ApiError(400, 'Another client with this email or name already exists');
      }
    }

    const client = await ClientModel.findByIdAndUpdate(id, updatePayload, { new: true });
    if (!client) {
      throw new ApiError(404, 'Client not found');
    }

    if (client.website && updatePayload.website) {
      WebsiteScraperService.syncWebsite(client._id.toString()).catch((err) => {
        logger.warn(`[ClientService] Automatic website sync failed on update for ${client.clientId}:`, err);
      });
    }

    return this.formatClient(client);
  }

  static async delete(id: string): Promise<void> {
    const client = await ClientModel.findById(id);
    if (!client) {
      throw new ApiError(404, 'Client not found');
    }

    await ClientModel.findByIdAndDelete(id);

    // Hard purge all associated records for client isolation and cleanup
    await Promise.allSettled([
      ClientConfigModel.deleteMany({ clientId: client._id }),
      ClientThemeModel.deleteMany({ clientId: client._id }),
      ClientModuleModel.deleteMany({ clientId: client._id }),
      KnowledgeModel.deleteMany({ clientId: { $in: [client._id.toString(), client.clientId] } }),
      FAQModel.deleteMany({ clientId: { $in: [client._id.toString(), client.clientId] } }),
      ChatModel.deleteMany({ clientId: { $in: [client._id.toString(), client.clientId] } }),
      InquiryModel.deleteMany({ clientId: { $in: [client._id.toString(), client.clientId] } }),
      WebsiteContentModel.deleteMany({ clientId: { $in: [client._id.toString(), client.clientId] } }),
      WebsiteConnectorModel.deleteMany({ clientId: { $in: [client._id.toString(), client.clientId] } }),
    ]);
  }

  static async getStats(): Promise<{ total: number; active: number; inactive: number; suspended: number }> {
    const [total, active, inactive, suspended] = await Promise.all([
      ClientModel.countDocuments(),
      ClientModel.countDocuments({ status: 'active' }),
      ClientModel.countDocuments({ status: 'inactive' }),
      ClientModel.countDocuments({ status: 'suspended' }),
    ]);

    return { total, active, inactive, suspended };
  }

  static isClientExpired(client: any): boolean {
    if (!client) return false;
    if (client.status === 'suspended' || client.status === 'inactive' || client.isActive === false) {
      return true;
    }
    if (client.endDate) {
      const end = new Date(client.endDate);
      if (!isNaN(end.getTime()) && Date.now() > end.getTime()) {
        return true;
      }
    }
    return false;
  }

  private static formatClient(client: ClientDocument): ClientListItem {
    return {
      id: client._id.toString(),
      clientId: client.clientId,
      name: client.name,
      email: client.email,
      companyName: client.companyName,
      phone: client.phone,
      website: client.website,
      websiteType: client.websiteType,
      logo: client.logo,
      primaryColor: client.primaryColor,
      secondaryColor: client.secondaryColor,
      botName: client.botName,
      defaultLanguage: client.defaultLanguage,
      timezone: client.timezone,
      status: client.status,
      isActive: client.isActive,
      startDate: client.startDate || client.createdAt,
      endDate: client.endDate,
      allowedDomains: client.allowedDomains || [],
      createdAt: client.createdAt,
      updatedAt: client.updatedAt || client.createdAt,
    };
  }
}
