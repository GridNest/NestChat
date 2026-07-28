import React, { useState, useEffect } from 'react';
import { useToast } from '../../components/ui/Toast';
import { adminApi } from '../../services/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const { addToast } = useToast();
  const limit = 20;

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getNotifications({
        page: page.toString(),
        limit: limit.toString(),
      });
      setNotifications(response.data?.notifications || []);
      setTotal(response.data?.total || 0);
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await adminApi.markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      addToast('error', 'Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await adminApi.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      addToast('success', 'All notifications marked as read');
    } catch (error) {
      addToast('error', 'Failed to mark all as read');
    }
  };

  const typeIcons: Record<string, string> = {
    inquiry: '📋',
    client: '👥',
    api_failed: '⚠️',
    system: '🔔',
    chat: '💬',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Notifications</h1>
          {unreadCount > 0 ? (
            <p className="text-xs sm:text-sm text-blue-600 font-medium mt-0.5">{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</p>
          ) : (
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">All caught up!</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors min-h-[44px] flex items-center justify-center self-start sm:self-auto"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm bg-white rounded-xl shadow-sm border border-gray-200">No notifications</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-colors ${
                !notification.read ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'
              }`}
            >
              <span className="text-xl sm:text-2xl flex-shrink-0 mt-0.5">{typeIcons[notification.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-xs sm:text-sm text-gray-900 truncate">{notification.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed break-words">{notification.message}</p>
                <p className="text-[11px] text-gray-400 mt-2">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              {!notification.read && (
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold p-2 rounded-lg hover:bg-blue-100/50 flex-shrink-0 min-h-[36px]"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {total > limit && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <span className="text-xs sm:text-sm text-gray-600">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} notifications
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-xs sm:text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 min-h-[44px]"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * limit >= total}
              className="px-4 py-2 text-xs sm:text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 min-h-[44px]"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

