import express, { Express } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { corsOptions } from './config/cors.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { sanitize } from './middleware/sanitize.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { securityHeaders, requestLogger, sanitizeInput, rateLimiter } from './middleware/security.js';
import { corsMiddleware } from './middleware/domainValidation.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { clientRoutes } from './modules/client/client.routes.js';
import { clientConfigRoutes } from './modules/clientConfig/clientConfig.routes.js';
import { clientThemeRoutes } from './modules/clientTheme/clientTheme.routes.js';
import { clientModuleRoutes } from './modules/clientModule/clientModule.routes.js';
import { knowledgeRoutes } from './modules/knowledge/knowledge.routes.js';
import { faqRoutes } from './modules/faq/faq.routes.js';
import { chatRoutes } from './modules/chat/chat.routes.js';
import { widgetRoutes } from './modules/widget/widget.routes.js';
import { inquiryRoutes } from './modules/inquiry/inquiry.routes.js';
import { unansweredRoutes } from './modules/unanswered/unanswered.routes.js';
import { roleRoutes } from './modules/role/role.routes.js';
import { userRoleRoutes } from './modules/userRole/userRole.routes.js';
import { websiteConnectorRoutes } from './modules/websiteConnector/websiteConnector.routes.js';
import { widgetConfigRoutes } from './modules/widgetConfig/widgetConfig.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { settingsRoutes } from './modules/settings/settings.routes.js';
import { notificationRoutes } from './modules/notification/notification.routes.js';
import { userRoutes } from './modules/user/user.routes.js';
import { widgetGeneratorRoutes } from './modules/widgetGenerator/widgetGenerator.routes.js';
import { analyticsRoutes } from './modules/analytics/analytics.routes.js';
import { reportsRoutes } from './modules/reports/reports.routes.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { systemLogRoutes } from './modules/systemLog/systemLog.routes.js';
import { logger } from './utils/logger.js';

const app: Express = express();

app.use(helmet());
app.use(corsMiddleware);
app.use(cors(corsOptions));
app.use(globalLimiter);
app.use(rateLimiter({ windowMs: 60000, max: 200 }));
app.use(sanitize);
app.use(sanitizeInput);
app.use(securityHeaders);
app.use(compression());
app.use(requestLogger);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

app.use('/api', healthRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/client-configs', clientConfigRoutes);
app.use('/api/client-themes', clientThemeRoutes);
app.use('/api/client-modules', clientModuleRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/widget', widgetRoutes);
app.use('/api/inquiry', inquiryRoutes);
app.use('/api/unanswered', unansweredRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/user-roles', userRoleRoutes);
app.use('/api/website-connectors', websiteConnectorRoutes);
app.use('/api/widget-config', widgetConfigRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/widget-generator', widgetGeneratorRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/system-logs', systemLogRoutes);

app.get('/widget.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(path.join(__dirname, '../../widget/src/widget.js'));
});

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
