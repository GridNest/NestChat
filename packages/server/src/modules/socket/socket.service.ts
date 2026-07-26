import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../../utils/jwt.js';
import { NotificationModel } from '../notification/notification.model.js';
import { logger } from '../../utils/logger.js';

let io: Server | null = null;

const userSockets = new Map<string, Set<string>>();

export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = verifyToken(token as string);
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).user?.id as string;
    const clientId = (socket as any).user?.clientId as string;

    if (userId) {
      if (!userSockets.has(userId)) userSockets.set(userId, new Set());
      userSockets.get(userId)!.add(socket.id);

      socket.join(`user:${userId}`);
      socket.join(`client:${clientId}`);
    }

    socket.on('disconnect', () => {
      if (userId) {
        const sockets = userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) userSockets.delete(userId);
        }
      }
    });
  });

  logger.info('Socket.IO initialized');
  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

export function emitToUser(userId: string, event: string, data: any): void {
  getIO().to(`user:${userId}`).emit(event, data);
}

export function emitToClient(clientId: string, event: string, data: any): void {
  getIO().to(`client:${clientId}`).emit(event, data);
}

export function emitToAll(event: string, data: any): void {
  getIO().emit(event, data);
}

export async function createAndEmitNotification(userId: string, notification: {
  type: string;
  title: string;
  message: string;
  data?: any;
}): Promise<void> {
  const doc = await NotificationModel.create({
    userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    data: notification.data,
  });

  emitToUser(userId, 'notification', {
    id: doc._id.toString(),
    type: doc.type,
    title: doc.title,
    message: doc.message,
    data: doc.data,
    read: false,
    createdAt: doc.createdAt,
  });
}

export function isUserOnline(userId: string): boolean {
  const sockets = userSockets.get(userId);
  return !!sockets && sockets.size > 0;
}

export function getOnlineUserIds(userIds: string[]): string[] {
  return userIds.filter(id => isUserOnline(id));
}