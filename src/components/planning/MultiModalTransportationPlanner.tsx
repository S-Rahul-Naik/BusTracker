/**
 * Multi-Modal Transportation Planner
 * Phase 4: Unified journey planning across different transport modes
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Route, 
  MapPin, 
  Clock, 
  Zap, 
  Bike,
  Car,
  Train,
  Plane,
  PersonStanding,
  DollarSign,
  Leaf,
  Star,
  Navigation,
  RefreshCw,
  Filter,
  ArrowRight,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface TransportMode {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  available: boolean;
  emissions: number; // kg CO2 per km
  costPerKm: number;
  averageSpeed: number; // km/h
  reliability: number; // 0-1
}

interface JourneySegment {
  id: string;
  mode: TransportMode;
  from: {
    name: string;
    coordinates: [number, number];
    type: 'stop' | 'station' | 'address';
  };
  to: {
    name: string;
    coordinates: [number, number];
    type: 'stop' | 'station' | 'address';
  };
  duration: number; // minutes
  distance: number; // km
  cost: number;
  emissions: number;
  departureTime: Date;
  arrivalTime: Date;
  routeInfo?: {
    routeId: string;
    routeName: string;
    headsign: string;
    realTimeDelay?: number;
  };
  walkingInstructions?: string[];
  alerts?: string[];
}

interface JourneyOption {
  id: string;
  segments: JourneySegment[];
  totalDuration: number;
  totalCost: number;
  totalEmissions: number;
  totalDistance: number;
  walkingDistance: number;
  transferCount: number;
  reliability: number;
  accessibility: {
    wheelchairAccessible: boolean;
    lowFloorVehicle: boolean;
    audioAnnouncements: boolean;
  };
  preferences: {
    fastest: boolean;
    cheapest: boolean;
    greenest: boolean;
    mostReliable: boolean;
  };
}

interface TripRequest {
  from: {
    name: string;
    coordinates: [number, number];
  };
  to: {
    name: string;
    coordinates: [number, number];
  };
  departureTime: Date;
  arrivalBy?: Date;
  preferences: {
    modes: string[];
    priority: 'time' | 'cost' | 'environment' | 'comfort';
    maxWalkingDistance: number; // km
    wheelchairAccessible: boolean;
    allowTransfers: boolean;
    maxTransfers: number;
  };
}

interface LiveUpdate {
  segmentId: string;
  type: 'delay' | 'cancellation' | 'platform_change' | 'crowding';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
}

const TRANSPORT_MODES: TransportMode[] = [
  {
    id: 'bus',
    name: 'Bus',
    icon: Route,
    available: true,
    emissions: 0.089,
    costPerKm: 0.15,
    averageSpeed: 25,
    reliability: 0.85
  },
  {
    id: 'train',
    name: 'Train',
    icon: Train,
    available: true,
    emissions: 0.041,
    costPerKm: 0.12,
    averageSpeed: 60,
    reliability: 0.92
  },
  {
    id: 'bike',
    name: 'Bike Share',
    icon: Bike,
    available: true,
    emissions: 0.0,
    costPerKm: 0.08,
    averageSpeed: 15,
    reliability: 0.95
  },
  {
    id: 'walk',
    name: 'Walking',
    icon: PersonStanding,
    available: true,
    emissions: 0.0,
    costPerKm: 0.0,
    averageSpeed: 5,
    reliability: 1.0
  },
  {
    id: 'rideshare',
    name: 'Rideshare',
    icon: Car,
    available: true,
    emissions: 0.251,
    costPerKm: 1.2,
    averageSpeed: 35,
    reliability: 0.88
  },
  {
    id: 'scooter',
    name: 'E-Scooter',
    icon: Zap,
    available: true,
    emissions: 0.015,
    costPerKm: 0.25,
    averageSpeed: 20,
    reliability: 0.78
  }
];

export default function MultiModalTransportationPlanner() {
  const [tripRequest, setTripRequest] = useState<TripRequest>({
    from: { name: '', coordinates: [0, 0] },
    to: { name: '', coordinates: [0, 0] },
    departureTime: new Date(),
    preferences: {
      modes: ['bus', 'train', 'walk'],
      priority: 'time',
      maxWalkingDistance: 1.0,
      wheelchairAccessible: false,
      allowTransfers: true,
      maxTransfers: 3
    }
  });

  const [journeyOptions, setJourneyOptions] = useState<JourneyOption[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<JourneyOption | null>(null);
  const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [favoriteLocations, setFavoriteLocations] = useState<Array<{name: string; coordinates: [number, number]}>>([]);

  useEffect(() => {
    // Initialize favorite locations
    setFavoriteLocations([
      { name: 'Home', coordinates: [37.7749, -122.4194] },
      { name: 'Work', coordinates: [37.7849, -122.4094] },
      { name: 'University', coordinates: [37.7649, -122.4294] },
      { name: 'Airport', coordinates: [37.6213, -122.3790] }
    ]);

    // Set up live updates polling
    const interval = setInterval(() => {
      if (selectedJourney) {
        fetchLiveUpdates(selectedJourney.id);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedJourney]);

  const planJourney = useCallback(async () => {
    if (!tripRequest.from.name || !tripRequest.to.name) return;

    setIsPlanning(true);
    try {
      // Simulate journey planning API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockJourneys: JourneyOption[] = [
        {
          id: 'journey_1',
          segments: [
            {
              id: 'seg_1',
              mode: TRANSPORT_MODES.find(m => m.id === 'walk')!,
              from: { name: tripRequest.from.name, coordinates: tripRequest.from.coordinates, type: 'address' },
              to: { name: 'Main St Station', coordinates: [37.7759, -122.4184], type: 'station' },
              duration: 8,
              distance: 0.6,
              cost: 0,
              emissions: 0,
              departureTime: tripRequest.departureTime,
              arrivalTime: new Date(tripRequest.departureTime.getTime() + 8 * 60 * 1000),
              walkingInstructions: ['Head north on Pine St', 'Turn right on Main St', 'Station entrance on left']
            },
            {
              id: 'seg_2',
              mode: TRANSPORT_MODES.find(m => m.id === 'bus')!,
              from: { name: 'Main St Station', coordinates: [37.7759, -122.4184], type: 'station' },
              to: { name: 'Downtown Transit Center', coordinates: [37.7859, -122.4084], type: 'station' },
              duration: 22,
              distance: 8.5,
              cost: 2.50,
              emissions: 0.76,
              departureTime: new Date(tripRequest.departureTime.getTime() + 10 * 60 * 1000),
              arrivalTime: new Date(tripRequest.departureTime.getTime() + 32 * 60 * 1000),
              routeInfo: {
                routeId: 'route_42',
                routeName: 'Route 42',
                headsign: 'Downtown',
                realTimeDelay: 2
              }
            },
            {
              id: 'seg_3',
              mode: TRANSPORT_MODES.find(m => m.id === 'walk')!,
              from: { name: 'Downtown Transit Center', coordinates: [37.7859, -122.4084], type: 'station' },
              to: { name: tripRequest.to.name, coordinates: tripRequest.to.coordinates, type: 'address' },
              duration: 5,
              distance: 0.3,
              cost: 0,
              emissions: 0,
              departureTime: new Date(tripRequest.departureTime.getTime() + 32 * 60 * 1000),
              arrivalTime: new Date(tripRequest.departureTime.getTime() + 37 * 60 * 1000),
              walkingInstructions: ['Exit transit center via north exit', 'Walk 2 blocks north', 'Destination on right']
            }
          ],
          totalDuration: 37,
          totalCost: 2.50,
          totalEmissions: 0.76,
          totalDistance: 9.4,
          walkingDistance: 0.9,
          transferCount: 1,
          reliability: 0.87,
          accessibility: {
            wheelchairAccessible: true,
            lowFloorVehicle: true,
            audioAnnouncements: true
          },
          preferences: {
            fastest: true,
            cheapest: false,
            greenest: false,
            mostReliable: false
          }
        },
        {
          id: 'journey_2',
          segments: [
            {
              id: 'seg_4',
              mode: TRANSPORT_MODES.find(m => m.id === 'walk')!,
              from: { name: tripRequest.from.name, coordinates: tripRequest.from.coordinates, type: 'address' },
              to: { name: 'Metro Station A', coordinates: [37.7749, -122.4154], type: 'station' },
              duration: 12,
              distance: 0.8,
              cost: 0,
              emissions: 0,
              departureTime: tripRequest.departureTime,
              arrivalTime: new Date(tripRequest.departureTime.getTime() + 12 * 60 * 1000)
            },
            {
              id: 'seg_5',
              mode: TRANSPORT_MODES.find(m => m.id === 'train')!,
              from: { name: 'Metro Station A', coordinates: [37.7749, -122.4154], type: 'station' },
              to: { name: 'Metro Station B', coordinates: [37.7849, -122.4054], type: 'station' },
              duration: 18,
              distance: 12.2,
              cost: 3.25,
              emissions: 0.50,
              departureTime: new Date(tripRequest.departureTime.getTime() + 15 * 60 * 1000),
              arrivalTime: new Date(tripRequest.departureTime.getTime() + 33 * 60 * 1000),
              routeInfo: {
                routeId: 'metro_red',
                routeName: 'Red Line',
                headsign: 'Northbound'
              }
            },
            {
              id: 'seg_6',
              mode: TRANSPORT_MODES.find(m => m.id === 'bike')!,
              from: { name: 'Metro Station B', coordinates: [37.7849, -122.4054], type: 'station' },
              to: { name: tripRequest.to.name, coordinates: tripRequest.to.coordinates, type: 'address' },
              duration: 8,
              distance: 2.1,
              cost: 0.50,
              emissions: 0,
              departureTime: new Date(tripRequest.departureTime.getTime() + 35 * 60 * 1000),
              arrivalTime: new Date(tripRequest.departureTime.getTime() + 43 * 60 * 1000)
            }
          ],
          totalDuration: 43,
          totalCost: 3.75,
          totalEmissions: 0.50,
          totalDistance: 15.1,
          walkingDistance: 0.8,
          transferCount: 2,
          reliability: 0.90,
          accessibility: {
            wheelchairAccessible: false,
            lowFloorVehicle: true,
            audioAnnouncements: true
          },
          preferences: {
            fastest: false,
            cheapest: false,
            greenest: true,
            mostReliable: true
          }
        },
        {
          id: 'journey_3',
          segments: [
            {
              id: 'seg_7',
              mode: TRANSPORT_MODES.find(m => m.id === 'rideshare')!,
              from: { name: tripRequest.from.name, coordinates: tripRequest.from.coordinates, type: 'address' },
              to: { name: tripRequest.to.name, coordinates: tripRequest.to.coordinates, type: 'address' },
              duration: 25,
              distance: 12.8,
              cost: 15.36,
              emissions: 3.21,
              departureTime: new Date(tripRequest.departureTime.getTime() + 5 * 60 * 1000),
              arrivalTime: new Date(tripRequest.departureTime.getTime() + 30 * 60 * 1000)
            }
          ],
          totalDuration: 30,
          totalCost: 15.36,
          totalEmissions: 3.21,
          totalDistance: 12.8,
          walkingDistance: 0,
          transferCount: 0,
          reliability: 0.88,
          accessibility: {
            wheelchairAccessible: true,
            lowFloorVehicle: false,
            audioAnnouncements: false
          },
          preferences: {
            fastest: false,
            cheapest: false,
            greenest: false,
            mostReliable: false
          }
        }
      ];

      // Sort by user preference
      const sortedJourneys = mockJourneys.sort((a, b) => {
        switch (tripRequest.preferences.priority) {
          case 'time':
            return a.totalDuration - b.totalDuration;
          case 'cost':
            return a.totalCost - b.totalCost;
          case 'environment':
            return a.totalEmissions - b.totalEmissions;
          case 'comfort':
            return b.reliability - a.reliability;
          default:
            return a.totalDuration - b.totalDuration;
        }
      });

      setJourneyOptions(sortedJourneys);
    } catch (error) {
      console.error('Failed to plan journey:', error);
    } finally {
      setIsPlanning(false);
    }
  }, [tripRequest]);

  const fetchLiveUpdates = useCallback(async (journeyId: string) => {
    try {
      // Mock live updates
      const mockUpdates: LiveUpdate[] = [
        {
          segmentId: 'seg_2',
          type: 'delay',
          message: 'Route 42 bus delayed by 3 minutes due to traffic',
          severity: 'warning',
          timestamp: new Date()
        }
      ];
      setLiveUpdates(mockUpdates);
    } catch (error) {
      console.error('Failed to fetch live updates:', error);
    }
  }, []);

  const getModeIcon = (modeId: string) => {
    const mode = TRANSPORT_MODES.find(m => m.id === modeId);
    if (!mode) return Route;
    return mode.icon;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getPreferenceIcon = (journey: JourneyOption) => {
    if (journey.preferences.fastest) return <Zap className="w-4 h-4 text-yellow-500" />;
    if (journey.preferences.cheapest) return <DollarSign className="w-4 h-4 text-green-500" />;
    if (journey.preferences.greenest) return <Leaf className="w-4 h-4 text-green-600" />;
    if (journey.preferences.mostReliable) return <Star className="w-4 h-4 text-blue-500" />;
    return null;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Navigation className="w-8 h-8 text-blue-600" />
            Multi-Modal Trip Planner
          </h1>
          <p className="text-gray-600 mt-2">
            Plan your journey across multiple transportation modes for optimal routing
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trip Planning Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Your Trip</h3>
              
              <div className="space-y-4">
                {/* From Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tripRequest.from.name}
                      onChange={(e) => setTripRequest(prev => ({
                        ...prev,
                        from: { ...prev.from, name: e.target.value }
                      }))}
                      placeholder="Enter starting location"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10"
                    />
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {favoriteLocations.map((location) => (
                      <button
                        key={location.name}
                        onClick={() => setTripRequest(prev => ({
                          ...prev,
                          from: location
                        }))}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                      >
                        {location.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* To Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tripRequest.to.name}
                      onChange={(e) => setTripRequest(prev => ({
                        ...prev,
                        to: { ...prev.to, name: e.target.value }
                      }))}
                      placeholder="Enter destination"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10"
                    />
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {favoriteLocations.map((location) => (
                      <button
                        key={location.name}
                        onClick={() => setTripRequest(prev => ({
                          ...prev,
                          to: location
                        }))}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                      >
                        {location.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Departure Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Departure Time</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={tripRequest.departureTime.toISOString().split('T')[0]}
                      onChange={(e) => {
                        const newDate = new Date(e.target.value);
                        newDate.setHours(tripRequest.departureTime.getHours());
                        newDate.setMinutes(tripRequest.departureTime.getMinutes());
                        setTripRequest(prev => ({ ...prev, departureTime: newDate }));
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <input
                      type="time"
                      value={tripRequest.departureTime.toTimeString().slice(0, 5)}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const newDate = new Date(tripRequest.departureTime);
                        newDate.setHours(parseInt(hours));
                        newDate.setMinutes(parseInt(minutes));
                        setTripRequest(prev => ({ ...prev, departureTime: newDate }));
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                {/* Transport Modes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transport Modes</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TRANSPORT_MODES.filter(mode => mode.available).map((mode) => {
                      const Icon = mode.icon;
                      const isSelected = tripRequest.preferences.modes.includes(mode.id);
                      return (
                        <button
                          key={mode.id}
                          onClick={() => {
                            setTripRequest(prev => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                modes: isSelected
                                  ? prev.preferences.modes.filter(m => m !== mode.id)
                                  : [...prev.preferences.modes, mode.id]
                              }
                            }));
                          }}
                          className={`p-3 border rounded-lg flex flex-col items-center gap-1 ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50 text-blue-700' 
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs">{mode.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={tripRequest.preferences.priority}
                    onChange={(e) => setTripRequest(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, priority: e.target.value as any }
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="time">Fastest Route</option>
                    <option value="cost">Cheapest Route</option>
                    <option value="environment">Most Eco-Friendly</option>
                    <option value="comfort">Most Comfortable</option>
                  </select>
                </div>

                {/* Advanced Options Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <Filter className="w-4 h-4" />
                  Advanced Options
                </button>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 border-t pt-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Walking Distance: {tripRequest.preferences.maxWalkingDistance} km
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="3"
                          step="0.1"
                          value={tripRequest.preferences.maxWalkingDistance}
                          onChange={(e) => setTripRequest(prev => ({
                            ...prev,
                            preferences: { ...prev.preferences, maxWalkingDistance: parseFloat(e.target.value) }
                          }))}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={tripRequest.preferences.wheelchairAccessible}
                            onChange={(e) => setTripRequest(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, wheelchairAccessible: e.target.checked }
                            }))}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700">Wheelchair Accessible</span>
                        </label>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={tripRequest.preferences.allowTransfers}
                            onChange={(e) => setTripRequest(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, allowTransfers: e.target.checked }
                            }))}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700">Allow Transfers</span>
                        </label>
                      </div>

                      {tripRequest.preferences.allowTransfers && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Max Transfers</label>
                          <select
                            value={tripRequest.preferences.maxTransfers}
                            onChange={(e) => setTripRequest(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, maxTransfers: parseInt(e.target.value) }
                            }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          >
                            <option value="1">1 Transfer</option>
                            <option value="2">2 Transfers</option>
                            <option value="3">3 Transfers</option>
                            <option value="4">4+ Transfers</option>
                          </select>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Plan Button */}
                <button
                  onClick={planJourney}
                  disabled={isPlanning || !tripRequest.from.name || !tripRequest.to.name}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPlanning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Planning...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4" />
                      Plan Journey
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Journey Results */}
          <div className="lg:col-span-2 space-y-6">
            {journeyOptions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Journey Options</h3>
                  <button
                    onClick={planJourney}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>

                <div className="space-y-4">
                  {journeyOptions.map((journey) => (
                    <div
                      key={journey.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedJourney?.id === journey.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedJourney(journey)}
                    >
                      {/* Journey Summary */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            {journey.segments.map((segment, index) => {
                              const Icon = getModeIcon(segment.mode.id);
                              return (
                                <div key={index} className="flex items-center">
                                  <Icon className="w-5 h-5 text-gray-600" />
                                  {index < journey.segments.length - 1 && (
                                    <ArrowRight className="w-3 h-3 text-gray-400 mx-1" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {getPreferenceIcon(journey)}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            {formatDuration(journey.totalDuration)}
                          </div>
                          <div className="text-sm text-gray-600">${journey.totalCost.toFixed(2)}</div>
                        </div>
                      </div>

                      {/* Journey Details */}
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Distance:</span>
                          <div className="font-medium">{journey.totalDistance.toFixed(1)} km</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Transfers:</span>
                          <div className="font-medium">{journey.transferCount}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Walking:</span>
                          <div className="font-medium">{journey.walkingDistance.toFixed(1)} km</div>
                        </div>
                        <div>
                          <span className="text-gray-600">CO₂:</span>
                          <div className="font-medium">{journey.totalEmissions.toFixed(2)} kg</div>
                        </div>
                      </div>

                      {/* Accessibility Indicators */}
                      <div className="flex items-center gap-4 mt-3 text-xs">
                        {journey.accessibility.wheelchairAccessible && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Wheelchair Accessible
                          </span>
                        )}
                        {journey.accessibility.audioAnnouncements && (
                          <span className="text-gray-600">Audio Announcements</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Journey Details */}
            {selectedJourney && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Journey Details</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Reliability:</span>
                    <div className="flex items-center gap-1">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${selectedJourney.reliability * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{Math.round(selectedJourney.reliability * 100)}%</span>
                    </div>
                  </div>
                </div>

                {/* Live Updates */}
                {liveUpdates.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Live Updates</h4>
                    <div className="space-y-2">
                      {liveUpdates.map((update, index) => (
                        <div key={index} className={`p-3 rounded-lg border ${getSeverityColor(update.severity)}`}>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="font-medium">{update.message}</span>
                          </div>
                          <div className="text-xs mt-1">{update.timestamp.toLocaleTimeString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Segment Details */}
                <div className="space-y-4">
                  {selectedJourney.segments.map((segment, index) => {
                    const Icon = getModeIcon(segment.mode.id);
                    return (
                      <div key={segment.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Icon className="w-6 h-6 text-gray-600" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {segment.mode.name}
                                {segment.routeInfo && ` - ${segment.routeInfo.routeName}`}
                              </div>
                              <div className="text-sm text-gray-600">
                                {segment.from.name} → {segment.to.name}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatDuration(segment.duration)}</div>
                            <div className="text-sm text-gray-600">
                              {segment.departureTime.toLocaleTimeString()} - {segment.arrivalTime.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>

                        {segment.routeInfo?.realTimeDelay && (
                          <div className="text-sm text-orange-600 mb-2">
                            ⚠️ {segment.routeInfo.realTimeDelay} min delay
                          </div>
                        )}

                        {segment.walkingInstructions && (
                          <div className="text-sm text-gray-600">
                            <div className="font-medium mb-1">Walking Directions:</div>
                            <ul className="list-disc list-inside space-y-1">
                              {segment.walkingInstructions.map((instruction, i) => (
                                <li key={i}>{instruction}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-4 mt-3 text-xs text-gray-600">
                          <div>Distance: {segment.distance.toFixed(1)} km</div>
                          <div>Cost: ${segment.cost.toFixed(2)}</div>
                          <div>CO₂: {segment.emissions.toFixed(2)} kg</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}