import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOptions } from './config/cors';
import { globalLimiter } from './middleware/rateLimiter';
import { sanitize } from './middleware/sanitize';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import { clientRoutes } from './modules/client/client.routes';
import { clientConfigRoutes } from './modules/clientConfig/clientConfig.routes';
import { knowledgeRoutes } from './modules/knowledge/knowledge.routes';
import { faqRoutes } from './modules/faq/faq.routes';
import { chatRoutes } from './modules/chat/chat.routes';
import { widgetRoutes } from './modules/widget/widget.routes';
import { logger } from './utils/logger';

const app: Express = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(globalLimiter);
app.use(sanitize);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/client-configs', clientConfigRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/widget', widgetRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
