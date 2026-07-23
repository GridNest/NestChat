import mongoose from 'mongoose';
import { env } from './config/env';
import { UserModel } from './modules/user/user.model';
import { ClientModel } from './modules/client/client.model';
import { logger } from './utils/logger';

async function seed(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Create Admin User
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

    // Create Demo Client User
    const demoClientExists = await UserModel.findOne({ email: 'demo@example.com' });
    let demoUser;
    
    if (!demoClientExists) {
      demoUser = await UserModel.create({
        email: 'demo@example.com',
        password: 'Demo@123',
        name: 'Demo Client',
        role: 'admin',
      });
      logger.info('Demo user created:', demoUser.email);
    } else {
      demoUser = demoClientExists;
    }

    // Create Demo Client
    const clientExists = await ClientModel.findOne({ clientId: 'demo-client' });
    if (!clientExists) {
      const demoClient = await ClientModel.create({
        clientId: 'demo-client',
        name: 'Demo Client',
        email: 'demo@example.com',
        companyName: 'Demo Company',
        phone: '+91 98765 43210',
        website: 'https://demo.example.com',
        websiteType: 'corporate',
        botName: 'Demo Assistant',
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        defaultLanguage: 'en',
        timezone: 'Asia/Kolkata',
        status: 'active',
        isActive: true,
        allowedDomains: ['localhost', '127.0.0.1', 'demo.example.com'],
        createdBy: demoUser._id,
      });
      logger.info('Demo client created:', demoClient.clientId);
    }

    logger.info('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
