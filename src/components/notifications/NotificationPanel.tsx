/**
 * Enhanced Notification Panel
 * 
 * Real-time notification management with filtering, actions, and persistent display
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  Check, 
  AlertTriangle, 
  Clock, 
  Bus, 
  Filter,
  Settings,
  Volume2,
  VolumeX,
  Trash2
} from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { api } from '../../lib/api';
import type { NotificationAlert } from '../../types/realtime';

interface Notification extends NotificationAlert {
  id: string;
  read: boolean;
  dismissed: boolean;
  created_at: string;
}

interface NotificationPanelProps {
  userId?: string;
  maxItems?: number;
  showSettings?: boolean;
  onNotificationClick?: (notification: Notification) => void;
}

interface NotificationSettings {
  sound_enabled: boolean;
  auto_dismiss_delay: number;
  filter_types: string[];
  priority_threshold: 'low' | 'normal' | 'high' | 'urgent';
}

const NotificationIcon = ({ type, priority }: { type: string; priority: string }) => {
  const getIcon = () => {
    switch (type) {
      case 'delay':
        return <Clock className="w-4 h-4" />;
      case 'arrival':
        return <Bus className="w-4 h-4" />;
      case 'service_alert':
        return <AlertTriangle className="w-4 h-4" />;
      case 'emergency':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getColor = () => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'normal':
        return 'text-blue-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`p-2 rounded-full bg-white shadow-sm ${getColor()}`}>
      {getIcon()}
    </div>
  );
};

const NotificationItem = ({ 
  notification, 
  onRead, 
  onDismiss, 
  onClick,
  settings 
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onClick?: (notification: Notification) => void;
  settings: NotificationSettings;
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onDismiss(notification.id), 300);
  }, [notification.id, onDismiss]);

  const handleRead = useCallback(() => {
    if (!notification.read) {
      onRead(notification.id);
    }
    onClick?.(notification);
  }, [notification, onRead, onClick]);

  // Auto-dismiss based on settings
  useEffect(() => {
    if (settings.auto_dismiss_delay > 0 && notification.priority !== 'urgent') {
      const timer = setTimeout(handleDismiss, settings.auto_dismiss_delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [notification.priority, settings.auto_dismiss_delay, handleDismiss]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'normal':
        return 'border-blue-500 bg-blue-50';
      case 'low':
        return 'border-gray-500 bg-gray-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.8 }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
          className={`border-l-4 rounded-lg shadow-sm bg-white border-gray-200 hover:shadow-md transition-shadow cursor-pointer ${
            !notification.read ? getPriorityColor(notification.priority) : 'bg-gray-50'
          }`}
          onClick={handleRead}
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              <NotificationIcon type={notification.type} priority={notification.priority} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`text-sm font-medium ${
                    notification.read ? 'text-gray-600' : 'text-gray-900'
                  }`}>
                    {notification.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRead(notification.id);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss();
                      }}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      title="Dismiss"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <p className={`text-sm ${
                  notification.read ? 'text-gray-500' : 'text-gray-700'
                }`}>
                  {notification.message}
                </p>
                
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span>{new Date(notification.created_at).toLocaleTimeString()}</span>
                  
                  {notification.route_id && (
                    <span className="px-2 py-1 bg-gray-200 rounded">
                      Route {notification.route_id}
                    </span>
                  )}
                  
                  <span className={`px-2 py-1 rounded ${
                    notification.priority === 'urgent' ? 'bg-red-200 text-red-800' :
                    notification.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                    notification.priority === 'normal' ? 'bg-blue-200 text-blue-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {notification.priority}
                  </span>
                </div>
                
                {notification.action_url && (
                  <div className="mt-2">
                    <a
                      href={notification.action_url}
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Details
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export function NotificationPanel({ 
  userId, 
  maxItems = 10, 
  showSettings = true,
  onNotificationClick 
}: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    sound_enabled: true,
    auto_dismiss_delay: 10,
    filter_types: [],
    priority_threshold: 'low'
  });
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  // WebSocket for real-time notifications
  const { isConnected, joinUserRoom } = useWebSocket({
    url: `${import.meta.env.VITE_API_URL}/socket.io`,
    token: localStorage.getItem('token') || undefined,
    onNotification: (notification: NotificationAlert) => {
      // Check if notification meets priority threshold
      const priorities = ['low', 'normal', 'high', 'urgent'];
      const notificationPriorityIndex = priorities.indexOf(notification.priority);
      const thresholdIndex = priorities.indexOf(settings.priority_threshold);
      
      if (notificationPriorityIndex < thresholdIndex) {
        return; // Skip notifications below threshold
      }

      // Check type filter
      if (settings.filter_types.length > 0 && !settings.filter_types.includes(notification.type)) {
        return;
      }

      const newNotification: Notification = {
        ...notification,
        id: notification.notification_id,
        read: false,
        dismissed: false,
        created_at: new Date().toISOString()
      };

      setNotifications(prev => [newNotification, ...prev.slice(0, maxItems - 1)]);

      // Play notification sound
      if (settings.sound_enabled) {
        playNotificationSound(notification.priority);
      }
    }
  });

  // Play notification sound
  const playNotificationSound = useCallback((priority: string) => {
    if (!settings.sound_enabled) return;

    const audio = new Audio();
    
    switch (priority) {
      case 'urgent':
        audio.src = '/sounds/urgent-notification.mp3';
        break;
      case 'high':
        audio.src = '/sounds/high-notification.mp3';
        break;
      default:
        audio.src = '/sounds/default-notification.mp3';
        break;
    }

    audio.play().catch(console.error);
  }, [settings.sound_enabled]);

  // Load existing notifications
  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications', {
        params: { limit: maxItems }
      });
      
      const notificationsData = response.data.map((notif: any) => ({
        id: notif._id,
        user_id: notif.user_id,
        notification_id: notif._id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        priority: notif.priority || 'normal',
        route_id: notif.route_id,
        trip_id: notif.trip_id,
        stop_id: notif.stop_id,
        action_url: notif.action_url,
        expires_at: notif.expires_at,
        read: notif.read || false,
        dismissed: false,
        created_at: notif.created_at
      }));

      setNotifications(notificationsData);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  // Load settings
  const loadSettings = useCallback(() => {
    const savedSettings = localStorage.getItem('notification_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings
  const saveSettings = useCallback((newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem('notification_settings', JSON.stringify(newSettings));
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Dismiss notification
  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    );
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      await Promise.all(
        unreadIds.map(id => api.patch(`/notifications/${id}/read`))
      );

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [notifications]);

  useEffect(() => {
    loadNotifications();
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (isConnected && userId) {
      joinUserRoom(userId);
    }
  }, [isConnected, userId, joinUserRoom]);

  const filteredNotifications = notifications.filter(notification => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !notification.read;
    return notification.type === filterType;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="w-5 h-5 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="delay">Delays</option>
              <option value="arrival">Arrivals</option>
              <option value="service_alert">Service Alerts</option>
              <option value="emergency">Emergency</option>
            </select>

            {/* Actions */}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
                title="Mark all as read"
              >
                <Check className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={clearAllNotifications}
              className="text-sm text-gray-600 hover:text-gray-800"
              title="Clear all"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {showSettings && (
              <button
                onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                className="text-sm text-gray-600 hover:text-gray-800"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Connection Status */}
        <div className={`flex items-center gap-2 mt-2 text-xs ${
          isConnected ? 'text-green-600' : 'text-red-600'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          {isConnected ? 'Real-time updates active' : 'Connection lost'}
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettingsPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200 p-4 bg-gray-50"
          >
            <h3 className="text-sm font-medium text-gray-900 mb-3">Notification Settings</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Sound notifications</label>
                <button
                  onClick={() => saveSettings({ ...settings, sound_enabled: !settings.sound_enabled })}
                  className={`p-1 rounded ${settings.sound_enabled ? 'text-blue-600' : 'text-gray-400'}`}
                >
                  {settings.sound_enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Auto-dismiss delay (seconds)</label>
                <select
                  value={settings.auto_dismiss_delay}
                  onChange={(e) => saveSettings({ ...settings, auto_dismiss_delay: parseInt(e.target.value) })}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value={0}>Never</option>
                  <option value={5}>5 seconds</option>
                  <option value={10}>10 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Minimum priority</label>
                <select
                  value={settings.priority_threshold}
                  onChange={(e) => saveSettings({ ...settings, priority_threshold: e.target.value as any })}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent only</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length > 0 ? (
          <div className="p-4 space-y-3">
            {filteredNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={markAsRead}
                onDismiss={dismissNotification}
                onClick={onNotificationClick}
                settings={settings}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No notifications</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}