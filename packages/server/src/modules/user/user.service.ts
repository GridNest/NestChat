import { UserModel } from '../user/user.model.js';
import { UserRoleModel } from '../userRole/userRole.model.js';
import { ApiError } from '../../utils/apiError.js';

export class UserService {
  static async list(query: { page?: number; limit?: number; search?: string; role?: string }) {
    const { page = 1, limit = 10, search, role } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;

    const [users, total] = await Promise.all([
      UserModel.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      UserModel.countDocuments(filter),
    ]);

    return { users, total, page, limit };
  }

  static async getById(id: string) {
    const user = await UserModel.findById(id).select('-password');
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  static async create(data: { name: string; email: string; password: string; role: string; clientId?: string }) {
    const existingUser = await UserModel.findOne({ email: data.email });
    if (existingUser) {
      throw ApiError.conflict('Email already exists');
    }

    const user = await UserModel.create({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      clientId: data.clientId,
    });

    return { id: user._id, name: user.name, email: user.email, role: user.role };
  }

  static async update(id: string, data: { name?: string; email?: string; role?: string; isActive?: boolean }) {
    const user = await UserModel.findByIdAndUpdate(id, data, { new: true }).select('-password');
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  static async delete(id: string) {
    const user = await UserModel.findByIdAndDelete(id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
  }

  static async getStats() {
    const [total, admins, clients, staff] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ role: 'admin' }),
      UserModel.countDocuments({ role: 'client' }),
      UserModel.countDocuments({ role: 'staff' }),
    ]);

    return { total, admins, clients, staff };
  }
}
