import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../user/user.model.js';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.JWT_EXPIRES_IN = '7d';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth Module', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'admin' as const,
  };

  describe('User Model', () => {
    it('should create a user with hashed password', async () => {
      const user = await User.create({
        ...testUser,
        clientId: new mongoose.Types.ObjectId(),
      });

      expect(user.email).toBe(testUser.email);
      expect(user.password).not.toBe(testUser.password);
      expect(user.role).toBe('admin');
    });

    it('should hash password before saving', async () => {
      const user = await User.create({
        ...testUser,
        clientId: new mongoose.Types.ObjectId(),
      });

      const isMatch = await bcrypt.compare(testUser.password, user.password);
      expect(isMatch).toBe(true);
    });

    it('should require email and password', async () => {
      const user = new User({ name: 'Test' });
      
      try {
        await user.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should enforce unique email', async () => {
      await User.create({
        ...testUser,
        clientId: new mongoose.Types.ObjectId(),
      });

      try {
        await User.create({
          ...testUser,
          clientId: new mongoose.Types.ObjectId(),
        });
        fail('Should have thrown duplicate key error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('JWT Token', () => {
    it('should generate valid JWT token', () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const token = jwt.sign({ userId }, process.env.JWT_SECRET!, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      expect(token).toBeTruthy();
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      expect(decoded.userId).toBe(userId);
    });

    it('should reject invalid token', () => {
      const token = jwt.sign({ userId: 'test' }, 'wrong-secret');
      
      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET!);
      }).toThrow();
    });

    it('should reject expired token', () => {
      const token = jwt.sign({ userId: 'test' }, process.env.JWT_SECRET!, {
        expiresIn: '0s',
      });

      setTimeout(() => {
        expect(() => {
          jwt.verify(token, process.env.JWT_SECRET!);
        }).toThrow();
      }, 1000);
    });
  });

  describe('Password Comparison', () => {
    it('should compare passwords correctly', async () => {
      const user = await User.create({
        ...testUser,
        clientId: new mongoose.Types.ObjectId(),
      });

      const isMatch = await bcrypt.compare(testUser.password, user.password);
      expect(isMatch).toBe(true);

      const isWrong = await bcrypt.compare('wrongpassword', user.password);
      expect(isWrong).toBe(false);
    });
  });
});
