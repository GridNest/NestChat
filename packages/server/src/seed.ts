import mongoose from 'mongoose';
import { env } from './config/env.js';
import { UserModel } from './modules/user/user.model.js';
import { ClientModel } from './modules/client/client.model.js';
import { ClientConfigModel } from './modules/clientConfig/clientConfig.model.js';
import { FAQModel } from './modules/faq/faq.model.js';
import { KnowledgeModel } from './modules/knowledge/knowledge.model.js';
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
          greetingMessage: 'Hello! Welcome to our website. How can I help you today?',
          widgetPosition: 'bottom-right',
          widgetStyle: 'bubble',
          theme: 'light',
          quickActions: ['Services', 'Contact', 'Opening Hours'],
          fallbackMessage: 'Let me connect you with our team.',
          allowedLanguages: ['en'],
        });
        logger.info('ClientConfig created for:', client.clientId);
      }

      // Seed default FAQs for demo client only
      const faqCount = await FAQModel.countDocuments({ clientId: client._id });
      if (faqCount === 0) {
        await FAQModel.insertMany([
          {
            clientId: client._id,
            category: 'hours',
            question: 'What are your opening hours?',
            answer: 'We are open Monday through Sunday from 9:00 AM to 9:00 PM.',
            answerHi: 'Hum Somvar se Ravivar 9:00 AM se 9:00 PM tak khule rehte hain.',
            keywords: ['hours', 'opening', 'timing', 'open', 'close', 'time', 'schedule'],
            priority: 9,
            isActive: true,
            isDeleted: false,
          },
          {
            clientId: client._id,
            category: 'contact',
            question: 'How can I contact support?',
            answer: 'You can contact us via phone at +1 234 567 890 or email at contact@example.com.',
            answerHi: 'Aap humse phone +1 234 567 890 ya email contact@example.com par sampark kar sakte hain.',
            keywords: ['location', 'address', 'where', 'contact', 'phone', 'email', 'reach'],
            priority: 7,
            isActive: true,
            isDeleted: false,
          },
        ]);
        logger.info('Default FAQs seeded for:', client.clientId);
      }

      // Seed default Knowledge Base articles for Luxe Restaurant
      const kbCount = await KnowledgeModel.countDocuments({ clientId: client._id });
      if (kbCount === 0) {
        await KnowledgeModel.insertMany([
          {
            clientId: client._id,
            pageName: 'dining-experience',
            slug: 'dining-experience',
            title: 'Luxe Gourmet Dining Experience',
            content: 'At Luxe Restaurant, culinary artistry meets tradition. Our Executive Chef crafts seasonal menus using 24-month Aged Parmigiano-Reggiano, black truffle emulsion, and wild forest mushrooms paired with international fine wines.',
            tags: ['restaurant', 'luxury', 'dining', 'chef', 'wine'],
            category: 'experience',
            language: 'en',
            priority: 10,
            isActive: true,
            isDeleted: false,
          },
          {
            clientId: client._id,
            pageName: 'private-events',
            slug: 'private-events',
            title: 'Private Events & Celebrations',
            content: 'Host your special celebration in our Private Dining Room accommodating up to 40 guests. Custom tasting menus and wine pairings are curated by our head sommelier.',
            tags: ['events', 'private dining', 'parties', 'catering', 'wedding'],
            category: 'events',
            language: 'en',
            priority: 8,
            isActive: true,
            isDeleted: false,
          },
        ]);
        logger.info('Default Knowledge Base articles seeded for:', client.clientId);
      }
    }

    logger.info('Database seeded successfully');
  } catch (error) {
    logger.error('Seeding failed:', error);
  }
}

export { seed };

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seed().then(() => process.exit(0));
}
