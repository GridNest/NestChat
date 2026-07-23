import jwt from 'jsonwebtoken';
import { AuthResponse, LoginRequest, RegisterRequest } from '@nestchat/shared';
import { UserModel, UserDocument } from '../user/user.model.js';
import { ClientModel } from '../client/client.model.js';
import { ClientConfigModel } from '../clientConfig/clientConfig.model.js';
import { ApiError } from '../../utils/apiError.js';
import { env } from '../../config/env.js';

export class AuthService {
  private static generateTokens(user: UserDocument, clientId?: string) {
    const payload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      clientId,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
    });

    return { accessToken, refreshToken };
  }

  static async register(data: RegisterRequest): Promise<AuthResponse> {
    const existingUser = await UserModel.findOne({ email: data.email });
    if (existingUser) {
      throw ApiError.conflict('Email already registered');
    }

    const user = await UserModel.create({
      email: data.email,
      password: data.password,
      name: data.name,
      role: 'client',
    });

    const client = await ClientModel.create({
      clientId: (data.company || data.name).toLowerCase().replace(/\s+/g, '-'),
      name: data.company || data.name,
      email: data.email,
      companyName: data.company || data.name,
      phone: data.phone,
      createdBy: user._id,
    });

    await ClientConfigModel.create({
      clientId: client._id,
    });

    user.clientId = client._id;
    await user.save();

    const tokens = this.generateTokens(user, client._id.toString());

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        clientId: client._id.toString(),
      },
      client: {
        id: client._id.toString(),
        name: client.name,
        email: client.email,
        companyName: client.companyName,
        phone: client.phone,
        website: client.website,
        isActive: client.isActive,
        createdAt: client.createdAt,
      },
      tokens,
    };
  }

  static async login(data: LoginRequest): Promise<AuthResponse> {
    const user = await UserModel.findOne({ email: data.email });
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    user.lastLogin = new Date();
    await user.save();

    const clientIdStr = user.clientId?.toString();
    const tokens = this.generateTokens(user, clientIdStr);

    const response: AuthResponse = {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        clientId: clientIdStr,
      },
      tokens,
    };

    if (user.clientId) {
      const client = await ClientModel.findById(user.clientId);
      if (client) {
        response.client = {
          id: client._id.toString(),
          name: client.name,
          email: client.email,
          companyName: client.companyName,
          phone: client.phone,
          website: client.website,
          isActive: client.isActive,
          createdAt: client.createdAt,
        };
      }
    }

    return response;
  }

  static async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
        id: string;
        email: string;
        role: string;
        clientId?: string;
      };

      const user = await UserModel.findById(decoded.id);
      if (!user) {
        throw ApiError.unauthorized('Invalid refresh token');
      }

      const accessToken = jwt.sign(
        {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          clientId: user.clientId?.toString(),
        },
        env.JWT_SECRET,
        { expiresIn: 7 * 24 * 60 * 60 } // 7 days in seconds
      );

      return { accessToken };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw ApiError.unauthorized('Invalid refresh token');
      }
      throw error;
    }
  }

  static async getMe(userId: string): Promise<AuthResponse> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const response: AuthResponse = {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        clientId: user.clientId?.toString(),
      },
      tokens: {
        accessToken: '',
        refreshToken: '',
      },
    };

    if (user.clientId) {
      const client = await ClientModel.findById(user.clientId);
      if (client) {
        response.client = {
          id: client._id.toString(),
          name: client.name,
          email: client.email,
          companyName: client.companyName,
          phone: client.phone,
          website: client.website,
          isActive: client.isActive,
          createdAt: client.createdAt,
        };
      }
    }

    return response;
  }
}
