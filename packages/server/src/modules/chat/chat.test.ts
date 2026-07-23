import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Chat, ChatMessage } from './chat.model';
import { FAQ } from '../faq/faq.model';
import { Knowledge } from '../knowledge/knowledge.model';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Chat.deleteMany({});
  await ChatMessage.deleteMany({});
  await FAQ.deleteMany({});
  await Knowledge.deleteMany({});
});

describe('Chat Module', () => {
  const testClientId = new mongoose.Types.ObjectId();
  const testVisitorId = 'visitor-123';

  describe('Chat Model', () => {
    it('should create a chat session', async () => {
      const chat = await Chat.create({
        clientId: testClientId,
        visitorId: testVisitorId,
        status: 'active',
      });

      expect(chat).toBeTruthy();
      expect(chat.clientId).toEqual(testClientId);
      expect(chat.visitorId).toBe(testVisitorId);
      expect(chat.status).toBe('active');
    });

    it('should have default values', async () => {
      const chat = await Chat.create({
        clientId: testClientId,
        visitorId: testVisitorId,
      });

      expect(chat.messageCount).toBe(0);
      expect(chat.startedAt).toBeDefined();
    });

    it('should track timestamps', async () => {
      const chat = await Chat.create({
        clientId: testClientId,
        visitorId: testVisitorId,
      });

      expect(chat.createdAt).toBeDefined();
      expect(chat.updatedAt).toBeDefined();
    });
  });

  describe('ChatMessage Model', () => {
    it('should create a chat message', async () => {
      const chat = await Chat.create({
        clientId: testClientId,
        visitorId: testVisitorId,
      });

      const message = await ChatMessage.create({
        chatId: chat._id,
        role: 'user',
        content: 'Hello!',
      });

      expect(message).toBeTruthy();
      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello!');
    });

    it('should support different message roles', async () => {
      const chat = await Chat.create({
        clientId: testClientId,
        visitorId: testVisitorId,
      });

      const userMsg = await ChatMessage.create({
        chatId: chat._id,
        role: 'user',
        content: 'Question?',
      });

      const botMsg = await ChatMessage.create({
        chatId: chat._id,
        role: 'assistant',
        content: 'Answer!',
      });

      expect(userMsg.role).toBe('user');
      expect(botMsg.role).toBe('assistant');
    });

    it('should track timestamps on messages', async () => {
      const chat = await Chat.create({
        clientId: testClientId,
        visitorId: testVisitorId,
      });

      const message = await ChatMessage.create({
        chatId: chat._id,
        role: 'user',
        content: 'Test',
      });

      expect(message.createdAt).toBeDefined();
    });
  });

  describe('Chat Queries', () => {
    it('should find chats by client', async () => {
      await Chat.create({
        clientId: testClientId,
        visitorId: testVisitorId,
      });

      await Chat.create({
        clientId: testClientId,
        visitorId: 'visitor-456',
      });

      const chats = await Chat.find({ clientId: testClientId });
      expect(chats.length).toBe(2);
    });

    it('should find active chats', async () => {
      await Chat.create({
        clientId: testClientId,
        visitorId: testVisitorId,
        status: 'active',
      });

      await Chat.create({
        clientId: testClientId,
        visitorId: 'visitor-456',
        status: 'closed',
      });

      const activeChats = await Chat.find({
        clientId: testClientId,
        status: 'active',
      });

      expect(activeChats.length).toBe(1);
    });

    it('should find messages by chat', async () => {
      const chat = await Chat.create({
        clientId: testClientId,
        visitorId: testVisitorId,
      });

      await ChatMessage.create({
        chatId: chat._id,
        role: 'user',
        content: 'Message 1',
      });

      await ChatMessage.create({
        chatId: chat._id,
        role: 'assistant',
        content: 'Message 2',
      });

      const messages = await ChatMessage.find({ chatId: chat._id });
      expect(messages.length).toBe(2);
    });
  });
});
