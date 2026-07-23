import { ChatModel, ChatDocument } from './chat.model';
import { ChatMessageModel, ChatMessageDocument } from './chatMessage.model';
import { ResponseEngine, BotResponse } from './responseEngine';
import { LanguageEngine, Language } from './languageEngine';
import { InquiryEngine } from '../inquiry/inquiryEngine';
import { InquiryService } from '../inquiry/inquiry.service';
import { UnansweredService } from '../unanswered/unanswered.service';
import { ApiError } from '../../utils/apiError';
import mongoose from 'mongoose';

export interface ChatSession {
  chatId: string;
  sessionId: string;
  visitorId: string;
  language: Language;
  status: 'active' | 'ended';
  startedAt: Date;
}

export interface ChatMessageItem {
  id: string;
  chatId: string;
  sender: 'user' | 'bot';
  content: string;
  messageType: 'text' | 'quickAction' | 'inquiry' | 'system';
  timestamp: Date;
  metadata?: {
    matchedType?: string;
    matchedId?: string;
    confidence?: number;
  };
}

export interface StartChatRequest {
  clientId: string;
  sessionId: string;
  visitorId: string;
  language?: Language;
  visitorInfo?: {
    userAgent?: string;
    referrer?: string;
    url?: string;
    ip?: string;
  };
}

export interface SendMessageRequest {
  chatId: string;
  sessionId: string;
  clientId: string;
  content: string;
  language?: Language;
}

export class ChatService {
  static async startSession(data: StartChatRequest): Promise<{
    session: ChatSession;
    welcomeMessage: ChatMessageItem;
  }> {
    const existingChat = await ChatModel.findOne({
      sessionId: data.sessionId,
      status: 'active',
    });

    if (existingChat) {
      const messages = await ChatMessageModel.find({ chatId: existingChat._id })
        .sort({ timestamp: 1 })
        .limit(1)
        .lean();

      return {
        session: this.formatSession(existingChat),
        welcomeMessage: messages.length > 0 ? this.formatMessage(messages[0] as unknown as ChatMessageDocument) : this.createSystemMessage(existingChat._id.toString()),
      };
    }

    const chat = await ChatModel.create({
      clientId: data.clientId,
      sessionId: data.sessionId,
      visitorId: data.visitorId,
      language: data.language || 'en',
      visitorInfo: data.visitorInfo,
      status: 'active',
    });

    const clientName = await this.getClientName(data.clientId);
    const welcomeContent = ResponseEngine.getWelcomeResponse(
      data.language || 'en',
      clientName
    );

    const welcomeMessage = await ChatMessageModel.create({
      chatId: chat._id,
      sender: 'bot',
      content: welcomeContent,
      messageType: 'system',
      metadata: {
        matchedType: 'quickAction',
        confidence: 1,
      },
    });

    await ChatModel.findByIdAndUpdate(chat._id, { $inc: { messageCount: 2 } });

    return {
      session: this.formatSession(chat),
      welcomeMessage: this.formatMessage(welcomeMessage),
    };
  }

  static async sendMessage(data: SendMessageRequest): Promise<{
    userMessage: ChatMessageItem;
    botMessage: ChatMessageItem;
  }> {
    const chat = await ChatModel.findOne({
      _id: data.chatId,
      sessionId: data.sessionId,
      status: 'active',
    });

    if (!chat) {
      throw ApiError.notFound('Chat session not found or ended');
    }

    const userMessage = await ChatMessageModel.create({
      chatId: chat._id,
      sender: 'user',
      content: data.content,
      messageType: 'text',
    });

    const startTime = Date.now();

    const activeInquiry = await InquiryEngine.getState(chat._id.toString());
    const isInquiryMode = !!activeInquiry;

    let botResponse: BotResponse;

    if (isInquiryMode) {
      const inquiryResult = await InquiryEngine.processInput(chat._id.toString(), data.content);

      if (inquiryResult.isCancelled) {
        botResponse = {
          content: inquiryResult.message,
          messageType: 'text',
          metadata: {
            matchedType: 'unknown',
            confidence: 1,
          },
        };
      } else if (inquiryResult.isComplete && inquiryResult.data) {
        await InquiryService.create({
          clientId: data.clientId,
          chatId: chat._id.toString(),
          sessionId: data.sessionId,
          visitorId: chat.visitorId,
          name: inquiryResult.data.name || '',
          email: inquiryResult.data.email || '',
          phone: inquiryResult.data.phone || '',
          country: inquiryResult.data.country,
          state: inquiryResult.data.state,
          service: inquiryResult.data.service || '',
          details: inquiryResult.data.details || '',
          company: inquiryResult.data.company,
          language: chat.language,
        });

        botResponse = {
          content: inquiryResult.message,
          messageType: 'text',
          metadata: {
            matchedType: 'inquiry_trigger',
            confidence: 1,
          },
        };
      } else {
        botResponse = {
          content: inquiryResult.message,
          messageType: 'inquiry',
          metadata: {
            matchedType: 'inquiry_trigger',
            confidence: 1,
          },
        };
      }
    } else {
      botResponse = await ResponseEngine.generateResponse({
        clientId: data.clientId,
        language: data.language || chat.language,
        query: data.content,
        clientName: await this.getClientName(data.clientId),
        conversationHistory: await this.getRecentHistory(chat._id.toString(), 5),
      });

      if (botResponse.triggerInquiry && !isInquiryMode) {
        await InquiryEngine.createState({
          chatId: chat._id.toString(),
          sessionId: data.sessionId,
          clientId: data.clientId,
          visitorId: chat.visitorId,
          language: data.language || chat.language,
        });

        const firstQuestion = await InquiryEngine.getFirstQuestion(chat._id.toString());
        if (firstQuestion) {
          botResponse = {
            content: `${botResponse.content}\n\n${firstQuestion}`,
            messageType: 'inquiry',
            metadata: {
              matchedType: 'inquiry_trigger',
              confidence: 1,
            },
          };
        }
      }

      if (botResponse.metadata.matchedType === 'unknown') {
        await UnansweredService.track({
          clientId: data.clientId,
          question: data.content,
          sessionId: data.sessionId,
          visitorId: chat.visitorId,
        });
      }
    }

    const responseTimeMs = Date.now() - startTime;

    const botMessage = await ChatMessageModel.create({
      chatId: chat._id,
      sender: 'bot',
      content: botResponse.content,
      messageType: botResponse.messageType,
      metadata: {
        matchedType: botResponse.metadata.matchedType,
        matchedId: botResponse.metadata.matchedId,
        confidence: botResponse.metadata.confidence,
        responseTimeMs,
      },
    });

    await ChatModel.findByIdAndUpdate(chat._id, { $inc: { messageCount: 2 } });

    return {
      userMessage: this.formatMessage(userMessage),
      botMessage: this.formatMessage(botMessage),
    };
  }

  static async getHistory(sessionId: string): Promise<ChatMessageItem[]> {
    const chat = await ChatModel.findOne({ sessionId });
    if (!chat) {
      throw ApiError.notFound('Chat session not found');
    }

    const messages = await ChatMessageModel.find({ chatId: chat._id })
      .sort({ timestamp: 1 })
      .lean();

    return messages.map(msg => this.formatMessage(msg as unknown as ChatMessageDocument));
  }

  static async getRecentHistory(chatId: string, limit: number): Promise<Array<{ sender: string; content: string }>> {
    const messages = await ChatMessageModel.find({ chatId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return messages.reverse().map(msg => ({
      sender: msg.sender,
      content: msg.content,
    }));
  }

  static async endSession(sessionId: string): Promise<void> {
    const chat = await ChatModel.findOne({ sessionId, status: 'active' });
    if (!chat) {
      throw ApiError.notFound('Chat session not found or already ended');
    }

    chat.status = 'ended';
    chat.endedAt = new Date();
    await chat.save();
  }

  static async getSession(sessionId: string): Promise<ChatSession | null> {
    const chat = await ChatModel.findOne({ sessionId });
    return chat ? this.formatSession(chat) : null;
  }

  private static async getClientName(clientId: string): Promise<string> {
    try {
      const ClientModel = mongoose.model('Client');
      const client = await ClientModel.findById(clientId).lean();
      return (client as any)?.name || 'NestChat';
    } catch {
      return 'NestChat';
    }
  }

  private static createSystemMessage(chatId: string): ChatMessageItem {
    return {
      id: 'system',
      chatId,
      sender: 'bot',
      content: 'Welcome!',
      messageType: 'system',
      timestamp: new Date(),
    };
  }

  private static formatSession(chat: ChatDocument): ChatSession {
    return {
      chatId: chat._id.toString(),
      sessionId: chat.sessionId,
      visitorId: chat.visitorId,
      language: chat.language,
      status: chat.status,
      startedAt: chat.startedAt,
    };
  }

  private static formatMessage(message: ChatMessageDocument): ChatMessageItem {
    return {
      id: message._id.toString(),
      chatId: message.chatId.toString(),
      sender: message.sender,
      content: message.content,
      messageType: message.messageType,
      timestamp: message.timestamp,
      metadata: message.metadata,
    };
  }
}
