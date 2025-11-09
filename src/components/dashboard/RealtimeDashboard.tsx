/**
 * Real-time Dashboard Component
 * 
 * Comprehensive dashboard showing live metrics, alerts, and system status
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Bus, 
  Users, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  MapPin,
  Bell,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { api } from '../../lib/api';
import { BusMap } from '../map/BusMap';
import type { TripUpdate, NotificationAlert, SystemAlert } from '../../types/realtime';

interface DashboardStats {
  total_buses: number;
  active_trips: number;
  total_routes: number;
  on_time_percentage: number;
  average_delay: number;
  total_passengers: number;
  alerts_count: number;
  last_updated: string;
}

interface RoutePerformance {
  route_id: string;
  route_name: string;
  active_buses: number;
  average_delay: number;
  on_time_percentage: number;
  status: 'good' | 'delayed' | 'disrupted';
}

interface RecentAlert {
  id: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  route_id?: string;
}

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  color = 'blue' 
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  trend?: 'up' | 'down' | 'stable';
  color?: 'blue' | 'green' | 'yellow' | 'red';
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600'
  };

  const trendIcons = {
    up: <TrendingUp className="w-4 h-4 text-green-500" />,
    down: <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />,
    stable: <div className="w-4 h-4 border-t-2 border-gray-400" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      <div className={`bg-gradient-to-r ${colorClasses[color]} p-4`}>
        <div className="flex items-center justify-between text-white">
          <Icon className="w-8 h-8" />
          {trend && trendIcons[trend]}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
};

const AlertItem = ({ alert }: { alert: RecentAlert }) => {
  const severityColors = {
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
  };

  const severityIcons = {
    info: <Bell className="w-4 h-4" />,
    warning: <AlertTriangle className="w-4 h-4" />,
    critical: <AlertTriangle className="w-4 h-4" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-3 border rounded-lg ${severityColors[alert.severity]}`}
    >
      <div className="flex items-start gap-3">
        {severityIcons[alert.severity]}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{alert.message}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs opacity-75">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
            {alert.route_id && (
              <span className="text-xs px-2 py-1 bg-white/20 rounded">
                Route {alert.route_id}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const RoutePerformanceCard = ({ route }: { route: RoutePerformance }) => {
  const statusColors = {
    good: 'text-green-600 bg-green-100',
    delayed: 'text-yellow-600 bg-yellow-100',
    disrupted: 'text-red-600 bg-red-100'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">{route.route_name}</h4>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[route.status]}`}>
          {route.status}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Buses</p>
          <p className="font-semibold">{route.active_buses}</p>
        </div>
        <div>
          <p className="text-gray-500">Avg Delay</p>
          <p className="font-semibold">{route.average_delay}m</p>
        </div>
        <div>
          <p className="text-gray-500">On Time</p>
          <p className="font-semibold">{route.on_time_percentage}%</p>
        </div>
      </div>
    </div>
  );
};

export function RealtimeDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [routePerformance, setRoutePerformance] = useState<RoutePerformance[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // WebSocket for real-time updates
  const { isConnected, subscribeToRoute } = useWebSocket({
    url: `${import.meta.env.VITE_API_URL}/socket.io`,
    token: localStorage.getItem('token') || undefined,
    onTripUpdate: (update: TripUpdate) => {
      // Update stats based on trip updates
      loadDashboardStats();
    },
    onNotification: (notification: NotificationAlert) => {
      // Add to recent alerts
      const alert: RecentAlert = {
        id: notification.notification_id,
        type: notification.type,
        message: notification.message,
        severity: notification.priority === 'urgent' ? 'critical' : 
                notification.priority === 'high' ? 'warning' : 'info',
        timestamp: new Date().toISOString(),
        route_id: notification.route_id
      };
      
      setRecentAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
    },
    onSystemAlert: (alert: SystemAlert) => {
      const recentAlert: RecentAlert = {
        id: alert.alert_id,
        type: alert.type,
        message: alert.message,
        severity: alert.severity,
        timestamp: alert.start_time,
        route_id: alert.affected_routes[0]
      };
      
      setRecentAlerts(prev => [recentAlert, ...prev.slice(0, 9)]);
    }
  });

  // Load dashboard data
  const loadDashboardStats = async () => {
    try {
      const [statsResponse, routesResponse] = await Promise.all([
        api.get('/websocket/stats'),
        api.get('/routes')
      ]);

      // Mock stats for demo (replace with real API)
      const mockStats: DashboardStats = {
        total_buses: statsResponse.data.websocket.total_connections || 0,
        active_trips: statsResponse.data.realtime_service?.active_trips || 0,
        total_routes: routesResponse.data.length,
        on_time_percentage: 87.5,
        average_delay: 3.2,
        total_passengers: 1247,
        alerts_count: recentAlerts.length,
        last_updated: new Date().toISOString()
      };

      setStats(mockStats);

      // Mock route performance data
      const mockRoutePerformance: RoutePerformance[] = routesResponse.data.slice(0, 5).map((route: any, index: number) => ({
        route_id: route._id,
        route_name: route.name,
        active_buses: Math.floor(Math.random() * 8) + 2,
        average_delay: Math.random() * 10,
        on_time_percentage: 70 + Math.random() * 30,
        status: index === 0 ? 'disrupted' : index === 1 ? 'delayed' : 'good'
      }));

      setRoutePerformance(mockRoutePerformance);

    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to all routes for updates
  useEffect(() => {
    if (isConnected && routePerformance.length > 0) {
      routePerformance.forEach(route => {
        subscribeToRoute(route.route_id);
      });
    }
  }, [isConnected, routePerformance, subscribeToRoute]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Real-time Dashboard</h1>
          <p className="text-gray-600">Live system monitoring and analytics</p>
        </div>
        
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2 text-green-600">
              <Wifi className="w-5 h-5" />
              <span className="text-sm font-medium">Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <WifiOff className="w-5 h-5" />
              <span className="text-sm font-medium">Disconnected</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Buses"
          value={stats.active_trips}
          subtitle="Currently running"
          icon={Bus}
          color="blue"
          trend="stable"
        />
        
        <StatCard
          title="On Time Performance"
          value={`${stats.on_time_percentage}%`}
          subtitle="Last 24 hours"
          icon={Clock}
          color="green"
          trend="up"
        />
        
        <StatCard
          title="Average Delay"
          value={`${stats.average_delay}m`}
          subtitle="System wide"
          icon={AlertTriangle}
          color={stats.average_delay > 5 ? "red" : "yellow"}
          trend={stats.average_delay > 5 ? "up" : "stable"}
        />
        
        <StatCard
          title="Active Passengers"
          value={stats.total_passengers.toLocaleString()}
          subtitle="Estimated total"
          icon={Users}
          color="blue"
          trend="up"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Live Bus Tracking</h2>
              <p className="text-sm text-gray-600">Real-time positions and status</p>
            </div>
            <BusMap
              selectedRoutes={selectedRoutes}
              height="400px"
              showControls={true}
            />
          </div>
        </div>

        {/* Alerts & Performance */}
        <div className="space-y-6">
          {/* Recent Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
              <p className="text-sm text-gray-600">System notifications</p>
            </div>
            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
              {recentAlerts.length > 0 ? (
                recentAlerts.map(alert => (
                  <AlertItem key={alert.id} alert={alert} />
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No recent alerts
                </p>
              )}
            </div>
          </div>

          {/* Route Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Route Performance</h2>
              <p className="text-sm text-gray-600">Current status</p>
            </div>
            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
              {routePerformance.map(route => (
                <RoutePerformanceCard key={route.route_id} route={route} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Database</p>
              <p className="text-xs text-gray-500">Connected</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Wifi className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">WebSocket</p>
              <p className="text-xs text-gray-500">{isConnected ? 'Active' : 'Disconnected'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Location Services</p>
              <p className="text-xs text-gray-500">Operational</p>
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(stats.last_updated).toLocaleString()}
      </div>
    </div>
  );
}