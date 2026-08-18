import mongoose from 'mongoose';
import { AgentModel, AgentDocument } from './agent.model.js';
import { ChatModel } from '../chat/chat.model.js';
import { ApiError } from '../../utils/apiError.js';
import { emitToUser, emitToClient } from '../socket/socket.service.js';

export interface AgentListItem {
  id: string;
  userId: string;
  clientId: string;
  status: 'online' | 'offline' | 'away';
  maxChats: number;
  assignedCount: number;
  lastActiveAt: Date;
  user?: {
    name: string;
    email: string;
  };
}

export interface AgentStats {
  total: number;
  online: number;
  away: number;
  offline: number;
}

export class AgentService {
  static async getOrCreate(userId: string, clientId?: string): Promise<AgentListItem> {
    let agent = await AgentModel.findOne({ userId });
    if (!agent) {
      const validClientId = (clientId && mongoose.Types.ObjectId.isValid(clientId))
        ? clientId
        : undefined;

      agent = await AgentModel.create({
        userId,
        ...(validClientId ? { clientId: validClientId } : {}),
        status: 'online',
      });
    }
    return this.format(agent);
  }

  static async setStatus(userId: string, status: 'online' | 'offline' | 'away'): Promise<AgentListItem> {
    let agent = await AgentModel.findOneAndUpdate(
      { userId },
      { $set: { status, lastActiveAt: new Date() } },
      { new: true }
    );
    if (!agent) {
      agent = await AgentModel.create({ userId, status });
    }
    if (agent.clientId) {
      try {
        emitToClient(agent.clientId.toString(), 'agent:status', { userId, status });
      } catch (_) {}
    }
    return this.format(agent);
  }

  static async getByClient(clientId: string): Promise<AgentListItem[]> {
    const agents = await AgentModel.find({ clientId })
      .populate('userId', 'name email')
      .sort({ status: 1, lastActiveAt: -1 })
      .lean();
    return agents.map(a => this.formatLean(a as any));
  }

  static async getAvailable(clientId: string): Promise<AgentListItem[]> {
    const agents = await AgentModel.find({
      clientId,
      status: 'online',
    })
      .populate('userId', 'name email')
      .lean();

    return agents
      .filter(a => !a.assignedChats || a.assignedChats.length < a.maxChats)
      .map(a => this.formatLean(a as any));
  }

  static async assignChat(chatId: string, userId: string): Promise<void> {
    const chat = await ChatModel.findById(chatId);
    if (!chat) throw ApiError.notFound('Chat not found');

    let agent = await AgentModel.findOne({ userId });
    if (!agent) {
      agent = await AgentModel.create({
        userId,
        clientId: chat.clientId,
        status: 'online',
      });
    }

    await ChatModel.findByIdAndUpdate(chatId, { $set: { assignedTo: agent._id } });
    if (!agent.assignedChats?.some(id => id.toString() === chatId)) {
      await AgentModel.findByIdAndUpdate(agent._id, { $addToSet: { assignedChats: chatId } });
    }

    try {
      const User = mongoose.model('User');
      const userDoc: any = await User.findById(userId).lean();
      const agentName = userDoc?.name || 'Support Agent';

      const { ChatMessageModel } = await import('../chat/chatMessage.model.js');
      await ChatMessageModel.create({
        chatId: chat._id,
        sender: 'bot',
        content: `${agentName} has joined the chat.`,
        messageType: 'system',
        metadata: { matchedType: 'agent_joined', confidence: 1 },
      });

      emitToUser(userId, 'chat:assigned', { chatId });
      if (agent.clientId) {
        emitToClient(agent.clientId.toString(), 'agent:assigned', { chatId, userId, agentName });
      }
    } catch (_) {}
  }

  static async unassignChat(chatId: string, userId: string): Promise<void> {
    const agent = await AgentModel.findOne({ userId });
    if (!agent) throw ApiError.notFound('Agent not found');

    await ChatModel.findByIdAndUpdate(chatId, { $unset: { assignedTo: '' } });
    await AgentModel.findByIdAndUpdate(agent._id, { $pull: { assignedChats: chatId } });

    emitToUser(userId, 'chat:unassigned', { chatId });
    emitToClient(agent.clientId.toString(), 'agent:unassigned', { chatId, userId });
  }

  static async getAssignedChats(userId: string) {
    const agent = await AgentModel.findOne({ userId });
    if (!agent) return [];
    return ChatModel.find({ _id: { $in: agent.assignedChats } })
      .sort({ updatedAt: -1 })
      .lean();
  }

  static async getStats(clientId: string): Promise<AgentStats> {
    const [total, online, away, offline] = await Promise.all([
      AgentModel.countDocuments({ clientId }),
      AgentModel.countDocuments({ clientId, status: 'online' }),
      AgentModel.countDocuments({ clientId, status: 'away' }),
      AgentModel.countDocuments({ clientId, status: 'offline' }),
    ]);
    return { total, online, away, offline };
  }

  static async removeAgent(agentId: string): Promise<void> {
    const agent = await AgentModel.findByIdAndDelete(agentId);
    if (!agent) throw ApiError.notFound('Agent not found');
    await ChatModel.updateMany(
      { assignedTo: agentId },
      { $unset: { assignedTo: '' } }
    );
  }

  private static format(agent: AgentDocument): AgentListItem {
    return {
      id: agent._id.toString(),
      userId: agent.userId.toString(),
      clientId: agent.clientId ? agent.clientId.toString() : '',
      status: agent.status,
      maxChats: agent.maxChats,
      assignedCount: agent.assignedChats?.length || 0,
      lastActiveAt: agent.lastActiveAt,
    };
  }

  private static formatLean(agent: any): AgentListItem {
    return {
      id: agent._id.toString(),
      userId: agent.userId?._id?.toString() || agent.userId?.toString(),
      clientId: agent.clientId ? agent.clientId.toString() : '',
      status: agent.status,
      maxChats: agent.maxChats,
      assignedCount: agent.assignedChats?.length || 0,
      lastActiveAt: agent.lastActiveAt,
      user: agent.userId?.name ? { name: agent.userId.name, email: agent.userId.email } : undefined,
    };
  }
}