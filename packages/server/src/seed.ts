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

      // Seed default FAQs for Luxe Restaurant
      const faqCount = await FAQModel.countDocuments({ clientId: client._id });
      if (faqCount === 0) {
        await FAQModel.insertMany([
          {
            clientId: client._id,
            category: 'menu',
            question: 'What is on your menu?',
            answer: 'Our Luxe Restaurant menu highlights include:\n\n• Truffle Infused Risotto - $34\n• Wagyu Beef Tenderloin - $58\n• Pan-Seared Chilean Sea Bass - $46\n• Artisanal Tiramisu - $16\n\nWe offer Vegetarian, Vegan, and Gluten-Free options upon request.',
            answerHi: 'Hamare menu mein Truffle Infused Risotto ($34), Wagyu Beef ($58), Chilean Sea Bass ($46), aur Tiramisu ($16) shamil hain.',
            keywords: ['menu', 'food', 'dishes', 'starters', 'mains', 'desserts', 'pricing'],
            priority: 10,
            isActive: true,
            isDeleted: false,
          },
          {
            clientId: client._id,
            category: 'hours',
            question: 'What are your opening hours?',
            answer: 'We are open Monday through Sunday from 12:00 PM to 11:30 PM. Dinner service is available from 5:00 PM to 11:00 PM.',
            answerHi: 'Hum Somvar se Ravivar dopahar 12:00 baje se raat 11:30 baje tak khule rehte hain.',
            keywords: ['hours', 'opening', 'timing', 'open', 'close', 'time', 'schedule'],
            priority: 9,
            isActive: true,
            isDeleted: false,
          },
          {
            clientId: client._id,
            category: 'reservations',
            question: 'How do I book a table / make a reservation?',
            answer: 'You can reserve a table by calling us at +1 234 567 890 or booking online through our website. For parties of 6 or more, please reserve at least 24 hours in advance.',
            answerHi: 'Aap hume +1 234 567 890 par call karke ya website se online table book kar sakte hain.',
            keywords: ['book', 'table', 'reservation', 'reserve', 'party', 'booking', 'seats'],
            priority: 8,
            isActive: true,
            isDeleted: false,
          },
          {
            clientId: client._id,
            category: 'contact',
            question: 'Where are you located and how can I contact you?',
            answer: 'Luxe Restaurant is located at Gourmet Avenue, City. You can reach us by phone at +1 234 567 890 or email at contact@luxerestaurant.com.',
            answerHi: 'Luxe Restaurant Gourmet Avenue, City mein sthit hai. Humse +1 234 567 890 par sampark karein.',
            keywords: ['location', 'address', 'where', 'contact', 'phone', 'email', 'reach'],
            priority: 7,
            isActive: true,
            isDeleted: false,
          },
          {
            clientId: client._id,
            category: 'dietary',
            question: 'Do you have vegetarian or vegan options?',
            answer: 'Yes! We offer a dedicated vegetarian menu including our popular Truffle Infused Risotto, Wild Mushroom Ravioli, and Fresh Garden Salads.',
            answerHi: 'Haan! Hamare paas vegetarian aur vegan options uplabdh hain.',
            keywords: ['vegetarian', 'veg', 'vegan', 'gluten-free', 'dietary', 'allergies'],
            priority: 6,
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
