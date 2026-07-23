import { app } from './app.js';
import { env, validateEnv } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';

async function bootstrap(): Promise<void> {
  try {
    validateEnv();
    
    await connectDatabase();
    
    app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`API URL: ${env.API_URL}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

bootstrap();
