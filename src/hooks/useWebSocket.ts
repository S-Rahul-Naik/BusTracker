/**
 * React Hook for WebSocket Real-time Communication
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import type { TripUpdate, NotificationAlert, RouteStatus, SystemAlert } from '../types/realtime';

export interface UseWebSocketOptions {
  url: string;
  token?: string;
  autoConnect?: boolean;
  onTripUpdate?: (update: TripUpdate) => void;
  onNotification?: (notification: NotificationAlert) => void;
  onRouteStatus?: (status: RouteStatus) => void;
  onSystemAlert?: (alert: SystemAlert) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: any) => void;
}

export interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  subscribeToRoute: (routeId: string) => void;
  unsubscribeFromRoute: (routeId: string) => void;
  subscribeToTrip: (tripId: string) => void;
  unsubscribeFromTrip: (tripId: string) => void;
  joinUserRoom: (userId: string) => void;
  subscribedRoutes: string[];
  subscribedTrips: string[];
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [subscribedRoutes, setSubscribedRoutes] = useState<string[]>([]);
  const [subscribedTrips, setSubscribedTrips] = useState<string[]>([]);
  
  const socketRef = useRef<Socket | null>(null);
  const {
    url,
    token,
    autoConnect = true,
    onTripUpdate,
    onNotification,
    onRouteStatus,
    onSystemAlert,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.warn('WebSocket already connected');
      return;
    }

    const auth: any = {};
    if (token) {
      auth.token = token;
    }

    const socket = io(url, {
      auth,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Connection events
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      onConnect?.();
      toast.success('Connected to real-time updates');
    });

    socket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      setSubscribedRoutes([]);
      setSubscribedTrips([]);
      onDisconnect?.(reason);
      
      if (reason !== 'io client disconnect') {
        toast.error('Lost connection to real-time updates');
      }
    });

    // Connection status
    socket.on('connection_status', (status: any) => {
      console.log('Connection status:', status);
    });

    // Trip updates
    socket.on('trip_update', (update: TripUpdate) => {
      console.log('Trip update received:', update);
      onTripUpdate?.(update);
    });

    // Notifications
    socket.on('notification', (notification: NotificationAlert) => {
      console.log('Notification received:', notification);
      onNotification?.(notification);
      
      // Show toast notification
      if (notification.priority === 'urgent' || notification.priority === 'high') {
        toast.error(notification.message, {
          duration: 10000
        });
      } else {
        toast(notification.message, {
          duration: 5000
        });
      }
    });

    // System alerts
    socket.on('system_alert', (alert: SystemAlert) => {
      console.log('System alert received:', alert);
      onSystemAlert?.(alert);
      
      if (alert.severity === 'critical') {
        toast.error(alert.message, {
          duration: 15000
        });
      } else if (alert.severity === 'warning') {
        toast.error(alert.message, {
          duration: 8000
        });
      } else {
        toast(alert.message, {
          duration: 8000
        });
      }
    });

    // Route status
    socket.on('route_status', (status: RouteStatus) => {
      console.log('Route status received:', status);
      onRouteStatus?.(status);
    });

    // Subscription confirmations
    socket.on('subscription_confirmed', (data: any) => {
      console.log('Subscription confirmed:', data);
      
      if (data.type === 'route') {
        setSubscribedRoutes(prev => [...prev.filter(id => id !== data.id), data.id]);
        toast.success(`Subscribed to route updates`);
      } else if (data.type === 'trip') {
        setSubscribedTrips(prev => [...prev.filter(id => id !== data.id), data.id]);
        toast.success(`Subscribed to trip updates`);
      }
    });

    socket.on('subscription_cancelled', (data: any) => {
      console.log('Subscription cancelled:', data);
      
      if (data.type === 'route') {
        setSubscribedRoutes(prev => prev.filter(id => id !== data.id));
      } else if (data.type === 'trip') {
        setSubscribedTrips(prev => prev.filter(id => id !== data.id));
      }
    });

    // Error handling
    socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
      onError?.(error);
      toast.error('WebSocket connection error');
    });

    socketRef.current = socket;
  }, [url, token, onTripUpdate, onNotification, onRouteStatus, onSystemAlert, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setSubscribedRoutes([]);
      setSubscribedTrips([]);
    }
  }, []);

  const subscribeToRoute = useCallback((routeId: string) => {
    if (!socketRef.current || !isConnected) {
      console.warn('WebSocket not connected');
      return;
    }

    socketRef.current.emit('subscribe_route', { route_id: routeId });
  }, [isConnected]);

  const unsubscribeFromRoute = useCallback((routeId: string) => {
    if (!socketRef.current || !isConnected) {
      return;
    }

    socketRef.current.emit('unsubscribe_route', { route_id: routeId });
  }, [isConnected]);

  const subscribeToTrip = useCallback((tripId: string) => {
    if (!socketRef.current || !isConnected) {
      console.warn('WebSocket not connected');
      return;
    }

    socketRef.current.emit('subscribe_trip', { trip_id: tripId });
  }, [isConnected]);

  const unsubscribeFromTrip = useCallback((tripId: string) => {
    if (!socketRef.current || !isConnected) {
      return;
    }

    socketRef.current.emit('unsubscribe_trip', { trip_id: tripId });
  }, [isConnected]);

  const joinUserRoom = useCallback((userId: string) => {
    if (!socketRef.current || !isConnected) {
      console.warn('WebSocket not connected');
      return;
    }

    socketRef.current.emit('join_user_room', { user_id: userId });
  }, [isConnected]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Reconnect when token changes
  useEffect(() => {
    if (socketRef.current && isConnected && token) {
      disconnect();
      setTimeout(connect, 100); // Small delay to ensure clean disconnect
    }
  }, [token, connect, disconnect, isConnected]);

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
    subscribeToRoute,
    unsubscribeFromRoute,
    subscribeToTrip,
    unsubscribeFromTrip,
    joinUserRoom,
    subscribedRoutes,
    subscribedTrips
  };
}