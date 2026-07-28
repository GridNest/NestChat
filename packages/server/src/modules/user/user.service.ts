import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
      UserModel.find(filter)
        .populate('clientId', 'name companyName clientId')
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(filter),
    ]);

    const mappedUsers = users.map((u: any) => ({
      ...u,
      id: u._id.toString(),
      _id: u._id.toString(),
    }));

    return { users: mappedUsers, total, page, limit };
  }

  static async getById(id: string) {
    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid User ID');
    }
    const user = await UserModel.findById(id).populate('clientId', 'name companyName clientId').select('-password').lean();
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return { ...(user as any), id: (user as any)._id.toString() };
  }

  static async create(data: { name: string; email: string; password: string; role: string; clientId?: string }) {
    const existingUser = await UserModel.findOne({ email: data.email.trim().toLowerCase() });
    if (existingUser) {
      throw ApiError.conflict('Email already exists');
    }

    const user = await UserModel.create({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      role: data.role,
      clientId: data.clientId && data.clientId !== 'none' ? data.clientId : undefined,
    });

    return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
  }

  static async update(id: string, data: { name?: string; email?: string; password?: string; role?: string; clientId?: string; isActive?: boolean }) {
    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid User ID');
    }

    const updateData: any = { ...data };
    if (updateData.email) updateData.email = updateData.email.trim().toLowerCase();
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.password && updateData.password.trim()) {
      const salt = await bcrypt.genSalt(12);
      updateData.password = await bcrypt.hash(updateData.password.trim(), salt);
    } else {
      delete updateData.password;
    }
    if (updateData.clientId === 'none') updateData.clientId = null;

    const user = await UserModel.findByIdAndUpdate(id, updateData, { new: true }).populate('clientId', 'name companyName clientId').select('-password').lean();
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return { ...(user as any), id: (user as any)._id.toString() };
  }

  static async delete(id: string) {
    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid User ID');
    }
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
