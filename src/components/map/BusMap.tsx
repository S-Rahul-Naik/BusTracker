/**
 * Real-time Bus Map Component
 * 
 * Interactive map showing live bus positions, routes, and stops
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus, MapPin, Navigation, Clock, AlertTriangle } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { api } from '../../lib/api';
import type { TripUpdate, BusLocation, RouteStatus } from '../../types/realtime';
import 'leaflet/dist/leaflet.css';

// Custom marker icons
const busIcon = new Icon({
  iconUrl: '/icons/bus-marker.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
  shadowUrl: '/icons/marker-shadow.png',
  shadowSize: [41, 41],
  shadowAnchor: [12, 41]
});

const stopIcon = new Icon({
  iconUrl: '/icons/stop-marker.png',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

interface Route {
  id: string;
  name: string;
  color: string;
  path: [number, number][];
  stops: Stop[];
}

interface Stop {
  id: string;
  name: string;
  location: [number, number];
  route_ids: string[];
}

interface Bus {
  trip_id: string;
  route_id: string;
  location: [number, number];
  heading: number;
  speed: number;
  delay_minutes: number;
  status: string;
  next_stop_id?: string;
  passengers_count?: number;
  last_updated: string;
}

interface BusMapProps {
  selectedRoutes?: string[];
  onRouteSelect?: (routeId: string) => void;
  onBusSelect?: (bus: Bus) => void;
  centerLocation?: [number, number];
  zoom?: number;
  showControls?: boolean;
  height?: string;
}

// Map bounds updater component
function MapBoundsUpdater({ buses, routes }: { buses: Bus[]; routes: Route[] }) {
  const map = useMap();

  useEffect(() => {
    const allPoints: [number, number][] = [];
    
    // Add bus positions
    buses.forEach(bus => {
      allPoints.push(bus.location);
    });
    
    // Add route paths
    routes.forEach(route => {
      allPoints.push(...route.path);
    });

    if (allPoints.length > 0) {
      const bounds = new LatLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, buses, routes]);

  return null;
}

// Animated bus marker component
function AnimatedBusMarker({ bus, onClick }: { bus: Bus; onClick: () => void }) {
  const [prevLocation, setPrevLocation] = useState(bus.location);
  
  useEffect(() => {
    setPrevLocation(bus.location);
  }, [bus.location]);

  const getDelayColor = (delay: number) => {
    if (delay <= 2) return '#10B981'; // Green
    if (delay <= 5) return '#F59E0B'; // Yellow
    if (delay <= 10) return '#EF4444'; // Red
    return '#7C2D12'; // Dark red
  };

  return (
    <motion.div
      initial={{ x: prevLocation[1], y: prevLocation[0] }}
      animate={{ x: bus.location[1], y: bus.location[0] }}
      transition={{ duration: 2, ease: 'linear' }}
    >
      <Marker
        position={bus.location}
        icon={busIcon}
        eventHandlers={{ click: onClick }}
      >
        <Popup>
          <div className="min-w-[200px] p-2">
            <div className="flex items-center gap-2 mb-2">
              <Bus className="w-4 h-4" />
              <span className="font-semibold">Trip {bus.trip_id.slice(-6)}</span>
              <span 
                className="px-2 py-1 rounded text-xs text-white"
                style={{ backgroundColor: getDelayColor(bus.delay_minutes) }}
              >
                {bus.delay_minutes > 0 ? `+${bus.delay_minutes}m` : 'On time'}
              </span>
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <Navigation className="w-3 h-3" />
                <span>Speed: {bus.speed} km/h</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>Updated: {new Date(bus.last_updated).toLocaleTimeString()}</span>
              </div>
              
              {bus.passengers_count && (
                <div className="flex items-center gap-2">
                  <Bus className="w-3 h-3" />
                  <span>Passengers: {bus.passengers_count}</span>
                </div>
              )}
              
              {bus.delay_minutes > 5 && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Delayed</span>
                </div>
              )}
            </div>
          </div>
        </Popup>
      </Marker>
    </motion.div>
  );
}

export function BusMap({
  selectedRoutes = [],
  onRouteSelect,
  onBusSelect,
  centerLocation = [40.7128, -74.0060], // Default to NYC
  zoom = 12,
  showControls = true,
  height = '500px'
}: BusMapProps) {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [autoCenter, setAutoCenter] = useState(false);

  // WebSocket for real-time updates
  const { isConnected, subscribeToRoute, unsubscribeFromRoute } = useWebSocket({
    url: `${import.meta.env.VITE_API_URL}/socket.io`,
    token: localStorage.getItem('token') || undefined,
    onTripUpdate: (update: TripUpdate) => {
      setBuses(prevBuses => 
        prevBuses.map(bus => 
          bus.trip_id === update.trip_id 
            ? {
                ...bus,
                location: update.current_location ? [update.current_location.lat, update.current_location.lng] : bus.location,
                delay_minutes: update.delay_minutes || bus.delay_minutes,
                speed: update.speed || bus.speed,
                heading: update.heading || bus.heading,
                status: update.status,
                last_updated: update.last_updated
              }
            : bus
        )
      );
    }
  });

  // Load initial data
  useEffect(() => {
    const loadMapData = async () => {
      try {
        setLoading(true);
        
        // Load routes
        const routesResponse = await api.get('/routes');
        const routesData = routesResponse.data;
        setRoutes(routesData);

        // Load stops
        const stopsResponse = await api.get('/stops');
        const stopsData = stopsResponse.data;
        setStops(stopsData);

        // Load active trips
        const tripsResponse = await api.get('/trips?status=in_progress');
        const tripsData = tripsResponse.data;
        
        // Convert trips to bus objects with simulated locations
        const busesData = tripsData.map((trip: any) => ({
          trip_id: trip._id,
          route_id: trip.route_id,
          location: trip.current_location || getRandomLocationOnRoute(trip.route_id, routesData),
          heading: trip.heading || Math.random() * 360,
          speed: trip.speed || 20 + Math.random() * 20,
          delay_minutes: trip.delay_minutes || 0,
          status: trip.status,
          next_stop_id: trip.next_stop_id,
          passengers_count: trip.passengers_count,
          last_updated: trip.updated_at || new Date().toISOString()
        }));
        
        setBuses(busesData);
        
      } catch (error) {
        console.error('Failed to load map data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMapData();
  }, []);

  // Subscribe to route updates
  useEffect(() => {
    if (isConnected && selectedRoutes.length > 0) {
      selectedRoutes.forEach(routeId => {
        subscribeToRoute(routeId);
      });
    }

    return () => {
      if (isConnected && selectedRoutes.length > 0) {
        selectedRoutes.forEach(routeId => {
          unsubscribeFromRoute(routeId);
        });
      }
    };
  }, [isConnected, selectedRoutes, subscribeToRoute, unsubscribeFromRoute]);

  // Helper function to get random location on route
  const getRandomLocationOnRoute = (routeId: string, routesData: Route[]): [number, number] => {
    const route = routesData.find(r => r.id === routeId);
    if (route && route.path.length > 0) {
      const randomIndex = Math.floor(Math.random() * route.path.length);
      return route.path[randomIndex];
    }
    return centerLocation;
  };

  const handleBusClick = useCallback((bus: Bus) => {
    setSelectedBus(bus);
    onBusSelect?.(bus);
  }, [onBusSelect]);

  const filteredRoutes = selectedRoutes.length > 0 
    ? routes.filter(route => selectedRoutes.includes(route.id))
    : routes;

  const filteredBuses = selectedRoutes.length > 0
    ? buses.filter(bus => selectedRoutes.includes(bus.route_id))
    : buses;

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading map...</span>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      <MapContainer
        center={centerLocation}
        zoom={zoom}
        className="w-full h-full rounded-lg"
        zoomControl={showControls}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Auto-fit bounds */}
        {autoCenter && <MapBoundsUpdater buses={filteredBuses} routes={filteredRoutes} />}
        
        {/* Route paths */}
        {filteredRoutes.map(route => (
          <Polyline
            key={route.id}
            positions={route.path}
            color={route.color}
            weight={4}
            opacity={0.7}
          />
        ))}
        
        {/* Bus stops */}
        {stops
          .filter(stop => 
            selectedRoutes.length === 0 || 
            stop.route_ids.some(id => selectedRoutes.includes(id))
          )
          .map(stop => (
            <Marker
              key={stop.id}
              position={stop.location}
              icon={stopIcon}
            >
              <Popup>
                <div>
                  <h3 className="font-semibold">{stop.name}</h3>
                  <p className="text-sm text-gray-600">Stop ID: {stop.id}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        
        {/* Buses */}
        <AnimatePresence>
          {filteredBuses.map(bus => (
            <AnimatedBusMarker
              key={bus.trip_id}
              bus={bus}
              onClick={() => handleBusClick(bus)}
            />
          ))}
        </AnimatePresence>
      </MapContainer>
      
      {/* Map controls */}
      {showControls && (
        <div className="absolute top-4 right-4 z-[1000] space-y-2">
          <button
            onClick={() => setAutoCenter(!autoCenter)}
            className={`px-3 py-2 bg-white shadow-lg rounded-lg text-sm font-medium ${
              autoCenter ? 'text-blue-600' : 'text-gray-700'
            } hover:bg-gray-50 transition-colors`}
          >
            Auto Center
          </button>
        </div>
      )}
      
      {/* Connection status */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isConnected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? 'Live Updates' : 'Offline'}
        </div>
      </div>
      
      {/* Bus count */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <div className="bg-white shadow-lg rounded-lg px-3 py-2 text-sm">
          <div className="flex items-center gap-2">
            <Bus className="w-4 h-4" />
            <span>{filteredBuses.length} buses active</span>
          </div>
        </div>
      </div>
    </div>
  );
}