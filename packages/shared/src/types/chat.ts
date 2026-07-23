export interface Chat {
  _id: string;
  clientId: string;
  sessionId: string;
  visitorId: string;
  visitorInfo?: {
    userAgent?: string;
    referrer?: string;
    url?: string;
    ip?: string;
  };
  language: 'en' | 'hi';
  status: 'active' | 'ended';
  startedAt: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatResponse {
  id: string;
  sessionId: string;
  visitorId: string;
  language: 'en' | 'hi';
  status: 'active' | 'ended';
  startedAt: Date;
  endedAt?: Date;
  messageCount: number;
}

export interface ChatMessage {
  _id: string;
  chatId: string;
  sender: 'user' | 'bot';
  content: string;
  messageType: 'text' | 'quickAction' | 'inquiry';
  metadata?: {
    matchedType?: 'faq' | 'knowledge' | 'quickAction' | 'unknown';
    matchedId?: string;
    confidence?: number;
  };
  timestamp: Date;
  createdAt: Date;
}

export interface ChatMessageResponse {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  messageType: 'text' | 'quickAction' | 'inquiry';
  timestamp: Date;
}

export interface StartChatRequest {
  clientId: string;
  sessionId: string;
  visitorId: string;
  language?: 'en' | 'hi';
  visitorInfo?: {
    userAgent?: string;
    referrer?: string;
    url?: string;
  };
}

export interface SendMessageRequest {
  chatId: string;
  sessionId: string;
  clientId: string;
  content: string;
  language?: 'en' | 'hi';
}

export interface StartChatResponse {
  chatId: string;
  sessionId: string;
  welcomeMessage: ChatMessageResponse;
}

export interface SendMessageResponse {
  userMessage: ChatMessageResponse;
  botMessage: ChatMessageResponse;
}
