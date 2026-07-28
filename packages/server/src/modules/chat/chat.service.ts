import { ChatModel, ChatDocument } from './chat.model.js';
import { ChatMessageModel, ChatMessageDocument } from './chatMessage.model.js';
import { ResponseEngine, BotResponse } from './responseEngine.js';
import { LanguageEngine, Language } from './languageEngine.js';
import { InquiryEngine, INQUIRY_STEPS } from '../inquiry/inquiryEngine.js';
import { InquiryService } from '../inquiry/inquiry.service.js';
import { UnansweredService } from '../unanswered/unanswered.service.js';
import { NotificationService } from '../notification/notification.service.js';
import { ApiError } from '../../utils/apiError.js';
import { emitToUser, emitToClient } from '../socket/socket.service.js';
import mongoose from 'mongoose';

export interface ChatSession {
  chatId: string;
  sessionId: string;
  visitorId: string;
  language: string;
  status: 'active' | 'ended';
  startedAt: Date;
}

export interface ChatMessageItem {
  id: string;
  chatId: string;
  sender: 'user' | 'bot' | 'agent';
  content: string;
  messageType: 'text' | 'quickAction' | 'inquiry' | 'system' | 'agent';
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
    const ClientModel = mongoose.model('Client');
    let clientDoc: any = null;
    if (mongoose.Types.ObjectId.isValid(data.clientId)) {
      clientDoc = await ClientModel.findById(data.clientId).lean();
    }
    if (!clientDoc) {
      clientDoc = await ClientModel.findOne({ clientId: data.clientId.trim().toLowerCase() }).lean();
    }

    const resolvedClientId = clientDoc ? clientDoc._id : data.clientId;

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
      clientId: resolvedClientId,
      sessionId: data.sessionId,
      visitorId: data.visitorId,
      language: data.language || 'en',
      visitorInfo: data.visitorInfo,
      status: 'active',
    });

    const clientName = clientDoc ? (clientDoc.name || clientDoc.companyName || 'NestChat') : await this.getClientName(data.clientId);
    const welcomeContent = ResponseEngine.getWelcomeResponse(
      (data.language || 'en') as any,
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

    const targetClientId = chat.clientId.toString();

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
        const inquiry = await InquiryService.create({
          clientId: targetClientId,
          chatId: chat._id.toString(),
          sessionId: data.sessionId,
          visitorId: chat.visitorId,
          name: inquiryResult.data.name || '',
          email: inquiryResult.data.email || '',
          phone: inquiryResult.data.phone || '',
          service: 'chat_inquiry',
          details: inquiryResult.data.message || inquiryResult.data.details || '',
          language: chat.language,
        });

        try {
          const ClientModel = mongoose.model('Client');
          const clientDoc = await ClientModel.findById(targetClientId).lean();
          if (clientDoc) {
            await NotificationService.create({
              userId: (clientDoc as any).createdBy?.toString() || '',
              type: 'inquiry',
              title: 'New Inquiry Received',
              message: `New inquiry from ${inquiryResult.data.name || 'Unknown'}`,
              data: { inquiryId: inquiry.id, clientId: targetClientId },
            });
          }
        } catch (notifErr) {
          // Notification failure is non-critical
        }

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
        clientId: targetClientId,
        language: (data.language || chat.language) as any,
        query: data.content,
        clientName: await this.getClientName(data.clientId || targetClientId),
        conversationHistory: await this.getRecentHistory(chat._id.toString(), 5),
      });

      if (botResponse.triggerInquiry && !isInquiryMode) {
        await InquiryEngine.createState({
          chatId: chat._id.toString(),
          sessionId: data.sessionId,
          clientId: targetClientId,
          visitorId: chat.visitorId,
          language: (data.language || chat.language) as any,
          currentStep: '__consent__',
        });
      }

      if (botResponse.metadata.matchedType === 'unknown') {
        await UnansweredService.track({
          clientId: targetClientId,
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

    const userMsg = this.formatMessage(userMessage);
    const botMsg = this.formatMessage(botMessage);

    emitToClient(targetClientId, 'chat:message', {
      chatId: chat._id.toString(),
      userMessage: userMsg,
      botMessage: botMsg,
    });

    if (data.clientId && data.clientId !== targetClientId) {
      emitToClient(data.clientId, 'chat:message', {
        chatId: chat._id.toString(),
        userMessage: userMsg,
        botMessage: botMsg,
      });
    }

    return {
      userMessage: userMsg,
      botMessage: botMsg,
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

  static async sendAgentMessage(chatId: string, userId: string, content: string): Promise<ChatMessageItem> {
    const chat = await ChatModel.findById(chatId);
    if (!chat) throw ApiError.notFound('Chat not found');

    const message = await ChatMessageModel.create({
      chatId: chat._id,
      sender: 'agent',
      content,
      messageType: 'agent',
      metadata: { matchedType: undefined, matchedId: userId },
    });

    await ChatModel.findByIdAndUpdate(chat._id, { $inc: { messageCount: 1 } });
    const result = this.formatMessage(message);
    emitToClient(chat.clientId.toString(), 'chat:agentMessage', {
      chatId: chat._id.toString(),
      message: result,
    });
    return result;
  }

  static async getChatById(chatId: string): Promise<any> {
    const chat = await ChatModel.findById(chatId).populate('assignedTo').lean();
    if (!chat) throw ApiError.notFound('Chat not found');
    const messages = await ChatMessageModel.find({ chatId })
      .sort({ timestamp: 1 })
      .lean();
    return {
      ...chat,
      id: chat._id.toString(),
      assignedAgent: chat.assignedTo ? (chat.assignedTo as any)?.name || 'Assigned' : null,
      messages: messages.map(m => ({
        id: m._id.toString(),
        sender: m.sender,
        content: m.content,
        timestamp: m.timestamp,
      })),
    };
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
      let client: any = null;
      if (mongoose.Types.ObjectId.isValid(clientId)) {
        client = await ClientModel.findById(clientId).lean();
      }
      if (!client) {
        client = await ClientModel.findOne({ clientId: clientId.trim().toLowerCase() }).lean();
      }
      return (client as any)?.name || (client as any)?.companyName || 'NestChat';
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
      language: chat.language as string,
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

  static async deleteChat(id: string): Promise<void> {
    const chat = await ChatModel.findById(id);
    if (!chat) {
      throw ApiError.notFound('Chat session not found');
    }
    await Promise.all([
      ChatModel.findByIdAndDelete(id),
      ChatMessageModel.deleteMany({ chatId: id }),
    ]);
  }

  static async bulkDeleteChats(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) return;
    await Promise.all([
      ChatModel.deleteMany({ _id: { $in: validIds } }),
      ChatMessageModel.deleteMany({ chatId: { $in: validIds } }),
    ]);
  }
}
