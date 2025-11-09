/**
 * Admin Dashboard Component
 * 
 * Comprehensive admin interface for system management, analytics, and control
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Users,
  RouteIcon,
  BarChart3,
  AlertTriangle,
  PlayCircle,
  StopCircle,
  RefreshCw,
  Download,
  Upload,
  Shield,
  Database,
  Wifi,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import api from '../../lib/api';
import { BusMap } from '../map/BusMap';
import { NotificationPanel } from '../notifications/NotificationPanel';

interface SystemMetrics {
  total_users: number;
  active_users_24h: number;
  total_routes: number;
  active_routes: number;
  total_trips_today: number;
  system_uptime: number;
  database_health: 'healthy' | 'warning' | 'critical';
  api_response_time: number;
  websocket_connections: number;
  memory_usage: number;
  cpu_usage: number;
}

interface RouteAnalytics {
  route_id: string;
  route_name: string;
  total_trips: number;
  avg_delay: number;
  on_time_percentage: number;
  passenger_count: number;
  revenue: number;
  status: 'active' | 'suspended' | 'maintenance';
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
}

const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'blue',
  loading = false 
}: {
  title: string;
  value: string | number;
  change?: { value: number; type: 'increase' | 'decrease' };
  icon: any;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  loading?: boolean;
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className={`bg-gradient-to-r ${colorClasses[color]} p-4`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <div className="p-4">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {change && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${
                change.type === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {change.type === 'increase' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{Math.abs(change.value)}% from yesterday</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const RouteAnalyticsCard = ({ route }: { route: RouteAnalytics }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">{route.route_name}</h4>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(route.status)}`}>
          {route.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Trips Today</p>
          <p className="font-semibold">{route.total_trips}</p>
        </div>
        <div>
          <p className="text-gray-500">Avg Delay</p>
          <p className="font-semibold">{route.avg_delay.toFixed(1)}m</p>
        </div>
        <div>
          <p className="text-gray-500">On Time</p>
          <p className={`font-semibold ${getPerformanceColor(route.on_time_percentage)}`}>
            {route.on_time_percentage.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-gray-500">Passengers</p>
          <p className="font-semibold">{route.passenger_count.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

const SystemAlertItem = ({ alert, onResolve }: { alert: SystemAlert; onResolve: (id: string) => void }) => {
  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'info':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  return (
    <div className={`border rounded-lg p-3 ${getAlertColor(alert.type)}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium">{alert.message}</p>
          <p className="text-xs opacity-75 mt-1">
            {new Date(alert.timestamp).toLocaleString()}
          </p>
        </div>
        {!alert.resolved && (
          <button
            onClick={() => onResolve(alert.id)}
            className="ml-2 text-xs px-2 py-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
          >
            Resolve
          </button>
        )}
      </div>
    </div>
  );
};

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [routeAnalytics, setRouteAnalytics] = useState<RouteAnalytics[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  // WebSocket for real-time admin updates
  const { isConnected } = useWebSocket({
    url: `${import.meta.env.VITE_API_URL}/socket.io`,
    token: localStorage.getItem('token') || undefined,
    onSystemAlert: (alert) => {
      const newAlert: SystemAlert = {
        id: alert.alert_id,
        type: alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info',
        message: alert.message,
        timestamp: alert.start_time,
        resolved: false
      };
      setSystemAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
    }
  });

  // Load admin dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load system metrics - using available API methods
      const [routesResponse] = await Promise.all([
        api.getRoutes()
      ]);

      // Mock system metrics (replace with real API data when endpoints are available)
      const mockMetrics: SystemMetrics = {
        total_users: 1247, // This would come from admin API when available
        active_users_24h: 374,
        total_routes: routesResponse.length,
        active_routes: routesResponse.filter((r: any) => r.status === 'active').length,
        total_trips_today: 342,
        system_uptime: 99.8,
        database_health: 'healthy',
        api_response_time: 120,
        websocket_connections: 45, // This would come from WebSocket stats API
        memory_usage: 68.5,
        cpu_usage: 23.1
      };

      setMetrics(mockMetrics);

      // Mock route analytics
      const mockRouteAnalytics: RouteAnalytics[] = routesResponse.slice(0, 6).map((route: any, index: number) => ({
        route_id: route._id,
        route_name: route.name,
        total_trips: 15 + Math.floor(Math.random() * 25),
        avg_delay: Math.random() * 8,
        on_time_percentage: 75 + Math.random() * 25,
        passenger_count: 100 + Math.floor(Math.random() * 300),
        revenue: 1500 + Math.floor(Math.random() * 2000),
        status: index === 0 ? 'maintenance' : index === 1 ? 'suspended' : 'active'
      }));

      setRouteAnalytics(mockRouteAnalytics);

      // Mock system alerts
      const mockAlerts: SystemAlert[] = [
        {
          id: '1',
          type: 'warning',
          message: 'High memory usage detected on server cluster',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          resolved: false
        },
        {
          id: '2',
          type: 'info',
          message: 'Scheduled maintenance completed successfully',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          resolved: true
        }
      ];

      setSystemAlerts(mockAlerts);

    } catch (error) {
      console.error('Failed to load admin dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // System control actions
  const handleSystemAction = async (action: string) => {
    try {
      switch (action) {
        case 'refresh_data':
          await loadDashboardData();
          break;
        case 'restart_services':
          // Mock restart action
          console.log('Restarting services...');
          break;
        case 'export_data':
          // Mock export action
          console.log('Exporting data...');
          break;
        case 'backup_database':
          // Mock backup action
          console.log('Creating database backup...');
          break;
      }
    } catch (error) {
      console.error(`Failed to execute ${action}:`, error);
    }
  };

  // Resolve system alert
  const resolveAlert = (alertId: string) => {
    setSystemAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );
  };

  useEffect(() => {
    loadDashboardData();
    
    // Refresh every minute
    const interval = setInterval(loadDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'routes', label: 'Routes', icon: RouteIcon },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'system', label: 'System', icon: Settings },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle }
  ];

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading admin dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">System management and analytics</p>
        </div>
        
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          
          <button
            onClick={() => handleSystemAction('refresh_data')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={metrics.total_users.toLocaleString()}
          change={{ value: 5.2, type: 'increase' }}
          icon={Users}
          color="blue"
        />
        
        <MetricCard
          title="Active Routes"
          value={`${metrics.active_routes}/${metrics.total_routes}`}
          icon={RouteIcon}
          color="green"
        />
        
        <MetricCard
          title="System Uptime"
          value={`${metrics.system_uptime}%`}
          change={{ value: 0.1, type: 'increase' }}
          icon={Activity}
          color="purple"
        />
        
        <MetricCard
          title="WebSocket Connections"
          value={metrics.websocket_connections}
          icon={Wifi}
          color="yellow"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              {tab.id === 'alerts' && systemAlerts.filter(a => !a.resolved).length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {systemAlerts.filter(a => !a.resolved).length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Metrics */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">CPU Usage</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${metrics.cpu_usage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{metrics.cpu_usage}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Memory Usage</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${metrics.memory_usage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{metrics.memory_usage}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Map */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Live System Map</h2>
                </div>
                <BusMap height="300px" showControls={false} />
              </div>
            </div>

            {/* System Alerts */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">System Alerts</h2>
                </div>
                <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                  {systemAlerts.filter(alert => !alert.resolved).map(alert => (
                    <SystemAlertItem
                      key={alert.id}
                      alert={alert}
                      onResolve={resolveAlert}
                    />
                  ))}
                  {systemAlerts.filter(alert => !alert.resolved).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No active alerts
                    </p>
                  )}
                </div>
              </div>

              <NotificationPanel userId="admin" maxItems={5} showSettings={false} />
            </div>
          </div>
        )}

        {selectedTab === 'routes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {routeAnalytics.map(route => (
              <RouteAnalyticsCard key={route.route_id} route={route} />
            ))}
          </div>
        )}

        {selectedTab === 'system' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">System Controls</h2>
              <div className="space-y-3">
                <button
                  onClick={() => handleSystemAction('restart_services')}
                  className="w-full flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-5 h-5 text-gray-600" />
                  <span>Restart Services</span>
                </button>
                
                <button
                  onClick={() => handleSystemAction('export_data')}
                  className="w-full flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-5 h-5 text-gray-600" />
                  <span>Export System Data</span>
                </button>
                
                <button
                  onClick={() => handleSystemAction('backup_database')}
                  className="w-full flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Database className="w-5 h-5 text-gray-600" />
                  <span>Backup Database</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Database Health</h2>
              <div className="space-y-4">
                <div className={`p-3 rounded-lg ${
                  metrics.database_health === 'healthy' ? 'bg-green-100 text-green-800' :
                  metrics.database_health === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    <span className="font-medium">Status: {metrics.database_health}</span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>Response Time: {metrics.api_response_time}ms</p>
                  <p>Active Connections: {metrics.websocket_connections}</p>
                  <p>Uptime: {metrics.system_uptime}%</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}