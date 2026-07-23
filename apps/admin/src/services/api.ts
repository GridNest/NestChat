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

  // Dashboard
  async getDashboard() {
    const response = await this.client.get('/admin/dashboard');
    return response.data;
  }

  async getClientDashboard(clientId: string) {
    const response = await this.client.get(`/admin/dashboard/client/${clientId}`);
    return response.data;
  }

  // Clients
  async getClients(params?: Record<string, string>) {
    const response = await this.client.get('/clients', { params });
    return response.data;
  }

  async getClient(id: string) {
    const response = await this.client.get(`/clients/${id}`);
    return response.data.data;
  }

  async createClient(data: Record<string, any>) {
    const response = await this.client.post('/clients', data);
    return response.data.data;
  }

  async updateClient(id: string, data: Record<string, any>) {
    const response = await this.client.put(`/clients/${id}`, data);
    return response.data.data;
  }

  async deleteClient(id: string) {
    const response = await this.client.delete(`/clients/${id}`);
    return response.data;
  }

  // Client Config
  async getClientConfig(clientId: string) {
    const response = await this.client.get(`/client-configs/${clientId}`);
    return response.data.data;
  }

  async updateClientConfig(clientId: string, data: Record<string, any>) {
    const response = await this.client.put(`/client-configs/${clientId}`, data);
    return response.data.data;
  }

  // Knowledge
  async getKnowledge(params?: Record<string, string>) {
    const response = await this.client.get('/knowledge', { params });
    return response.data;
  }

  async getKnowledgeById(id: string) {
    const response = await this.client.get(`/knowledge/${id}`);
    return response.data.data;
  }

  async createKnowledge(data: Record<string, any>) {
    const response = await this.client.post('/knowledge', data);
    return response.data.data;
  }

  async updateKnowledge(id: string, data: Record<string, any>) {
    const response = await this.client.put(`/knowledge/${id}`, data);
    return response.data.data;
  }

  async deleteKnowledge(id: string) {
    const response = await this.client.delete(`/knowledge/${id}`);
    return response.data;
  }

  // FAQs
  async getFAQs(params?: Record<string, string>) {
    const response = await this.client.get('/faqs', { params });
    return response.data;
  }

  async getFAQById(id: string) {
    const response = await this.client.get(`/faqs/${id}`);
    return response.data.data;
  }

  async createFAQ(data: Record<string, any>) {
    const response = await this.client.post('/faqs', data);
    return response.data.data;
  }

  async updateFAQ(id: string, data: Record<string, any>) {
    const response = await this.client.put(`/faqs/${id}`, data);
    return response.data.data;
  }

  async deleteFAQ(id: string) {
    const response = await this.client.delete(`/faqs/${id}`);
    return response.data;
  }

  // Chats
  async getChats(params?: Record<string, string>) {
    const response = await this.client.get('/chat', { params });
    return response.data;
  }

  async getChatById(id: string) {
    const response = await this.client.get(`/chat/${id}`);
    return response.data.data;
  }

  // Inquiries
  async getInquiries(params?: Record<string, string>) {
    const response = await this.client.get('/inquiry', { params });
    return response.data;
  }

  async getInquiryById(id: string) {
    const response = await this.client.get(`/inquiry/${id}`);
    return response.data.data;
  }

  async updateInquiryStatus(id: string, status: string) {
    const response = await this.client.put(`/inquiry/${id}`, { status });
    return response.data.data;
  }

  // Unanswered
  async getUnanswered(params?: Record<string, string>) {
    const response = await this.client.get('/unanswered', { params });
    return response.data;
  }

  async deleteUnanswered(id: string) {
    const response = await this.client.delete(`/unanswered/${id}`);
    return response.data;
  }

  async convertUnanswered(id: string, type: 'faq' | 'knowledge') {
    const response = await this.client.post(`/unanswered/${id}/convert`, { type });
    return response.data;
  }

  // Users
  async getUsers(params?: Record<string, string>) {
    const response = await this.client.get('/users', { params });
    return response.data;
  }

  async getUserById(id: string) {
    const response = await this.client.get(`/users/${id}`);
    return response.data.data;
  }

  async createUser(data: Record<string, any>) {
    const response = await this.client.post('/users', data);
    return response.data.data;
  }

  async updateUser(id: string, data: Record<string, any>) {
    const response = await this.client.put(`/users/${id}`, data);
    return response.data.data;
  }

  async deleteUser(id: string) {
    const response = await this.client.delete(`/users/${id}`);
    return response.data;
  }

  // Roles
  async getRoles() {
    const response = await this.client.get('/roles');
    return response.data.data;
  }

  async createRole(data: Record<string, any>) {
    const response = await this.client.post('/roles', data);
    return response.data.data;
  }

  async updateRole(id: string, data: Record<string, any>) {
    const response = await this.client.put(`/roles/${id}`, data);
    return response.data.data;
  }

  async deleteRole(id: string) {
    const response = await this.client.delete(`/roles/${id}`);
    return response.data;
  }

  // Settings
  async getSettings() {
    const response = await this.client.get('/settings');
    return response.data.data;
  }

  async updateSettings(data: Record<string, any>) {
    const response = await this.client.put('/settings', data);
    return response.data.data;
  }

  // Audit Logs
  async getAuditLogs(params?: Record<string, string>) {
    const response = await this.client.get('/admin/audit-logs', { params });
    return response.data;
  }

  // Notifications
  async getNotifications(params?: Record<string, string>) {
    const response = await this.client.get('/notifications', { params });
    return response.data;
  }

  async markNotificationAsRead(id: string) {
    const response = await this.client.put(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead() {
    const response = await this.client.put('/notifications/read-all');
    return response.data;
  }

  async getUnreadNotificationCount() {
    const response = await this.client.get('/notifications/unread-count');
    return response.data.data;
  }

  // Search
  async globalSearch(query: string) {
    const response = await this.client.get('/admin/search', { params: { q: query } });
    return response.data;
  }
}

export const adminApi = new AdminApi();
