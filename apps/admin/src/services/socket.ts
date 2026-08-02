import { io, Socket } from 'socket.io-client';

function getCleanSocketUrl(): string {
  const envUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return envUrl.replace(/\/api\/?$/, '');
}

const SOCKET_URL = getCleanSocketUrl();

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function onNotification(callback: (data: any) => void): () => void {
  if (!socket) return () => {};
  socket.on('notification', callback);
  return () => socket?.off('notification', callback);
}

export function onChatAssigned(callback: (data: any) => void): () => void {
  if (!socket) return () => {};
  socket.on('chat:assigned', callback);
  return () => socket?.off('chat:assigned', callback);
}

export function onChatMessage(callback: (data: any) => void): () => void {
  if (!socket) return () => {};
  socket.on('chat:message', callback);
  return () => socket?.off('chat:message', callback);
}

export function onAgentStatus(callback: (data: any) => void): () => void {
  if (!socket) return () => {};
  socket.on('agent:status', callback);
  return () => socket?.off('agent:status', callback);
}