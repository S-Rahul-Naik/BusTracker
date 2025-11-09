/**
 * WebSocket Client for Real-time Updates
 */

import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { Trip, Notification } from './api';

// WebSocket Events
export interface TripUpdateEvent {
  trip_id: string;
  route_id: string;
  current_position?: {
    location: {
      latitude: number;
      longitude: number;
    };
    next_stop_id: string;
    distance_to_next_stop_km: number;
    estimated_arrival: string;
    last_updated: string;
  };
  delay_minutes: number;
  next_stop_id?: string;
  estimated_arrivals: Record<string, string>;
}

export interface NotificationEvent {
  user_id: string;
  notification: Notification;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

// Event handlers type
export type EventHandlers = {
  trip_update?: (data: TripUpdateEvent) => void;
  notification?: (data: NotificationEvent) => void;
  route_status?: (data: any) => void;
  system_alert?: (data: any) => void;
  connection_status?: (connected: boolean) => void;
};

class WebSocketClient {
  private socket: Socket | null = null;
  private handlers: EventHandlers = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnecting = false;

  constructor() {
    this.connect();
  }

  connect() {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      return;
    }

    this.isConnecting = true;
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    const token = localStorage.getItem('access_token');

    console.log('🔌 Connecting to WebSocket:', wsUrl);

    this.socket = io(wsUrl, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      timeout: 20000,
      forceNew: true,
    });

    this.setupEventListeners();
    this.isConnecting = false;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.handlers.connection_status?.(true);
      
      // Subscribe to user-specific events if authenticated
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        this.socket?.emit('join_user_room', { user_id: userData.id });
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.handlers.connection_status?.(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.scheduleReconnect();
    });

    // Custom events
    this.socket.on('trip_update', (data: TripUpdateEvent) => {
      console.log('🚌 Trip update received:', data);
      this.handlers.trip_update?.(data);
    });

    this.socket.on('notification', (data: NotificationEvent) => {
      console.log('🔔 Notification received:', data);
      this.handlers.notification?.(data);
      
      // Show toast notification
      const { notification } = data;
      const toastMessage = `${notification.title}: ${notification.message}`;
      
      switch (notification.type) {
        case 'delay':
          toast.error(toastMessage, { duration: 6000 });
          break;
        case 'emergency':
          toast.error(toastMessage, { duration: 8000 });
          break;
        case 'approaching':
          toast.success(toastMessage, { duration: 4000 });
          break;
        default:
          toast(toastMessage, { duration: 5000 });
      }
    });

    this.socket.on('route_status', (data: any) => {
      console.log('🛣️ Route status update:', data);
      this.handlers.route_status?.(data);
    });

    this.socket.on('system_alert', (data: any) => {
      console.log('⚠️ System alert:', data);
      this.handlers.system_alert?.(data);
      toast.error(data.message, { duration: 8000 });
    });

    // Pong response
    this.socket.on('pong', () => {
      console.log('🏓 Pong received');
    });
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      toast.error('Connection lost. Please refresh the page.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (this.socket) {
        this.socket.disconnect();
      }
      this.connect();
    }, delay);
  }

  // Public methods
  on<K extends keyof EventHandlers>(event: K, handler: EventHandlers[K]) {
    this.handlers[event] = handler;
  }

  off<K extends keyof EventHandlers>(event: K) {
    delete this.handlers[event];
  }

  subscribeToRoute(routeId: string) {
    if (this.socket && this.socket.connected) {
      console.log('📍 Subscribing to route:', routeId);
      this.socket.emit('subscribe_route', { route_id: routeId });
    }
  }

  unsubscribeFromRoute(routeId: string) {
    if (this.socket && this.socket.connected) {
      console.log('📍 Unsubscribing from route:', routeId);
      this.socket.emit('unsubscribe_route', { route_id: routeId });
    }
  }

  subscribeToTrip(tripId: string) {
    if (this.socket && this.socket.connected) {
      console.log('🚌 Subscribing to trip:', tripId);
      this.socket.emit('subscribe_trip', { trip_id: tripId });
    }
  }

  unsubscribeFromTrip(tripId: string) {
    if (this.socket && this.socket.connected) {
      console.log('🚌 Unsubscribing from trip:', tripId);
      this.socket.emit('unsubscribe_trip', { trip_id: tripId });
    }
  }

  ping() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('ping');
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket');
      this.socket.disconnect();
      this.socket = null;
    }
    this.handlers = {};
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Reconnect manually
  reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }
}

// Create and export singleton instance
export const wsClient = new WebSocketClient();

export default wsClient;