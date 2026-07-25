import mongoose from 'mongoose';
import { env } from './config/env.js';
import { UserModel } from './modules/user/user.model.js';
import { ClientModel } from './modules/client/client.model.js';
import { ClientConfigModel } from './modules/clientConfig/clientConfig.model.js';
import { logger } from './utils/logger.js';

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

    // Create or update clients
    const clientsToSeed = [
      {
        clientId: 'demo-client',
        name: 'Demo Client',
        companyName: 'Demo Company',
      },
      {
        clientId: 'vishal-sahu',
        name: 'Vishal Sahu',
        companyName: 'Luxe Restaurant',
      },
      {
        clientId: 'vishal',
        name: 'Vishal',
        companyName: 'Luxe Restaurant',
      },
    ];

    for (const cData of clientsToSeed) {
      let client = await ClientModel.findOne({ clientId: cData.clientId });
      if (!client) {
        client = await ClientModel.create({
          clientId: cData.clientId,
          name: cData.name,
          email: 'demo@example.com',
          companyName: cData.companyName,
          phone: '+91 98765 43210',
          website: 'https://demo.example.com',
          websiteType: 'corporate',
          botName: 'Assistant',
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
          defaultLanguage: 'en',
          timezone: 'Asia/Kolkata',
          status: 'active',
          isActive: true,
          allowedDomains: [],
          createdBy: demoUser._id,
        });
        logger.info('Client created:', client.clientId);
      }

      // Ensure ClientConfig document exists for each client
      const configExists = await ClientConfigModel.findOne({ clientId: client._id });
      if (!configExists) {
        await ClientConfigModel.create({
          clientId: client._id,
          greetingMessage: 'Hello! Welcome to Luxe Restaurant. How can I help you today?',
          widgetPosition: 'bottom-right',
          widgetStyle: 'bubble',
          theme: 'light',
          quickActions: ['Menu', 'Reservations', 'Opening Hours'],
          fallbackMessage: 'Let me connect you with our team.',
          allowedLanguages: ['en'],
        });
        logger.info('ClientConfig created for:', client.clientId);
      }
    }

    logger.info('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
