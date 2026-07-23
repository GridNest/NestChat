import { UserRoleModel, UserRoleDocument } from './userRole.model';
import { ApiError } from '../../utils/apiError';

export interface UserRoleResponse {
  id: string;
  userId: string;
  clientId: string;
  roleId: string;
  assignedBy: string;
  createdAt: Date;
}

export class UserRoleService {
  static async assign(data: { userId: string; clientId: string; roleId: string; assignedBy: string }): Promise<UserRoleResponse> {
    const existingUserRole = await UserRoleModel.findOne({ 
      userId: data.userId, 
      clientId: data.clientId 
    });

    if (existingUserRole) {
      throw new ApiError(400, 'User already has a role for this client');
    }

    const userRole = await UserRoleModel.create({
      userId: data.userId,
      clientId: data.clientId,
      roleId: data.roleId,
      assignedBy: data.assignedBy,
    });

    return this.formatUserRole(userRole);
  }

  static async getByUserAndClient(userId: string, clientId: string): Promise<UserRoleResponse | null> {
    const userRole = await UserRoleModel.findOne({ userId, clientId });
    if (!userRole) {
      return null;
    }
    return this.formatUserRole(userRole);
  }

  static async getByClient(clientId: string): Promise<UserRoleResponse[]> {
    const userRoles = await UserRoleModel.find({ clientId });
    return userRoles.map(this.formatUserRole);
  }

  static async getByUser(userId: string): Promise<UserRoleResponse[]> {
    const userRoles = await UserRoleModel.find({ userId });
    return userRoles.map(this.formatUserRole);
  }

  static async update(id: string, data: { roleId: string }): Promise<UserRoleResponse> {
    const userRole = await UserRoleModel.findByIdAndUpdate(id, data, { new: true });
    if (!userRole) {
      throw new ApiError(404, 'User role not found');
    }
    return this.formatUserRole(userRole);
  }

  static async remove(id: string): Promise<void> {
    const userRole = await UserRoleModel.findByIdAndDelete(id);
    if (!userRole) {
      throw new ApiError(404, 'User role not found');
    }
  }

  static async removeByUserAndClient(userId: string, clientId: string): Promise<void> {
    await UserRoleModel.findOneAndDelete({ userId, clientId });
  }

  static async hasPermission(userId: string, clientId: string, resource: string, action: string): Promise<boolean> {
    const userRole = await UserRoleModel.findOne({ userId, clientId }).populate('roleId');
    if (!userRole) {
      return false;
    }

    const role = userRole.roleId as any;
    if (!role) {
      return false;
    }

    const permission = role.permissions.find((p: any) => p.resource === resource);
    if (!permission) {
      return false;
    }

    return permission.actions.includes(action);
  }

  private static formatUserRole(userRole: UserRoleDocument): UserRoleResponse {
    return {
      id: userRole._id.toString(),
      userId: userRole.userId.toString(),
      clientId: userRole.clientId.toString(),
      roleId: userRole.roleId.toString(),
      assignedBy: userRole.assignedBy.toString(),
      createdAt: userRole.createdAt,
    };
  }
}
