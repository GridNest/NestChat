import mongoose from 'mongoose';
import { env } from './config/env';
import { UserModel } from './modules/user/user.model';
import { ClientModel } from './modules/client/client.model';
import { ClientConfigModel } from './modules/clientConfig/clientConfig.model';
import { logger } from './utils/logger';

async function seed(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    const adminExists = await UserModel.findOne({ email: 'admin@nestchat.com' });
    if (!adminExists) {
      const admin = await UserModel.create({
        email: 'admin@nestchat.com',
        password: 'Admin@123',
        name: 'NestChat Admin',
        role: 'admin',
      });
      logger.info('Admin user created:', admin.email);
    }

    const demoClientExists = await UserModel.findOne({ email: 'demo@example.com' });
    if (!demoClientExists) {
      const demoUser = await UserModel.create({
        email: 'demo@example.com',
        password: 'Demo@123',
        name: 'Demo Client',
        role: 'client',
      });

      const demoClient = await ClientModel.create({
        name: 'GridNest Web Solutions',
        email: 'demo@example.com',
        company: 'GridNest Web Solutions',
        phone: '+91 98765 43210',
        website: 'https://gridnest.example.com',
        industry: 'Technology',
        createdBy: demoUser._id,
      });

      await ClientConfigModel.create({
        clientId: demoClient._id,
        botName: 'GridNest Assistant',
        greetingMessage: 'Hello! Welcome to GridNest Web Solutions. How can I help you today?',
        brandColor: '#6366F1',
        secondaryColor: '#4F46E5',
      });

      demoUser.clientId = demoClient._id;
      await demoUser.save();

      logger.info('Demo client created:', demoClient.email);
    }

    logger.info('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
