import { CreateClientRequest, UpdateClientRequest, PaginationQuery } from '@nestchat/shared';
import { ClientModel, ClientDocument } from './client.model';
import { ApiError } from '../../utils/apiError';
import { omitUndefined } from '../../utils/helpers';

export interface ClientListItem {
  id: string;
  name: string;
  email: string;
  company: string;
  phone?: string;
  website?: string;
  industry?: string;
  isActive: boolean;
  createdAt: Date;
}

export class ClientService {
  static async create(data: CreateClientRequest, createdBy: string): Promise<ClientListItem> {
    const existingClient = await ClientModel.findOne({ email: data.email });
    if (existingClient) {
      throw ApiError.conflict('Client with this email already exists');
    }

    const client = await ClientModel.create({
      ...data,
      createdBy,
    });

    return this.formatClient(client);
  }

  static async getById(id: string): Promise<ClientListItem> {
    const client = await ClientModel.findById(id);
    if (!client) {
      throw ApiError.notFound('Client not found');
    }
    return this.formatClient(client);
  }

  static async update(id: string, data: UpdateClientRequest): Promise<ClientListItem> {
    const client = await ClientModel.findById(id);
    if (!client) {
      throw ApiError.notFound('Client not found');
    }

    const updateData = omitUndefined(data as Record<string, any>);
    Object.assign(client, updateData);
    await client.save();

    return this.formatClient(client);
  }

  static async delete(id: string): Promise<void> {
    const client = await ClientModel.findById(id);
    if (!client) {
      throw ApiError.notFound('Client not found');
    }

    client.isActive = false;
    await client.save();
  }

  static async list(query: PaginationQuery): Promise<{
    clients: ClientListItem[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const filter: any = { isActive: true };
    
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { company: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }

    const sortField = (query.sort as string) || 'createdAt';
    const sortOrder = query.order === 'asc' ? 1 : -1;

    const [clients, total] = await Promise.all([
      ClientModel.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      ClientModel.countDocuments(filter),
    ]);

    return {
      clients: clients.map(client => this.formatClient(client as unknown as ClientDocument)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  static async getByCreatedBy(userId: string): Promise<ClientListItem[]> {
    const clients = await ClientModel.find({ createdBy: userId, isActive: true })
      .sort({ createdAt: -1 })
      .lean();
    return clients.map(client => this.formatClient(client as unknown as ClientDocument));
  }

  private static formatClient(client: ClientDocument): ClientListItem {
    return {
      id: client._id.toString(),
      name: client.name,
      email: client.email,
      company: client.company,
      phone: client.phone,
      website: client.website,
      industry: client.industry,
      isActive: client.isActive,
      createdAt: client.createdAt,
    };
  }
}
