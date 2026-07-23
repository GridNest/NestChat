import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Inquiry } from './inquiry.model';

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
  await Inquiry.deleteMany({});
});

describe('Inquiry Module', () => {
  const testClientId = new mongoose.Types.ObjectId();
  const testChatId = new mongoose.Types.ObjectId();

  describe('Inquiry Model', () => {
    it('should create an inquiry', async () => {
      const inquiry = await Inquiry.create({
        clientId: testClientId,
        chatId: testChatId,
        visitorId: 'visitor-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        service: 'Web Development',
        details: 'Need a new website',
        source: 'chatbot',
      });

      expect(inquiry).toBeTruthy();
      expect(inquiry.name).toBe('John Doe');
      expect(inquiry.email).toBe('john@example.com');
      expect(inquiry.status).toBe('new');
    });

    it('should have default values', async () => {
      const inquiry = await Inquiry.create({
        clientId: testClientId,
        name: 'Test',
        email: 'test@example.com',
        phone: '1234567890',
        service: 'Test Service',
        details: 'Test details',
      });

      expect(inquiry.status).toBe('new');
      expect(inquiry.source).toBe('chatbot');
      expect(inquiry.language).toBe('en');
    });

    it('should require required fields', async () => {
      const inquiry = new Inquiry({
        clientId: testClientId,
      });

      try {
        await inquiry.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should track status changes', async () => {
      const inquiry = await Inquiry.create({
        clientId: testClientId,
        name: 'Test',
        email: 'test@example.com',
        phone: '1234567890',
        service: 'Test Service',
        details: 'Test details',
      });

      inquiry.status = 'contacted';
      await inquiry.save();

      const updated = await Inquiry.findById(inquiry._id);
      expect(updated?.status).toBe('contacted');
    });

    it('should track timestamps', async () => {
      const inquiry = await Inquiry.create({
        clientId: testClientId,
        name: 'Test',
        email: 'test@example.com',
        phone: '1234567890',
        service: 'Test Service',
        details: 'Test details',
      });

      expect(inquiry.createdAt).toBeDefined();
      expect(inquiry.updatedAt).toBeDefined();
      expect(inquiry.submittedAt).toBeDefined();
    });
  });

  describe('Inquiry Queries', () => {
    beforeEach(async () => {
      await Inquiry.create({
        clientId: testClientId,
        name: 'New Inquiry',
        email: 'new@example.com',
        phone: '1111111111',
        service: 'Service 1',
        details: 'Details 1',
        status: 'new',
      });

      await Inquiry.create({
        clientId: testClientId,
        name: 'Contacted Inquiry',
        email: 'contacted@example.com',
        phone: '2222222222',
        service: 'Service 2',
        details: 'Details 2',
        status: 'contacted',
      });
    });

    it('should find inquiries by status', async () => {
      const newInquiries = await Inquiry.find({
        clientId: testClientId,
        status: 'new',
      });

      expect(newInquiries.length).toBe(1);
    });

    it('should find inquiries by client', async () => {
      const inquiries = await Inquiry.find({ clientId: testClientId });
      expect(inquiries.length).toBe(2);
    });

    it('should search by name or email', async () => {
      const results = await Inquiry.find({
        clientId: testClientId,
        $or: [
          { name: { $regex: 'New', $options: 'i' } },
          { email: { $regex: 'contacted', $options: 'i' } },
        ],
      });

      expect(results.length).toBe(2);
    });

    it('should sort by date', async () => {
      const inquiries = await Inquiry.find({ clientId: testClientId })
        .sort({ createdAt: -1 });

      expect(inquiries.length).toBe(2);
      expect(inquiries[0].createdAt >= inquiries[1].createdAt).toBe(true);
    });
  });
});
