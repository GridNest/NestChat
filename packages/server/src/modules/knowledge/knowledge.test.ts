import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Knowledge } from './knowledge.model';

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
  await Knowledge.deleteMany({});
});

describe('Knowledge Module', () => {
  const testClientId = new mongoose.Types.ObjectId();

  describe('Knowledge Model', () => {
    it('should create a knowledge entry', async () => {
      const knowledge = await Knowledge.create({
        clientId: testClientId,
        pageName: 'About Us',
        slug: 'about-us',
        title: 'About Our Company',
        content: 'We are a leading technology company...',
        category: 'company',
        language: 'en',
        tags: ['about', 'company'],
      });

      expect(knowledge).toBeTruthy();
      expect(knowledge.title).toBe('About Our Company');
      expect(knowledge.slug).toBe('about-us');
    });

    it('should have default values', async () => {
      const knowledge = await Knowledge.create({
        clientId: testClientId,
        pageName: 'Test Page',
        slug: 'test-page',
        title: 'Test',
        content: 'Test content',
      });

      expect(knowledge.isActive).toBe(true);
      expect(knowledge.isDeleted).toBe(false);
      expect(knowledge.priority).toBe(0);
      expect(knowledge.language).toBe('en');
    });

    it('should require required fields', async () => {
      const knowledge = new Knowledge({
        clientId: testClientId,
      });

      try {
        await knowledge.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should enforce unique slug per client', async () => {
      await Knowledge.create({
        clientId: testClientId,
        pageName: 'Page 1',
        slug: 'duplicate-slug',
        title: 'Page 1',
        content: 'Content 1',
      });

      try {
        await Knowledge.create({
          clientId: testClientId,
          pageName: 'Page 2',
          slug: 'duplicate-slug',
          title: 'Page 2',
          content: 'Content 2',
        });
        fail('Should have thrown duplicate key error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should allow same slug for different clients', async () => {
      const otherClientId = new mongoose.Types.ObjectId();

      await Knowledge.create({
        clientId: testClientId,
        pageName: 'Page 1',
        slug: 'same-slug',
        title: 'Page 1',
        content: 'Content 1',
      });

      const other = await Knowledge.create({
        clientId: otherClientId,
        pageName: 'Page 2',
        slug: 'same-slug',
        title: 'Page 2',
        content: 'Content 2',
      });

      expect(other).toBeTruthy();
    });
  });

  describe('Knowledge Queries', () => {
    beforeEach(async () => {
      await Knowledge.create({
        clientId: testClientId,
        pageName: 'Active Page',
        slug: 'active-page',
        title: 'Active',
        content: 'Active content',
        isActive: true,
      });

      await Knowledge.create({
        clientId: testClientId,
        pageName: 'Inactive Page',
        slug: 'inactive-page',
        title: 'Inactive',
        content: 'Inactive content',
        isActive: false,
      });
    });

    it('should find active knowledge entries', async () => {
      const entries = await Knowledge.find({
        clientId: testClientId,
        isActive: true,
        isDeleted: false,
      });

      expect(entries.length).toBe(1);
      expect(entries[0].pageName).toBe('Active Page');
    });

    it('should search by title', async () => {
      const entries = await Knowledge.find({
        clientId: testClientId,
        title: { $regex: 'Active', $options: 'i' },
      });

      expect(entries.length).toBe(1);
    });

    it('should find by category', async () => {
      await Knowledge.create({
        clientId: testClientId,
        pageName: 'FAQ',
        slug: 'faq',
        title: 'FAQ Page',
        content: 'FAQ content',
        category: 'faq',
      });

      const entries = await Knowledge.find({
        clientId: testClientId,
        category: 'faq',
      });

      expect(entries.length).toBe(1);
    });

    it('should soft delete knowledge', async () => {
      const entry = await Knowledge.findOne({
        clientId: testClientId,
        slug: 'active-page',
      });

      entry!.isDeleted = true;
      await entry!.save();

      const activeEntries = await Knowledge.find({
        clientId: testClientId,
        isDeleted: false,
      });

      expect(activeEntries.length).toBe(1);
    });
  });
});
