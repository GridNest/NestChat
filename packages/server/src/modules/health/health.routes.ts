import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import os from 'os';

const router: Router = Router();
const startTime = new Date();

router.get('/health', async (req: Request, res: Response) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStates: { [key: number]: string } = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const health = {
      status: dbState === 1 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStates[dbState] || 'unknown',
        name: mongoose.connection.name,
      },
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      },
      cpu: {
        model: os.cpus()[0]?.model || 'Unknown',
        cores: os.cpus().length,
        loadAverage: os.loadavg().map(l => l.toFixed(2)),
      },
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/status', async (req: Request, res: Response) => {
  try {
    const dbState = mongoose.connection.readyState;
    const isDbConnected = dbState === 1;

    res.json({
      success: true,
      data: {
        service: 'NestChat API',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        status: isDbConnected ? 'operational' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: {
          seconds: Math.floor(process.uptime()),
          human: formatUptime(process.uptime()),
        },
        startedAt: startTime.toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get status',
    });
  }
});

router.get('/version', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      buildTime: process.env.BUILD_TIME || 'unknown',
    },
  });
});

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

export const healthRoutes = router;
