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
    return { data: response.data };
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
    const response = await this.client.get('/admin/knowledge', { params });
    return response.data;
  }

  async getKnowledgeByClient(clientId: string, params?: Record<string, string>) {
    const response = await this.client.get(`/knowledge/${clientId}`, { params });
    return response.data;
  }

  async getKnowledgeCategories(clientId: string) {
    const response = await this.client.get(`/knowledge/${clientId}/categories`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('nestchat_admin_token')}` },
    });
    return response.data;
  }

  async getKnowledgeById(id: string) {
    const response = await this.client.get(`/knowledge/detail/${id}`);
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

  async bulkDeleteKnowledge(ids: string[]) {
    const response = await this.client.post('/knowledge/bulk-delete', { ids });
    return response.data;
  }

  async bulkUpdateKnowledgeStatus(ids: string[], status: 'published' | 'draft') {
    const response = await this.client.post('/knowledge/bulk-status', { ids, status });
    return response.data;
  }

  async downloadKnowledgeTemplate() {
    const response = await this.client.get('/knowledge/template/download', { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'knowledge-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
    return response.data;
  }

  async exportKnowledge(params?: Record<string, string>) {
    const response = await this.client.get('/knowledge/export/all', {
      params,
      responseType: 'blob',
    });
    return response;
  }

  async previewKnowledgeImport(csv: string) {
    const response = await this.client.post('/knowledge/import/preview', { csv });
    return response.data;
  }

  async importKnowledge(csv: string) {
    const response = await this.client.post('/knowledge/import', { csv });
    return response.data;
  }

  // FAQs
  async getFAQs(params?: Record<string, string>) {
    const response = await this.client.get('/admin/faqs', { params });
    return response.data;
  }

  async getFAQById(id: string) {
    const response = await this.client.get(`/faqs/detail/${id}`);
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

  async bulkDeleteFAQs(ids: string[]) {
    const response = await this.client.post('/faqs/bulk-delete', { ids });
    return response.data;
  }

  async bulkUpdateFAQStatus(ids: string[], status: 'published' | 'draft') {
    const response = await this.client.post('/faqs/bulk-status', { ids, status });
    return response.data;
  }

  async downloadFAQTemplate() {
    const response = await this.client.get('/faqs/template/download', { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'faq-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
    return response.data;
  }

  async exportFAQs(params?: Record<string, string>) {
    const response = await this.client.get('/admin/faqs/export', {
      params,
      responseType: 'blob',
    });
    return response;
  }

  async previewFAQImport(csv: string) {
    const response = await this.client.post('/faqs/import/preview', { csv });
    return response.data;
  }

  async importFAQs(csv: string) {
    const response = await this.client.post('/faqs/import', { csv });
    return response.data;
  }

  // Chats
  async getChats(params?: Record<string, string>) {
    const response = await this.client.get('/admin/chats', { params });
    return response.data;
  }

  async getChatById(id: string) {
    const response = await this.client.get(`/chat/detail/${id}`);
    return response.data;
  }

  // Inquiries
  async getInquiries(params?: Record<string, string>) {
    const response = await this.client.get('/admin/inquiries', { params });
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
    const response = await this.client.get('/admin/unanswered', { params });
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
    return { data: response.data };
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
    return { data: response.data };
  }

  // Notifications
  async getNotifications(params?: Record<string, string>) {
    const response = await this.client.get('/notifications', { params });
    return { data: response.data };
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

  // Client Config
  async resetClientConfig(clientId: string) {
    const response = await this.client.post(`/client-configs/${clientId}/reset`);
    return response.data;
  }

  async getClientConfigPreview(clientId: string) {
    const response = await this.client.get(`/client-configs/${clientId}/preview`);
    return response.data;
  }

  // Widget Generator
  async getWidgetScript(clientId: string) {
    const response = await this.client.get(`/widget-generator/${clientId}/script`);
    return response.data;
  }

  async regenerateWidgetSecretKey(clientId: string) {
    const response = await this.client.post(`/widget-generator/${clientId}/secret-key`);
    return response.data;
  }

  async updateWidgetSettings(clientId: string, data: Record<string, any>) {
    const response = await this.client.put(`/widget-generator/${clientId}/settings`, data);
    return response.data;
  }

  async updateAllowedDomains(clientId: string, domains: string[]) {
    const response = await this.client.put(`/widget-generator/${clientId}/domains`, { domains });
    return response.data;
  }

  async addAllowedDomain(clientId: string, domain: string) {
    const response = await this.client.post(`/widget-generator/${clientId}/domains`, { domain });
    return response.data;
  }

  async removeAllowedDomain(clientId: string, domain: string) {
    const response = await this.client.delete(`/widget-generator/${clientId}/domains/${domain}`);
    return response.data;
  }

  async getInstallationGuides(clientId: string) {
    const response = await this.client.get(`/widget-generator/${clientId}/guides`);
    return response.data;
  }

  async getWidgetInfo(clientId: string) {
    const response = await this.client.get(`/widget-generator/${clientId}/info`);
    return response.data;
  }

  async getWidgetConfig(clientId: string) {
    const response = await this.client.get(`/widget-config/${clientId}`);
    return response.data;
  }

  // Analytics
  async getAnalyticsDashboard(days: number = 30) {
    const clientId = await this.getCurrentClientId();
    const response = await this.client.get(`/analytics/${clientId}/dashboard`, { params: { days } });
    return response.data;
  }

  async getChatAnalytics(params: Record<string, any>) {
    const clientId = await this.getCurrentClientId();
    const response = await this.client.get(`/analytics/${clientId}/chats`, { params });
    return response.data;
  }

  async getGlobalStats(days: number = 30) {
    const response = await this.client.get('/analytics/global/stats', { params: { days } });
    return response.data;
  }

  // Reports
  async exportReport(type: string, startDate: string, endDate: string) {
    const clientId = await this.getCurrentClientId();
    const response = await this.client.get(`/reports/${clientId}/export`, {
      params: { type, startDate, endDate },
      responseType: 'blob',
    });
    return response;
  }

  async getReportPreview(type: string, startDate: string, endDate: string) {
    const clientId = await this.getCurrentClientId();
    const response = await this.client.get(`/reports/${clientId}/preview`, {
      params: { type, startDate, endDate },
    });
    return response.data;
  }

  // System Logs
  async getSystemLogs(params: Record<string, any>) {
    const response = await this.client.get('/system-logs', { params });
    return { data: response.data.data };
  }

  async getLogStats(startDate: string, endDate: string) {
    const response = await this.client.get('/system-logs/stats', { params: { startDate, endDate } });
    return response.data;
  }

  async cleanupLogs(daysToKeep: number) {
    const response = await this.client.post('/system-logs/cleanup', { daysToKeep });
    return response.data;
  }

  async getTranslations(clientId: string, language?: string) {
    const params = language ? { language } : undefined;
    const response = await this.client.get(`/translations/${clientId}`, { params });
    return response.data;
  }

  async getTranslationsMap(clientId: string) {
    const response = await this.client.get(`/translations/${clientId}/map`);
    return response.data;
  }

  async upsertTranslation(clientId: string, language: string, key: string, value: string) {
    const response = await this.client.post(`/translations/${clientId}`, { language, key, value });
    return response.data;
  }

  async bulkUpsertTranslations(clientId: string, translations: Array<{ language: string; key: string; value: string }>) {
    const response = await this.client.post(`/translations/${clientId}/bulk`, { translations });
    return response.data;
  }

  async deleteTranslation(clientId: string, language: string, key: string) {
    const response = await this.client.delete(`/translations/${clientId}`, { params: { language, key } });
    return response.data;
  }

  async deleteTranslationLanguage(clientId: string, language: string) {
    const response = await this.client.delete(`/translations/${clientId}/language/${language}`);
    return response.data;
  }

  async getCurrentClientId(): Promise<string> {
    const response = await this.client.get('/auth/me');
    return response.data.data?.clientId || response.data.clientId || '';
  }

  async getAgentStatus() {
    const response = await this.client.get('/agents/status');
    return response.data;
  }

  async setAgentStatus(status: 'online' | 'offline' | 'away') {
    const response = await this.client.put('/agents/status', { status });
    return response.data;
  }

  async getAssignedChats() {
    const response = await this.client.get('/agents/chats');
    return response.data;
  }

  async assignChatToSelf(chatId: string) {
    const response = await this.client.post('/agents/chats/assign', { chatId });
    return response.data;
  }

  async sendAgentMessage(chatId: string, content: string) {
    const response = await this.client.post('/agents/chats/send', { chatId, content });
    return response.data;
  }

  async getAgentList(clientId: string) {
    const response = await this.client.get(`/agents/client/${clientId}`);
    return response.data;
  }

  async getAvailableAgents(clientId: string) {
    const response = await this.client.get(`/agents/client/${clientId}/available`);
    return response.data;
  }

  async assignChatToAgent(chatId: string, userId: string) {
    const response = await this.client.post('/agents/assign', { chatId, userId });
    return response.data;
  }

  async getAgentStats(clientId: string) {
    const response = await this.client.get(`/agents/client/${clientId}/stats`);
    return response.data;
  }

  // Website Sync
  async syncWebsite(clientId: string) {
    const response = await this.client.post(`/website-content/${clientId}/sync`);
    return response.data;
  }

  async getWebsiteContent(clientId: string, params?: Record<string, string>) {
    const response = await this.client.get(`/website-content/${clientId}`, { params });
    return response.data;
  }

  async getWebsiteCategories(clientId: string) {
    const response = await this.client.get(`/website-content/${clientId}/categories`);
    return response.data;
  }
}

export const adminApi = new AdminApi();
