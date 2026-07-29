import mongoose from 'mongoose';
import { env } from './config/env.js';
import { UserModel } from './modules/user/user.model.js';
import { ClientModel } from './modules/client/client.model.js';
import { ClientConfigModel } from './modules/clientConfig/clientConfig.model.js';
import { FAQModel } from './modules/faq/faq.model.js';
import { KnowledgeModel } from './modules/knowledge/knowledge.model.js';
import { WebsiteContentModel } from './modules/websiteContent/websiteContent.model.js';
import { ChatModel } from './modules/chat/chat.model.js';
import { ChatMessageModel } from './modules/chat/chatMessage.model.js';
import { ChatAnalytics } from './modules/analytics/chatAnalytics.model.js';
import { Analytics } from './modules/analytics/analytics.model.js';
import { InquiryModel } from './modules/inquiry/inquiry.model.js';
import { InquiryStateModel } from './modules/inquiry/inquiryState.model.js';
import { UnansweredModel } from './modules/unanswered/unanswered.model.js';
import { NotificationModel } from './modules/notification/notification.model.js';
import { logger } from './utils/logger.js';

export async function resetDatabase(keepAdminUser: boolean = true): Promise<void> {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
      logger.info('Connected to MongoDB');
    }

    logger.info('Starting complete test data purge...');

    // 1. Delete Chat sessions and messages
    const chatMsgRes = await ChatMessageModel.deleteMany({});
    const chatRes = await ChatModel.deleteMany({});
    logger.info(`Cleared ${chatRes.deletedCount} chat sessions and ${chatMsgRes.deletedCount} messages`);

    // 2. Delete Analytics records
    const analyticsRes = await Analytics.deleteMany({});
    const chatAnalyticsRes = await ChatAnalytics.deleteMany({});
    logger.info(`Cleared ${analyticsRes.deletedCount} analytics records and ${chatAnalyticsRes.deletedCount} chat analytics`);

    // 3. Delete Inquiries and inquiry state
    const inquiryRes = await InquiryModel.deleteMany({});
    const inquiryStateRes = await InquiryStateModel.deleteMany({});
    logger.info(`Cleared ${inquiryRes.deletedCount} inquiries and ${inquiryStateRes.deletedCount} active inquiry states`);

    // 4. Delete Unanswered Questions & Notifications
    const unansweredRes = await UnansweredModel.deleteMany({});
    const notifRes = await NotificationModel.deleteMany({});
    logger.info(`Cleared ${unansweredRes.deletedCount} unanswered questions and ${notifRes.deletedCount} test notifications`);

    // 5. Delete Knowledge Base, FAQs, and Website Scraped Content
    const kbRes = await KnowledgeModel.deleteMany({});
    const faqRes = await FAQModel.deleteMany({});
    const webRes = await WebsiteContentModel.deleteMany({});
    logger.info(`Cleared ${kbRes.deletedCount} knowledge items, ${faqRes.deletedCount} FAQs, and ${webRes.deletedCount} website scraped pages`);

    // 6. Delete Client Configurations and Clients
    const configRes = await ClientConfigModel.deleteMany({});
    const clientRes = await ClientModel.deleteMany({});
    logger.info(`Cleared ${clientRes.deletedCount} clients and ${configRes.deletedCount} client configs`);

    // 7. Handle Users
    if (keepAdminUser) {
      // Keep main admin user (or create default admin if missing)
      const nonAdminRes = await UserModel.deleteMany({ role: { $ne: 'admin' } });
      logger.info(`Cleared ${nonAdminRes.deletedCount} non-admin user accounts`);

      let admin = await UserModel.findOne({ role: 'admin' });
      if (!admin) {
        admin = await UserModel.create({
          email: 'admin@nestchat.com',
          password: 'Admin@123',
          name: 'NestChat Admin',
          role: 'admin',
        });
        logger.info('Default super admin recreated: admin@nestchat.com / Admin@123');
      } else {
        logger.info(`Preserved super admin user: ${admin.email}`);
      }
    } else {
      const userRes = await UserModel.deleteMany({});
      logger.info(`Cleared ${userRes.deletedCount} user accounts`);
    }

    logger.info('=== DATABASE RESET SUCCESSFUL ===');
  } catch (error) {
    logger.error('Database reset failed:', error);
    throw error;
  }
}

if (process.argv[1] && process.argv[1].endsWith('resetDb.ts')) {
  resetDatabase(true)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
