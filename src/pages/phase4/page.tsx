/**
 * Phase 4 Dashboard
 * Advanced AI-powered system with multi-modal integration
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  BarChart3, 
  Zap, 
  Navigation,
  Bell,
  Users,
  MapPin,
  TrendingUp,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Globe,
  Database
} from 'lucide-react';

// Import Phase 4 components
import AIPredictionEngine from '../../components/ai/AIPredictionEngine';
import ExternalIntegrationsManager from '../../components/integrations/ExternalIntegrationsManager';
import MultiModalTransportationPlanner from '../../components/planning/MultiModalTransportationPlanner';

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  ai: 'healthy' | 'warning' | 'offline';
  integrations: 'healthy' | 'warning' | 'offline';
  planning: 'healthy' | 'warning' | 'offline';
  lastCheck: Date;
}

interface QuickStats {
  totalUsers: number;
  activeTrips: number;
  aiPredictions: number;
  systemUptime: number;
  avgAccuracy: number;
  dataPoints: number;
}

interface RecentActivity {
  id: string;
  type: 'prediction' | 'integration' | 'journey' | 'alert';
  message: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
}

export default function Phase4Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'integrations' | 'planning'>('overview');
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    overall: 'healthy',
    ai: 'healthy',
    integrations: 'healthy',
    planning: 'healthy',
    lastCheck: new Date()
  });
  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalUsers: 12847,
    activeTrips: 234,
    aiPredictions: 2847,
    systemUptime: 99.7,
    avgAccuracy: 96.1,
    dataPoints: 1250000
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [notifications] = useState<number>(3);

  useEffect(() => {
    // Initialize dashboard data
    fetchSystemHealth();
    fetchQuickStats();
    fetchRecentActivity();

    // Set up real-time updates
    const interval = setInterval(() => {
      fetchSystemHealth();
      fetchQuickStats();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      // Mock system health check
      const health: SystemHealth = {
        overall: 'healthy',
        ai: Math.random() > 0.1 ? 'healthy' : 'warning',
        integrations: Math.random() > 0.2 ? 'healthy' : 'warning',
        planning: 'healthy',
        lastCheck: new Date()
      };

      // Determine overall health
      const services = [health.ai, health.integrations, health.planning];
      const warningCount = services.filter(s => s === 'warning').length;
      const offlineCount = services.filter(s => s === 'offline').length;

      if (offlineCount > 0) {
        health.overall = 'critical';
      } else if (warningCount > 1) {
        health.overall = 'warning';
      }

      setSystemHealth(health);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    }
  };

  const fetchQuickStats = async () => {
    try {
      // Mock real-time stats with slight variations
      setQuickStats(prev => ({
        totalUsers: prev.totalUsers + Math.floor(Math.random() * 5),
        activeTrips: 200 + Math.floor(Math.random() * 100),
        aiPredictions: prev.aiPredictions + Math.floor(Math.random() * 20),
        systemUptime: 99.5 + Math.random() * 0.5,
        avgAccuracy: 95 + Math.random() * 2,
        dataPoints: prev.dataPoints + Math.floor(Math.random() * 1000)
      }));
    } catch (error) {
      console.error('Failed to fetch quick stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const activities: RecentActivity[] = [
        {
          id: '1',
          type: 'prediction',
          message: 'AI model accuracy improved to 96.3% after training update',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          severity: 'info'
        },
        {
          id: '2',
          type: 'integration',
          message: 'Weather API integration showing minor delays',
          timestamp: new Date(Date.now() - 12 * 60 * 1000),
          severity: 'warning'
        },
        {
          id: '3',
          type: 'journey',
          message: 'Multi-modal planner processed 1,247 routes in the last hour',
          timestamp: new Date(Date.now() - 18 * 60 * 1000),
          severity: 'info'
        },
        {
          id: '4',
          type: 'alert',
          message: 'Traffic integration detected major incident on Route 42',
          timestamp: new Date(Date.now() - 25 * 60 * 1000),
          severity: 'critical'
        },
        {
          id: '5',
          type: 'prediction',
          message: 'Neural network model retrained with 50K new data points',
          timestamp: new Date(Date.now() - 35 * 60 * 1000),
          severity: 'info'
        }
      ];
      setRecentActivity(activities);
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical': case 'offline': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Wifi className="w-5 h-5 text-gray-500" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': case 'offline': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'prediction': return <Brain className="w-4 h-4 text-blue-500" />;
      case 'integration': return <Zap className="w-4 h-4 text-purple-500" />;
      case 'journey': return <Navigation className="w-4 h-4 text-green-500" />;
      case 'alert': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500';
      case 'warning': return 'border-l-yellow-500';
      case 'info': return 'border-l-blue-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Brain className="w-8 h-8 text-blue-600" />
                Phase 4: Advanced AI Transit System
              </h1>
              <p className="text-gray-600 mt-2">
                AI-powered predictions, analytics, integrations, and multi-modal planning
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* System Health Indicator */}
              <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${getHealthColor(systemHealth.overall)}`}>
                {getHealthIcon(systemHealth.overall)}
                <span className="font-medium capitalize">System {systemHealth.overall}</span>
              </div>
              
              {/* Notifications */}
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-600" />
                {notifications > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'System Overview', icon: BarChart3 },
                { id: 'ai', label: 'AI Prediction Engine', icon: Brain },
                { id: 'integrations', label: 'External Integrations', icon: Zap },
                { id: 'planning', label: 'Multi-Modal Planning', icon: Navigation }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{quickStats.totalUsers.toLocaleString()}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Trips</p>
                      <p className="text-2xl font-bold text-gray-900">{quickStats.activeTrips}</p>
                    </div>
                    <MapPin className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">AI Predictions</p>
                      <p className="text-2xl font-bold text-gray-900">{quickStats.aiPredictions.toLocaleString()}</p>
                    </div>
                    <Brain className="w-8 h-8 text-purple-600" />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">System Uptime</p>
                      <p className="text-2xl font-bold text-gray-900">{quickStats.systemUptime.toFixed(1)}%</p>
                    </div>
                    <Wifi className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Accuracy</p>
                      <p className="text-2xl font-bold text-gray-900">{quickStats.avgAccuracy.toFixed(1)}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Data Points</p>
                      <p className="text-2xl font-bold text-gray-900">{(quickStats.dataPoints / 1000000).toFixed(1)}M</p>
                    </div>
                    <Database className="w-8 h-8 text-indigo-600" />
                  </div>
                </div>
              </div>

              {/* System Health Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health Status</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Brain className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">AI Prediction Engine</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(systemHealth.ai)}`}>
                        {systemHealth.ai}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 text-purple-600" />
                        <span className="font-medium">External Integrations</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(systemHealth.integrations)}`}>
                        {systemHealth.integrations}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Navigation className="w-5 h-5 text-orange-600" />
                        <span className="font-medium">Multi-Modal Planner</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(systemHealth.planning)}`}>
                        {systemHealth.planning}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Last health check: {systemHealth.lastCheck.toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className={`border-l-4 pl-4 py-2 ${getSeverityColor(activity.severity)}`}>
                        <div className="flex items-start gap-3">
                          {getActivityIcon(activity.type)}
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {activity.timestamp.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Phase 4 Features Overview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Phase 4 Advanced Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-8 h-8 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">AI Prediction Engine</h4>
                    <p className="text-sm text-gray-600">
                      Advanced machine learning with real-time model training and ensemble predictions
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Business Intelligence</h4>
                    <p className="text-sm text-gray-600">
                      Comprehensive analytics with predictive insights and automated reporting
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Globe className="w-8 h-8 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">External Integrations</h4>
                    <p className="text-sm text-gray-600">
                      Real-time weather, traffic, events, and GTFS feed integration for enhanced predictions
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Navigation className="w-8 h-8 text-orange-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Multi-Modal Planning</h4>
                    <p className="text-sm text-gray-600">
                      Unified journey planning across buses, trains, bikes, walking, and rideshare
                    </p>
                  </div>
                </div>
              </div>

              {/* Capabilities Matrix */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">System Capabilities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      Mobile & Web
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Progressive Web App (PWA)</li>
                      <li>• Offline functionality</li>
                      <li>• Push notifications</li>
                      <li>• Real-time updates</li>
                      <li>• Cross-platform support</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      AI & Machine Learning
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Neural network predictions</li>
                      <li>• Ensemble model methods</li>
                      <li>• Real-time model training</li>
                      <li>• Feature importance analysis</li>
                      <li>• Confidence scoring</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Data Integration
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Weather API integration</li>
                      <li>• Traffic data feeds</li>
                      <li>• Event management APIs</li>
                      <li>• GTFS real-time feeds</li>
                      <li>• Social media monitoring</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AIPredictionEngine />
            </motion.div>
          )}

          {activeTab === 'integrations' && (
            <motion.div
              key="integrations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ExternalIntegrationsManager />
            </motion.div>
          )}

          {activeTab === 'planning' && (
            <motion.div
              key="planning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <MultiModalTransportationPlanner />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}