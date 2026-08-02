import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Inquiry } from './inquiry.model.js';

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

  describe('Inquiry Engine & Interruptible Workflow', () => {
    const { InquiryEngine } = require('./inquiryEngine.js');
    const { InquiryStateModel } = require('./inquiryState.model.js');

    beforeEach(async () => {
      await InquiryStateModel.deleteMany({});
    });

    it('should detect business questions as interruptions during an active workflow', async () => {
      const isInterruption = InquiryEngine.isInterruptionQuery('Show menu', 'en', 'phone');
      expect(isInterruption).toBe(true);

      const isInterruption2 = InquiryEngine.isInterruptionQuery('What are your business hours?', 'en', 'email');
      expect(isInterruption2).toBe(true);

      const isInterruption3 = InquiryEngine.isInterruptionQuery('+1 555-123-4567', 'en', 'phone');
      expect(isInterruption3).toBe(false);
    });

    it('should pause and resume state seamlessly without losing form progress', async () => {
      const chatId = 'chat-interrupt-test';
      const state = await InquiryEngine.createState({
        chatId,
        sessionId: 'session-123',
        clientId: testClientId.toString(),
        visitorId: 'visitor-123',
        language: 'en',
        workflowType: 'lead_generation',
      });

      expect(state.status).toBe('active');
      expect(state.currentStep).toBe('businessName');

      // Process step 1
      const res1 = await InquiryEngine.processInput(chatId, 'Acme Corp');
      expect(res1.success).toBe(true);
      expect(res1.nextStep).toBe('businessType');

      // Pause workflow
      await InquiryEngine.pauseState(chatId);
      const pausedState = await InquiryEngine.getActiveOrPausedState(chatId);
      expect(pausedState?.status).toBe('paused');
      expect(pausedState?.currentStep).toBe('businessType');

      // Resume workflow
      const resumeRes = await InquiryEngine.resumeState(chatId);
      expect(resumeRes.state?.status).toBe('active');
      expect(resumeRes.state?.currentStep).toBe('businessType');
    });

    it('should complete Lead Capture workflow and produce 24h completion message', async () => {
      const chatId = 'chat-lead-complete-test';
      await InquiryEngine.createState({
        chatId,
        sessionId: 'session-456',
        clientId: testClientId.toString(),
        visitorId: 'visitor-456',
        language: 'en',
        workflowType: 'lead_generation',
      });

      await InquiryEngine.processInput(chatId, 'Tech Corp'); // businessName
      await InquiryEngine.processInput(chatId, 'SaaS'); // businessType
      await InquiryEngine.processInput(chatId, 'E-commerce Website'); // websiteType
      await InquiryEngine.processInput(chatId, 'Payment Gateway, User Portal'); // requiredFeatures
      await InquiryEngine.processInput(chatId, 'skip'); // budget
      await InquiryEngine.processInput(chatId, '1 month'); // timeline
      await InquiryEngine.processInput(chatId, 'Alice Smith'); // name
      await InquiryEngine.processInput(chatId, '+1 555-987-6543'); // phone
      const finalRes = await InquiryEngine.processInput(chatId, 'alice@example.com'); // email

      expect(finalRes.isComplete).toBe(true);
      expect(finalRes.message).toContain('Thank you! Our team will contact you within 24 hours.');
      expect(finalRes.data?.businessName).toBe('Tech Corp');
    });
  });
});
