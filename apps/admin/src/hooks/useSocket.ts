import { useEffect, useState, useCallback } from 'react';
import { connectSocket, disconnectSocket, onNotification } from '../services/socket';
import { useAuthStore } from '../store/authStore';

export interface LiveNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function useSocket() {
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('nestchat_admin_token');
    if (!token) return;

    const socket = connectSocket(token);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    const unsubNotif = onNotification((data) => {
      setNotifications(prev => [data, ...prev]);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      unsubNotif();
      disconnectSocket();
    };
  }, [isAuthenticated]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    connected,
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    clearNotifications,
  };
}