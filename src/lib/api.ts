/**
 * API Client for Bus Notification System
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'passenger' | 'admin' | 'driver';
  is_active: boolean;
  preferences: UserPreferences;
  created_at: string;
}

export interface UserPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  delay_threshold_minutes: number;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  preferences?: Partial<UserPreferences>;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface Route {
  id: string;
  name: string;
  code: string;
  description?: string;
  stops: string[];
  is_active: boolean;
  distance_km?: number;
  estimated_duration_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface Stop {
  id: string;
  name: string;
  code: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  amenities: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  route_id: string;
  schedule_id: string;
  trip_start_time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'delayed';
  current_position?: TripPosition;
  delay_minutes: number;
  next_stop_id?: string;
  completed_stops: string[];
  created_at: string;
  updated_at: string;
}

export interface TripPosition {
  location: {
    latitude: number;
    longitude: number;
  };
  next_stop_id: string;
  distance_to_next_stop_km: number;
  estimated_arrival: string;
  last_updated: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  route_id: string;
  stop_ids: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'delay' | 'approaching' | 'deviation' | 'emergency' | 'cancellation';
  title: string;
  message: string;
  trip_id?: string;
  route_id?: string;
  stop_id?: string;
  is_read: boolean;
  sent_at?: string;
  delivery_status: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface TripPrediction {
  trip_id: string;
  route_id: string;
  predicted_delay_minutes: number;
  confidence: number;
  next_stop_id: string;
  estimated_arrival: string;
  factors: Record<string, any>;
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage
    this.token = localStorage.getItem('access_token');
    if (this.token) {
      this.setAuthHeader(this.token);
    }

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        console.error('❌ API Response Error:', error);
        
        if (error.response?.status === 401) {
          this.handleUnauthorized();
        } else if (error.response?.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else if (error.response?.data) {
          const errorMessage = (error.response.data as any)?.detail || 'An error occurred';
          toast.error(errorMessage);
        }
        
        return Promise.reject(error);
      }
    );
  }

  private setAuthHeader(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  private removeAuthHeader() {
    delete this.client.defaults.headers.common['Authorization'];
  }

  private handleUnauthorized() {
    this.token = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this.removeAuthHeader();
    
    // Redirect to login
    window.location.href = '/signin';
    toast.error('Session expired. Please login again.');
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>('/auth/login', credentials);
    const { access_token, user } = response.data;
    
    this.token = access_token;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    this.setAuthHeader(access_token);
    
    return response.data;
  }

  async register(userData: RegisterData): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>('/auth/register', userData);
    const { access_token, user } = response.data;
    
    this.token = access_token;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    this.setAuthHeader(access_token);
    
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response.data;
  }

  async refreshToken(): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>('/auth/refresh');
    const { access_token, user } = response.data;
    
    this.token = access_token;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    this.setAuthHeader(access_token);
    
    return response.data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this.removeAuthHeader();
  }

  // Routes methods
  async getRoutes(): Promise<Route[]> {
    const response = await this.client.get<Route[]>('/routes');
    return response.data;
  }

  async getRoute(routeId: string): Promise<Route> {
    const response = await this.client.get<Route>(`/routes/${routeId}`);
    return response.data;
  }

  // Stops methods
  async getStops(): Promise<Stop[]> {
    const response = await this.client.get<Stop[]>('/stops');
    return response.data;
  }

  async getStop(stopId: string): Promise<Stop> {
    const response = await this.client.get<Stop>(`/stops/${stopId}`);
    return response.data;
  }

  async getStopsByRoute(routeId: string): Promise<Stop[]> {
    const response = await this.client.get<Stop[]>(`/routes/${routeId}/stops`);
    return response.data;
  }

  // Trips methods
  async getTrips(routeId?: string): Promise<Trip[]> {
    const url = routeId ? `/trips?route_id=${routeId}` : '/trips';
    const response = await this.client.get<Trip[]>(url);
    return response.data;
  }

  async getTrip(tripId: string): Promise<Trip> {
    const response = await this.client.get<Trip>(`/trips/${tripId}`);
    return response.data;
  }

  async getActiveTrips(): Promise<Trip[]> {
    const response = await this.client.get<Trip[]>('/trips/active');
    return response.data;
  }

  // Subscriptions methods
  async getSubscriptions(): Promise<Subscription[]> {
    const response = await this.client.get<Subscription[]>('/subscriptions');
    return response.data;
  }

  async createSubscription(routeId: string, stopIds: string[] = []): Promise<Subscription> {
    const response = await this.client.post<Subscription>('/subscriptions', {
      route_id: routeId,
      stop_ids: stopIds,
    });
    return response.data;
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    await this.client.delete(`/subscriptions/${subscriptionId}`);
  }

  // Notifications methods
  async getNotifications(): Promise<Notification[]> {
    const response = await this.client.get<Notification[]>('/notifications');
    return response.data;
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await this.client.patch(`/notifications/${notificationId}/read`);
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.client.patch('/notifications/read-all');
  }

  // Predictions methods
  async getTripPredictions(tripId: string): Promise<TripPrediction> {
    const response = await this.client.get<TripPrediction>(`/predictions/trip/${tripId}`);
    return response.data;
  }

  async getRoutePredictions(routeId: string): Promise<TripPrediction[]> {
    const response = await this.client.get<TripPrediction[]>(`/predictions/route/${routeId}`);
    return response.data;
  }

  // Admin - Route Management methods
  async createRoute(routeData: {
    name: string;
    description: string;
    frequency: string;
    operatingHours: string;
    direction: string;
    stops: any[];
    color: string;
    distance?: string;
    duration?: string;
  }): Promise<any> {
    const response = await this.client.post('/admin/routes', routeData);
    return response.data;
  }

  async updateRoute(routeId: string, routeData: {
    name?: string;
    description?: string;
    frequency?: string;
    operatingHours?: string;
    direction?: string;
    stops?: any[];
    color?: string;
    distance?: string;
    duration?: string;
    status?: string;
  }): Promise<any> {
    const response = await this.client.put(`/admin/routes/${routeId}`, routeData);
    return response.data;
  }

  async deleteRoute(routeId: string): Promise<void> {
    await this.client.delete(`/admin/routes/${routeId}`);
  }

  // Admin - Bus Management methods
  async getBuses(): Promise<any[]> {
    const response = await this.client.get('/buses');
    return response.data;
  }

  async getAdminBuses(): Promise<any[]> {
    const response = await this.client.get('/admin/buses');
    return response.data;
  }

  async createBus(busData: {
    route_id: string;
    bus_number: string;
    driver_name: string;
    driver_contact: string;
    capacity?: number;
  }): Promise<any> {
    const response = await this.client.post('/admin/buses', busData);
    return response.data;
  }

  async updateBus(busId: string, busData: {
    route_id?: string;
    bus_number?: string;
    driver_name?: string;
    driver_contact?: string;
    capacity?: number;
    status?: string;
    replacement_buses?: string[];
  }): Promise<any> {
    const response = await this.client.put(`/admin/buses/${busId}`, busData);
    return response.data;
  }

  async deleteBus(busId: string): Promise<void> {
    await this.client.delete(`/admin/buses/${busId}`);
  }

  // Admin - Analytics methods
  async getAnalytics(): Promise<any> {
    const response = await this.client.get('/admin/analytics');
    return response.data;
  }

  async getRouteAnalytics(): Promise<any> {
    const response = await this.client.get('/admin/route-analytics');
    return response.data;
  }

  async getAllUsers(): Promise<any[]> {
    const response = await this.client.get('/admin/users');
    return response.data;
  }

  // Utility method to check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Get current user from localStorage
  getCurrentUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Generic HTTP methods
  async get<T = any>(url: string): Promise<AxiosResponse<T>> {
    return await this.client.get<T>(url);
  }

  async post<T = any>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return await this.client.post<T>(url, data);
  }

  async put<T = any>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return await this.client.put<T>(url, data);
  }

  async delete<T = any>(url: string): Promise<AxiosResponse<T>> {
    return await this.client.delete<T>(url);
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export default
export default apiClient;