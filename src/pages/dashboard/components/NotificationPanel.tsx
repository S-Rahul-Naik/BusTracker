
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '../../../lib/api';

interface Notification {
  id: string;
  type: 'delay' | 'arrival' | 'emergency' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  routeId?: string;
  read: boolean;
}

interface NotificationPanelProps {
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
}

export default function NotificationPanel({ notifications, setNotifications }: NotificationPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getNotifications();
        
        // Transform API data to match component structure
        const transformedNotifications = data.map((notif: any) => ({
          id: notif.id,
          type: notif.type || 'info',
          title: notif.title,
          message: notif.message,
          timestamp: new Date(notif.created_at || notif.timestamp),
          routeId: notif.route_id,
          read: notif.is_read || false
        }));
        
        setNotifications(transformedNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // Fail silently - notifications are not critical
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // Poll for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [setNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await apiClient.markNotificationRead(id);
      setNotifications(notifications.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsRead();
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'delay': return 'ri-time-line';
      case 'arrival': return 'ri-map-pin-line';
      case 'emergency': return 'ri-alert-line';
      default: return 'ri-information-line';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'delay': return 'text-red-600 bg-red-100';
      case 'arrival': return 'text-blue-600 bg-blue-100';
      case 'emergency': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const displayedNotifications = showAll ? notifications : notifications.slice(0, 3);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {displayedNotifications.length === 0 ? (
          <div className="p-6 text-center">
            <i className="ri-notification-off-line text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${getNotificationColor(notification.type)}`}>
                    <i className={`${getNotificationIcon(notification.type)} text-sm`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full ml-2"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {notification.timestamp.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 3 && (
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap"
          >
            {showAll ? 'Show less' : `View all ${notifications.length} notifications`}
          </button>
        </div>
      )}
    </div>
  );
}
