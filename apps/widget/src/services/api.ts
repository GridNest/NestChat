import { WidgetConfig, Message, StartChatResponse, ChatResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class WidgetApi {
  private clientId: string;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'API request failed');
    }

    return data.data;
  }

  async getConfig(): Promise<WidgetConfig> {
    return this.fetch<WidgetConfig>(`/widget/${this.clientId}/config`);
  }

  async startChat(sessionId: string, visitorId: string, language: string): Promise<StartChatResponse> {
    return this.fetch<StartChatResponse>('/chat/start', {
      method: 'POST',
      body: JSON.stringify({
        clientId: this.clientId,
        sessionId,
        visitorId,
        language,
      }),
    });
  }

  async sendMessage(chatId: string, sessionId: string, content: string, language: string): Promise<ChatResponse> {
    return this.fetch<ChatResponse>('/chat/message', {
      method: 'POST',
      body: JSON.stringify({
        chatId,
        sessionId,
        clientId: this.clientId,
        content,
        language,
      }),
    });
  }

  async submitInquiry(data: Record<string, string>): Promise<{ inquiryId: string; message: string }> {
    return this.fetch<{ inquiryId: string; message: string }>('/inquiry', {
      method: 'POST',
      body: JSON.stringify({
        clientId: this.clientId,
        ...data,
      }),
    });
  }
}

export function createApiClient(clientId: string): WidgetApi {
  return new WidgetApi(clientId);
}
