import { ClientResponse } from './client.js';

export interface User {
  _id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'client';
  clientId?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'client';
  clientId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  company?: string;
  phone?: string;
}

export interface AuthResponse {
  user: UserResponse;
  client?: ClientResponse;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}
