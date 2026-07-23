import { CreateClientRequest, UpdateClientRequest, PaginationQuery } from '@nestchat/shared';
import { ClientModel, ClientDocument } from './client.model';
import { ApiError } from '../../utils/apiError';
import { omitUndefined } from '../../utils/helpers';

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
  status: string;
  isActive: boolean;
  createdAt: Date;
}

export class ClientService {
  static async create(data: CreateClientRequest & { createdBy: string }): Promise<ClientListItem> {
    const existingClient = await ClientModel.findOne({ 
      $or: [{ email: data.email }, { clientId: data.name.toLowerCase().replace(/\s+/g, '-') }]
    });
    
    if (existingClient) {
      throw new ApiError(400, 'Client with this email or name already exists');
    }

    const client = await ClientModel.create({
      clientId: data.name.toLowerCase().replace(/\s+/g, '-'),
      name: data.name,
      email: data.email,
      companyName: data.companyName,
      phone: data.phone,
      website: data.website,
      websiteType: data.websiteType || 'corporate',
      logo: data.logo,
      primaryColor: data.primaryColor || '#3B82F6',
      secondaryColor: data.secondaryColor || '#1E40AF',
      botName: data.botName || 'Assistant',
      defaultLanguage: data.defaultLanguage || 'en',
      timezone: data.timezone || 'Asia/Kolkata',
      createdBy: data.createdBy,
    });

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
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
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
    const client = await ClientModel.findByIdAndUpdate(id, omitUndefined(data), { new: true });
    if (!client) {
      throw new ApiError(404, 'Client not found');
    }
    return this.formatClient(client);
  }

  static async delete(id: string): Promise<void> {
    const client = await ClientModel.findByIdAndDelete(id);
    if (!client) {
      throw new ApiError(404, 'Client not found');
    }
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
      createdAt: client.createdAt,
    };
  }
}
