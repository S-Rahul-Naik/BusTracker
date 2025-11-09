/**
 * External Integrations Manager
 * Phase 4: Real-time data integration with external APIs
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud, 
  Car, 
  Calendar, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  AlertTriangle, 
  Settings, 
  RefreshCw,
  MapPin,
  Clock,
  Thermometer,
  Wind,
  Droplets,
  Construction,
  Users,
  Zap
} from 'lucide-react';

interface WeatherIntegration {
  provider: 'openweather' | 'weatherapi' | 'accuweather';
  status: 'connected' | 'disconnected' | 'error';
  lastUpdate: Date;
  data: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    visibility: number;
    condition: string;
    forecast: Array<{
      date: Date;
      temp: number;
      condition: string;
      precipitation: number;
    }>;
  };
  impactLevel: 'low' | 'medium' | 'high';
  rateLimitRemaining: number;
}

interface TrafficIntegration {
  provider: 'google_maps' | 'here' | 'tomtom';
  status: 'connected' | 'disconnected' | 'error';
  lastUpdate: Date;
  data: {
    congestionLevel: number;
    incidents: Array<{
      id: string;
      type: 'accident' | 'construction' | 'closure' | 'weather';
      location: string;
      severity: 'minor' | 'moderate' | 'major';
      description: string;
      startTime: Date;
      estimatedClearTime?: Date;
    }>;
    averageSpeed: number;
    travelTimeIndex: number;
  };
  coverage: string[];
  rateLimitRemaining: number;
}

interface EventsIntegration {
  provider: 'eventbrite' | 'facebook' | 'google_calendar';
  status: 'connected' | 'disconnected' | 'error';
  lastUpdate: Date;
  data: {
    upcomingEvents: Array<{
      id: string;
      title: string;
      date: Date;
      location: string;
      expectedAttendance: number;
      category: 'sports' | 'concert' | 'conference' | 'festival' | 'other';
      impactRadius: number; // in kilometers
    }>;
    activeEvents: Array<{
      id: string;
      title: string;
      location: string;
      currentAttendance: number;
      trafficImpact: 'low' | 'medium' | 'high';
    }>;
  };
  monitoredVenues: string[];
}

interface GTFSIntegration {
  agency: string;
  status: 'connected' | 'disconnected' | 'error';
  lastUpdate: Date;
  feedType: 'static' | 'realtime';
  data: {
    routes: number;
    stops: number;
    trips: number;
    agencies: number;
    lastStaticUpdate: Date;
    alerts: Array<{
      id: string;
      headerText: string;
      descriptionText: string;
      severity: 'info' | 'warning' | 'severe';
      effect: 'no_service' | 'reduced_service' | 'significant_delays' | 'detour' | 'additional_service' | 'modified_service';
      route?: string;
      stop?: string;
    }>;
  };
}

interface IntegrationHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  weather: 'healthy' | 'degraded' | 'offline';
  traffic: 'healthy' | 'degraded' | 'offline';
  events: 'healthy' | 'degraded' | 'offline';
  gtfs: 'healthy' | 'degraded' | 'offline';
  lastHealthCheck: Date;
}

export default function ExternalIntegrationsManager() {
  const [weatherIntegration, setWeatherIntegration] = useState<WeatherIntegration | null>(null);
  const [trafficIntegration, setTrafficIntegration] = useState<TrafficIntegration | null>(null);
  const [eventsIntegration, setEventsIntegration] = useState<EventsIntegration | null>(null);
  const [gtfsIntegration, setGTFSIntegration] = useState<GTFSIntegration | null>(null);
  const [integrationHealth, setIntegrationHealth] = useState<IntegrationHealth | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'weather' | 'traffic' | 'events' | 'gtfs' | 'settings'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    initializeIntegrations();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      refreshAllIntegrations();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const initializeIntegrations = useCallback(async () => {
    try {
      await Promise.all([
        initializeWeatherIntegration(),
        initializeTrafficIntegration(),
        initializeEventsIntegration(),
        initializeGTFSIntegration()
      ]);
      
      checkIntegrationHealth();
    } catch (error) {
      console.error('Failed to initialize integrations:', error);
    }
  }, []);

  const initializeWeatherIntegration = useCallback(async () => {
    try {
      // Mock weather integration initialization
      const weatherData: WeatherIntegration = {
        provider: 'openweather',
        status: 'connected',
        lastUpdate: new Date(),
        data: {
          temperature: 72,
          humidity: 65,
          windSpeed: 8.5,
          precipitation: 0.2,
          visibility: 9.5,
          condition: 'partly_cloudy',
          forecast: [
            { date: new Date(Date.now() + 24 * 60 * 60 * 1000), temp: 75, condition: 'sunny', precipitation: 0 },
            { date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), temp: 68, condition: 'rainy', precipitation: 0.8 },
            { date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), temp: 71, condition: 'cloudy', precipitation: 0.3 }
          ]
        },
        impactLevel: 'low',
        rateLimitRemaining: 458
      };
      setWeatherIntegration(weatherData);
    } catch (error) {
      console.error('Failed to initialize weather integration:', error);
    }
  }, []);

  const initializeTrafficIntegration = useCallback(async () => {
    try {
      // Mock traffic integration initialization
      const trafficData: TrafficIntegration = {
        provider: 'google_maps',
        status: 'connected',
        lastUpdate: new Date(),
        data: {
          congestionLevel: 0.4,
          incidents: [
            {
              id: 'inc_001',
              type: 'construction',
              location: 'Main St & 5th Ave',
              severity: 'moderate',
              description: 'Lane closure for utility work',
              startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
              estimatedClearTime: new Date(Date.now() + 6 * 60 * 60 * 1000)
            },
            {
              id: 'inc_002',
              type: 'accident',
              location: 'Highway 101 Northbound',
              severity: 'minor',
              description: 'Fender bender, right lane blocked',
              startTime: new Date(Date.now() - 30 * 60 * 1000),
              estimatedClearTime: new Date(Date.now() + 15 * 60 * 1000)
            }
          ],
          averageSpeed: 25.8,
          travelTimeIndex: 1.35
        },
        coverage: ['Downtown', 'University District', 'Airport Area', 'Suburban Routes'],
        rateLimitRemaining: 2342
      };
      setTrafficIntegration(trafficData);
    } catch (error) {
      console.error('Failed to initialize traffic integration:', error);
    }
  }, []);

  const initializeEventsIntegration = useCallback(async () => {
    try {
      // Mock events integration initialization
      const eventsData: EventsIntegration = {
        provider: 'eventbrite',
        status: 'connected',
        lastUpdate: new Date(),
        data: {
          upcomingEvents: [
            {
              id: 'evt_001',
              title: 'University Basketball Game',
              date: new Date(Date.now() + 4 * 60 * 60 * 1000),
              location: 'Campus Arena',
              expectedAttendance: 8500,
              category: 'sports',
              impactRadius: 2.5
            },
            {
              id: 'evt_002',
              title: 'Downtown Music Festival',
              date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
              location: 'City Center Park',
              expectedAttendance: 15000,
              category: 'festival',
              impactRadius: 3.0
            }
          ],
          activeEvents: [
            {
              id: 'evt_003',
              title: 'Tech Conference',
              location: 'Convention Center',
              currentAttendance: 3200,
              trafficImpact: 'medium'
            }
          ]
        },
        monitoredVenues: ['Campus Arena', 'Convention Center', 'City Center Park', 'Stadium']
      };
      setEventsIntegration(eventsData);
    } catch (error) {
      console.error('Failed to initialize events integration:', error);
    }
  }, []);

  const initializeGTFSIntegration = useCallback(async () => {
    try {
      // Mock GTFS integration initialization
      const gtfsData: GTFSIntegration = {
        agency: 'Metro Transit Authority',
        status: 'connected',
        lastUpdate: new Date(),
        feedType: 'realtime',
        data: {
          routes: 24,
          stops: 342,
          trips: 1247,
          agencies: 1,
          lastStaticUpdate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          alerts: [
            {
              id: 'alert_001',
              headerText: 'Route 42 Service Alert',
              descriptionText: 'Temporary stop closure at Downtown Station due to construction',
              severity: 'warning',
              effect: 'modified_service',
              route: 'route_42'
            }
          ]
        }
      };
      setGTFSIntegration(gtfsData);
    } catch (error) {
      console.error('Failed to initialize GTFS integration:', error);
    }
  }, []);

  const checkIntegrationHealth = useCallback(async () => {
    try {
      const health: IntegrationHealth = {
        overall: 'healthy',
        weather: weatherIntegration?.status === 'connected' ? 'healthy' : 'offline',
        traffic: trafficIntegration?.status === 'connected' ? 'healthy' : 'offline',
        events: eventsIntegration?.status === 'connected' ? 'healthy' : 'offline',
        gtfs: gtfsIntegration?.status === 'connected' ? 'healthy' : 'offline',
        lastHealthCheck: new Date()
      };

      // Determine overall health
      const services = [health.weather, health.traffic, health.events, health.gtfs];
      const offlineCount = services.filter(s => s === 'offline').length;
      const degradedCount = services.filter(s => s === 'degraded').length;

      if (offlineCount > 1) {
        health.overall = 'critical';
      } else if (offlineCount > 0 || degradedCount > 1) {
        health.overall = 'degraded';
      }

      setIntegrationHealth(health);
    } catch (error) {
      console.error('Failed to check integration health:', error);
    }
  }, [weatherIntegration, trafficIntegration, eventsIntegration, gtfsIntegration]);

  const refreshAllIntegrations = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        initializeWeatherIntegration(),
        initializeTrafficIntegration(),
        initializeEventsIntegration(),
        initializeGTFSIntegration()
      ]);
      
      checkIntegrationHealth();
    } catch (error) {
      console.error('Failed to refresh integrations:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'disconnected': return <WifiOff className="w-5 h-5 text-gray-500" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Wifi className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': case 'healthy': return 'text-green-600 bg-green-100';
      case 'disconnected': case 'offline': return 'text-gray-600 bg-gray-100';
      case 'error': case 'critical': return 'text-red-600 bg-red-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'major': return 'text-red-600 bg-red-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'severe': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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
                <Zap className="w-8 h-8 text-blue-600" />
                External Integrations
              </h1>
              <p className="text-gray-600 mt-2">
                Real-time data integration with weather, traffic, events, and transit APIs
              </p>
            </div>
            <div className="flex items-center gap-3">
              {integrationHealth && (
                <div className={`px-3 py-2 rounded-lg flex items-center gap-2 ${getStatusColor(integrationHealth.overall)}`}>
                  {integrationHealth.overall === 'healthy' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : integrationHealth.overall === 'critical' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <WifiOff className="w-4 h-4" />
                  )}
                  <span className="font-medium capitalize">{integrationHealth.overall}</span>
                </div>
              )}
              <button
                onClick={refreshAllIntegrations}
                disabled={isRefreshing}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh All
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: Zap },
                { id: 'weather', label: 'Weather', icon: Cloud },
                { id: 'traffic', label: 'Traffic', icon: Car },
                { id: 'events', label: 'Events', icon: Calendar },
                { id: 'gtfs', label: 'GTFS', icon: MapPin },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setSelectedTab(id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    selectedTab === id
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
          {selectedTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Integration Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Cloud className="w-8 h-8 text-blue-600" />
                    {weatherIntegration && getStatusIcon(weatherIntegration.status)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Weather API</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Provider: {weatherIntegration?.provider || 'Not configured'}
                  </p>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    weatherIntegration ? getStatusColor(weatherIntegration.status) : 'text-gray-600 bg-gray-100'
                  }`}>
                    {weatherIntegration?.status || 'Offline'}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Car className="w-8 h-8 text-green-600" />
                    {trafficIntegration && getStatusIcon(trafficIntegration.status)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Traffic API</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Provider: {trafficIntegration?.provider || 'Not configured'}
                  </p>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    trafficIntegration ? getStatusColor(trafficIntegration.status) : 'text-gray-600 bg-gray-100'
                  }`}>
                    {trafficIntegration?.status || 'Offline'}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="w-8 h-8 text-purple-600" />
                    {eventsIntegration && getStatusIcon(eventsIntegration.status)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Events API</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Provider: {eventsIntegration?.provider || 'Not configured'}
                  </p>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    eventsIntegration ? getStatusColor(eventsIntegration.status) : 'text-gray-600 bg-gray-100'
                  }`}>
                    {eventsIntegration?.status || 'Offline'}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <MapPin className="w-8 h-8 text-orange-600" />
                    {gtfsIntegration && getStatusIcon(gtfsIntegration.status)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">GTFS Feed</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Agency: {gtfsIntegration?.agency || 'Not configured'}
                  </p>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    gtfsIntegration ? getStatusColor(gtfsIntegration.status) : 'text-gray-600 bg-gray-100'
                  }`}>
                    {gtfsIntegration?.status || 'Offline'}
                  </div>
                </div>
              </div>

              {/* Current Conditions Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weather Impact */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Weather Impact</h3>
                  {weatherIntegration && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Conditions</span>
                        <span className="font-medium">{weatherIntegration.data.condition.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Temperature</span>
                        <span className="font-medium">{weatherIntegration.data.temperature}°F</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Precipitation</span>
                        <span className="font-medium">{weatherIntegration.data.precipitation}" chance</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Transit Impact</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getImpactColor(weatherIntegration.impactLevel)}`}>
                          {weatherIntegration.impactLevel}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Traffic Conditions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Conditions</h3>
                  {trafficIntegration && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Congestion Level</span>
                        <span className="font-medium">{Math.round(trafficIntegration.data.congestionLevel * 100)}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Average Speed</span>
                        <span className="font-medium">{trafficIntegration.data.averageSpeed} mph</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Active Incidents</span>
                        <span className="font-medium">{trafficIntegration.data.incidents.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Travel Time Index</span>
                        <span className="font-medium">{trafficIntegration.data.travelTimeIndex.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Incidents and Events */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Traffic Incidents */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Traffic Incidents</h3>
                  <div className="space-y-3">
                    {trafficIntegration?.data.incidents.map((incident) => (
                      <div key={incident.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{incident.location}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                            {incident.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Started: {incident.startTime.toLocaleTimeString()}</span>
                          {incident.estimatedClearTime && (
                            <span>Est. Clear: {incident.estimatedClearTime.toLocaleTimeString()}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Events */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Events</h3>
                  <div className="space-y-3">
                    {eventsIntegration?.data.activeEvents.map((event) => (
                      <div key={event.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{event.title}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(event.trafficImpact)}`}>
                            {event.trafficImpact} impact
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{event.location}</p>
                        <div className="text-xs text-gray-500">
                          Current attendance: {event.currentAttendance.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'weather' && weatherIntegration && (
            <motion.div
              key="weather"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Current Weather */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Current Weather Conditions</h3>
                  <div className="text-sm text-gray-500">
                    Last updated: {weatherIntegration.lastUpdate.toLocaleTimeString()}
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <Thermometer className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{weatherIntegration.data.temperature}°F</div>
                    <div className="text-sm text-gray-600">Temperature</div>
                  </div>
                  <div className="text-center">
                    <Droplets className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{weatherIntegration.data.humidity}%</div>
                    <div className="text-sm text-gray-600">Humidity</div>
                  </div>
                  <div className="text-center">
                    <Wind className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{weatherIntegration.data.windSpeed} mph</div>
                    <div className="text-sm text-gray-600">Wind Speed</div>
                  </div>
                  <div className="text-center">
                    <Cloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{weatherIntegration.data.visibility} mi</div>
                    <div className="text-sm text-gray-600">Visibility</div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Transit Impact Level</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getImpactColor(weatherIntegration.impactLevel)}`}>
                      {weatherIntegration.impactLevel.charAt(0).toUpperCase() + weatherIntegration.impactLevel.slice(1)} Impact
                    </span>
                  </div>
                </div>
              </div>

              {/* Weather Forecast */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">3-Day Forecast</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {weatherIntegration.data.forecast.map((day, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600 mb-2">
                        {day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-xl font-bold text-gray-900 mb-2">{day.temp}°F</div>
                      <div className="text-sm text-gray-600 mb-2 capitalize">
                        {day.condition.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {day.precipitation > 0 ? `${day.precipitation}" rain` : 'No precipitation'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* API Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">API Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Provider</div>
                    <div className="font-medium text-gray-900 capitalize">{weatherIntegration.provider}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Rate Limit Remaining</div>
                    <div className="font-medium text-gray-900">{weatherIntegration.rateLimitRemaining}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(weatherIntegration.status)}`}>
                      {weatherIntegration.status}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'traffic' && trafficIntegration && (
            <motion.div
              key="traffic"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Traffic Overview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {Math.round(trafficIntegration.data.congestionLevel * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Congestion Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {trafficIntegration.data.averageSpeed}
                    </div>
                    <div className="text-sm text-gray-600">Average Speed (mph)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {trafficIntegration.data.travelTimeIndex.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Travel Time Index</div>
                  </div>
                </div>
              </div>

              {/* Traffic Incidents */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Incidents</h3>
                <div className="space-y-4">
                  {trafficIntegration.data.incidents.map((incident) => (
                    <div key={incident.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {incident.type === 'construction' ? (
                            <Construction className="w-5 h-5 text-orange-500" />
                          ) : incident.type === 'accident' ? (
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          ) : (
                            <Car className="w-5 h-5 text-gray-500" />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{incident.location}</div>
                            <div className="text-sm text-gray-600 capitalize">{incident.type}</div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(incident.severity)}`}>
                          {incident.severity}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3">{incident.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Started: {incident.startTime.toLocaleString()}
                        </span>
                        {incident.estimatedClearTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Est. Clear: {incident.estimatedClearTime.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coverage Areas */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage Areas</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {trafficIntegration.coverage.map((area) => (
                    <div key={area} className="bg-gray-50 rounded-lg p-3 text-center">
                      <MapPin className="w-5 h-5 text-gray-600 mx-auto mb-2" />
                      <div className="text-sm font-medium text-gray-900">{area}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'events' && eventsIntegration && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Upcoming Events */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
                <div className="space-y-4">
                  {eventsIntegration.data.upcomingEvents.map((event) => (
                    <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-600">{event.location}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-900">{event.date.toLocaleDateString()}</div>
                          <div className="text-sm text-gray-600">{event.date.toLocaleTimeString()}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Expected Attendance:</span>
                          <div className="font-medium">{event.expectedAttendance.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Category:</span>
                          <div className="font-medium capitalize">{event.category}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Impact Radius:</span>
                          <div className="font-medium">{event.impactRadius} km</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Events */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Currently Active Events</h3>
                <div className="space-y-4">
                  {eventsIntegration.data.activeEvents.map((event) => (
                    <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-600">{event.location}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getImpactColor(event.trafficImpact)}`}>
                          {event.trafficImpact} impact
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">
                          Current attendance: {event.currentAttendance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monitored Venues */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monitored Venues</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {eventsIntegration.monitoredVenues.map((venue) => (
                    <div key={venue} className="bg-gray-50 rounded-lg p-3 text-center">
                      <Calendar className="w-5 h-5 text-gray-600 mx-auto mb-2" />
                      <div className="text-sm font-medium text-gray-900">{venue}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'gtfs' && gtfsIntegration && (
            <motion.div
              key="gtfs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* GTFS Overview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">GTFS Feed Overview</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{gtfsIntegration.data.routes}</div>
                    <div className="text-sm text-gray-600">Routes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">{gtfsIntegration.data.stops}</div>
                    <div className="text-sm text-gray-600">Stops</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{gtfsIntegration.data.trips}</div>
                    <div className="text-sm text-gray-600">Active Trips</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">{gtfsIntegration.data.agencies}</div>
                    <div className="text-sm text-gray-600">Agencies</div>
                  </div>
                </div>
              </div>

              {/* Service Alerts */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Alerts</h3>
                <div className="space-y-4">
                  {gtfsIntegration.data.alerts.map((alert) => (
                    <div key={alert.id} className={`border rounded-lg p-4 ${
                      alert.severity === 'severe' ? 'border-red-200 bg-red-50' :
                      alert.severity === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                      'border-blue-200 bg-blue-50'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{alert.headerText}</h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3">{alert.descriptionText}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>Effect: {alert.effect.replace(/_/g, ' ')}</span>
                        {alert.route && <span>Route: {alert.route}</span>}
                        {alert.stop && <span>Stop: {alert.stop}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feed Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Feed Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-600">Agency</div>
                    <div className="font-medium text-gray-900">{gtfsIntegration.agency}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Feed Type</div>
                    <div className="font-medium text-gray-900 capitalize">{gtfsIntegration.feedType}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Last Static Update</div>
                    <div className="font-medium text-gray-900">{gtfsIntegration.data.lastStaticUpdate.toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Last Realtime Update</div>
                    <div className="font-medium text-gray-900">{gtfsIntegration.lastUpdate.toLocaleTimeString()}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Integration Settings</h3>
                
                <div className="space-y-8">
                  {/* Weather Settings */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Weather API Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                        <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                          <option value="openweather">OpenWeather</option>
                          <option value="weatherapi">WeatherAPI</option>
                          <option value="accuweather">AccuWeather</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Update Interval (minutes)</label>
                        <input type="number" defaultValue="15" min="5" max="60" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                      </div>
                    </div>
                  </div>

                  {/* Traffic Settings */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Traffic API Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                        <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                          <option value="google_maps">Google Maps</option>
                          <option value="here">HERE</option>
                          <option value="tomtom">TomTom</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Update Interval (minutes)</label>
                        <input type="number" defaultValue="5" min="1" max="30" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                      </div>
                    </div>
                  </div>

                  {/* Events Settings */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Events API Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                        <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                          <option value="eventbrite">Eventbrite</option>
                          <option value="facebook">Facebook Events</option>
                          <option value="google_calendar">Google Calendar</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Lookahead Days</label>
                        <input type="number" defaultValue="7" min="1" max="30" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                      </div>
                    </div>
                  </div>

                  {/* GTFS Settings */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">GTFS Feed Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Static Feed URL</label>
                        <input type="url" placeholder="https://agency.com/gtfs/static.zip" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Realtime Feed URL</label>
                        <input type="url" placeholder="https://agency.com/gtfs/realtime" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}