import axios, { AxiosInstance } from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class AdminApi {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('nestchat_admin_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('nestchat_admin_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data.data;
  }

  async getMe() {
    const response = await this.client.get('/auth/me');
    return response.data.data;
  }

  async getClients(params?: Record<string, string>) {
    const response = await this.client.get('/clients', { params });
    return response.data;
  }

  async getClient(id: string) {
    const response = await this.client.get(`/clients/${id}`);
    return response.data.data;
  }

  async createClient(data: Record<string, string>) {
    const response = await this.client.post('/clients', data);
    return response.data.data;
  }

  async updateClient(id: string, data: Record<string, string>) {
    const response = await this.client.put(`/clients/${id}`, data);
    return response.data.data;
  }

  async deleteClient(id: string) {
    const response = await this.client.delete(`/clients/${id}`);
    return response.data;
  }

  async getClientConfig(clientId: string) {
    const response = await this.client.get(`/client-configs/${clientId}`);
    return response.data.data;
  }

  async updateClientConfig(clientId: string, data: Record<string, any>) {
    const response = await this.client.put('/client-configs', { ...data, clientId });
    return response.data.data;
  }

  async getAnalytics(params?: Record<string, string>) {
    const response = await this.client.get('/analytics/overview', { params });
    return response.data.data;
  }
}

export const adminApi = new AdminApi();
