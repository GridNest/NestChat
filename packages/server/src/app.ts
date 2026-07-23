import express, { Express } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { corsOptions } from './config/cors';
import { globalLimiter } from './middleware/rateLimiter';
import { sanitize } from './middleware/sanitize';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { securityHeaders, requestLogger, sanitizeInput, rateLimiter } from './middleware/security';
import { corsMiddleware } from './middleware/domainValidation';
import { authRoutes } from './modules/auth/auth.routes';
import { clientRoutes } from './modules/client/client.routes';
import { clientConfigRoutes } from './modules/clientConfig/clientConfig.routes';
import { clientThemeRoutes } from './modules/clientTheme/clientTheme.routes';
import { clientModuleRoutes } from './modules/clientModule/clientModule.routes';
import { knowledgeRoutes } from './modules/knowledge/knowledge.routes';
import { faqRoutes } from './modules/faq/faq.routes';
import { chatRoutes } from './modules/chat/chat.routes';
import { widgetRoutes } from './modules/widget/widget.routes';
import { inquiryRoutes } from './modules/inquiry/inquiry.routes';
import { unansweredRoutes } from './modules/unanswered/unanswered.routes';
import { roleRoutes } from './modules/role/role.routes';
import { userRoleRoutes } from './modules/userRole/userRole.routes';
import { websiteConnectorRoutes } from './modules/websiteConnector/websiteConnector.routes';
import { widgetConfigRoutes } from './modules/widgetConfig/widgetConfig.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { settingsRoutes } from './modules/settings/settings.routes';
import { notificationRoutes } from './modules/notification/notification.routes';
import { userRoutes } from './modules/user/user.routes';
import { widgetGeneratorRoutes } from './modules/widgetGenerator/widgetGenerator.routes';
import { analyticsRoutes } from './modules/analytics/analytics.routes';
import { reportsRoutes } from './modules/reports/reports.routes';
import { healthRoutes } from './modules/health/health.routes';
import { systemLogRoutes } from './modules/systemLog/systemLog.routes';
import { logger } from './utils/logger';

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
