import { RoleModel, RoleDocument } from './role.model.js';
import { ApiError } from '../../utils/apiError.js';

export interface RoleResponse {
  id: string;
  name: string;
  description: string;
  permissions: { resource: string; actions: string[] }[];
  isSystem: boolean;
}

export class RoleService {
  static async create(data: { name: string; description: string; permissions: { resource: string; actions: string[] }[] }): Promise<RoleResponse> {
    const existingRole = await RoleModel.findOne({ name: data.name });
    if (existingRole) {
      throw new ApiError(400, 'Role with this name already exists');
    }

    const role = await RoleModel.create({
      name: data.name,
      description: data.description,
      permissions: data.permissions,
      isSystem: false,
    });

    return this.formatRole(role);
  }

  static async list(): Promise<RoleResponse[]> {
    const roles = await RoleModel.find().sort({ name: 1 });
    return roles.map(this.formatRole);
  }

  static async getById(id: string): Promise<RoleResponse> {
    const role = await RoleModel.findById(id);
    if (!role) {
      throw new ApiError(404, 'Role not found');
    }
    return this.formatRole(role);
  }

  static async getByName(name: string): Promise<RoleResponse> {
    const role = await RoleModel.findOne({ name });
    if (!role) {
      throw new ApiError(404, 'Role not found');
    }
    return this.formatRole(role);
  }

  static async update(id: string, data: { name?: string; description?: string; permissions?: { resource: string; actions: string[] }[] }): Promise<RoleResponse> {
    const role = await RoleModel.findById(id);
    if (!role) {
      throw new ApiError(404, 'Role not found');
    }

    if (role.isSystem) {
      throw new ApiError(400, 'Cannot modify system role');
    }

    const updatedRole = await RoleModel.findByIdAndUpdate(id, data, { new: true });
    return this.formatRole(updatedRole!);
  }

  static async delete(id: string): Promise<void> {
    const role = await RoleModel.findById(id);
    if (!role) {
      throw new ApiError(404, 'Role not found');
    }

    if (role.isSystem) {
      throw new ApiError(400, 'Cannot delete system role');
    }

    await RoleModel.findByIdAndDelete(id);
  }

  static async initializeSystemRoles(): Promise<void> {
    const systemRoles = [
      {
        name: 'super_admin',
        description: 'Full access to all features',
        permissions: [
          { resource: 'clients', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'knowledge', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'faqs', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'inquiries', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'settings', actions: ['read', 'update'] },
        ],
        isSystem: true,
      },
      {
        name: 'client_admin',
        description: 'Admin access for client-specific data',
        permissions: [
          { resource: 'knowledge', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'faqs', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'inquiries', actions: ['read', 'update'] },
          { resource: 'settings', actions: ['read', 'update'] },
        ],
        isSystem: true,
      },
      {
        name: 'staff',
        description: 'Limited access for support staff',
        permissions: [
          { resource: 'knowledge', actions: ['read'] },
          { resource: 'faqs', actions: ['read'] },
          { resource: 'inquiries', actions: ['read', 'update'] },
        ],
        isSystem: true,
      },
    ];

    for (const roleData of systemRoles) {
      const existingRole = await RoleModel.findOne({ name: roleData.name });
      if (!existingRole) {
        await RoleModel.create(roleData);
      }
    }
  }

  private static formatRole(role: RoleDocument): RoleResponse {
    return {
      id: role._id.toString(),
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isSystem: role.isSystem,
    };
  }
}
