/**
 * TypeScript types for real-time WebSocket communication
 */

export interface BusLocation {
  trip_id: string;
  vehicle_id?: string;
  location: {
    lat: number;
    lng: number;
  };
  heading?: number;
  speed?: number;
  timestamp: string;
}

export interface TripUpdate {
  trip_id: string;
  route_id: string;
  current_stop_id?: string;
  next_stop_id?: string;
  current_location?: {
    lat: number;
    lng: number;
  };
  speed?: number;
  heading?: number;
  delay_minutes?: number;
  predicted_delay_minutes?: number;
  status: 'active' | 'delayed' | 'completed' | 'cancelled';
  passengers_count?: number;
  last_updated: string;
}

export interface NotificationAlert {
  user_id: string;
  notification_id: string;
  title: string;
  message: string;
  type: 'delay' | 'arrival' | 'service_alert' | 'emergency';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  route_id?: string;
  trip_id?: string;
  stop_id?: string;
  action_url?: string;
  expires_at?: string;
}

export interface RouteStatus {
  route_id: string;
  status: 'active' | 'disrupted' | 'suspended';
  active_trips: number;
  average_delay?: number;
  service_alerts: string[];
  last_updated: string;
}

export interface SystemAlert {
  alert_id: string;
  type: 'maintenance' | 'emergency' | 'weather';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  affected_routes: string[];
  start_time: string;
  end_time?: string;
  auto_dismiss: boolean;
}

export interface ConnectionStatus {
  connected: boolean;
  authenticated: boolean;
  user_id?: string;
  connected_at: string;
  subscribed_routes: string[];
  subscribed_trips: string[];
}

export interface SubscriptionRequest {
  type: 'route' | 'trip' | 'user';
  target_id: string;
  filters?: Record<string, any>;
}

export interface SubscriptionResponse {
  type: string;
  target_id: string;
  status: 'confirmed' | 'denied';
  message?: string;
  timestamp: string;
}

export interface StopArrival {
  trip_id: string;
  stop_id: string;
  scheduled_time: string;
  predicted_time: string;
  delay_minutes: number;
  confidence: number;
  last_updated: string;
}

export interface ServiceAlert {
  alert_id: string;
  type: 'delay' | 'cancellation' | 'detour' | 'weather';
  severity: 'minor' | 'major' | 'severe';
  title: string;
  description: string;
  affected_routes: string[];
  affected_stops: string[];
  start_time: string;
  end_time?: string;
  url?: string;
}

export interface WebSocketStats {
  total_connections: number;
  authenticated_connections: number;
  anonymous_connections: number;
  unique_users: number;
  route_subscriptions: number;
  trip_subscriptions: number;
  uptime_seconds: number;
  timestamp: string;
}

export interface WebSocketMessage {
  type: string;
  data: Record<string, any>;
  timestamp: string;
}