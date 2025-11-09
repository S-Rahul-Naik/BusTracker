import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Navigation, Clock, Users, AlertCircle } from 'lucide-react';
import Header from '../../components/feature/Header';
import { apiClient } from '../../lib/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function LiveTracking() {
  const navigate = useNavigate();
  const location = useLocation();
  const mapRef = useRef<L.Map | null>(null);
  const busMarkerRef = useRef<L.Marker | null>(null);
  const routingControlRef = useRef<any>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>(
    location.state?.selectedRoute || ''
  );
  const [loading, setLoading] = useState(true);
  const [busPosition, setBusPosition] = useState<number>(0); // 0-100% along route
  const [currentStopIndex, setCurrentStopIndex] = useState<number>(0);
  const [estimatedPassengers, setEstimatedPassengers] = useState<number>(0);
  const [routeCoordinates, setRouteCoordinates] = useState<L.LatLng[]>([]);

  useEffect(() => {
    loadRoutes();
  }, []);

  useEffect(() => {
    if (routes.length > 0 && selectedRoute) {
      console.log('Initializing map with route:', selectedRoute);
      // Add small delay to ensure DOM is ready
      setTimeout(() => {
        initializeMap();
      }, 100);
    }
  }, [routes, selectedRoute]);

  // Simulate bus movement
  useEffect(() => {
    if (!selectedRoute) return;
    
    const interval = setInterval(() => {
      setBusPosition((prev) => {
        const next = prev + 0.5; // Move 0.5% every second
        if (next >= 100) return 0; // Loop back
        return next;
      });
      
      // Simulate passenger count changes
      setEstimatedPassengers(Math.floor(Math.random() * 40) + 10);
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedRoute]);

  const loadRoutes = async () => {
    try {
      const data = await apiClient.getRoutes();
      setRoutes(data);
      if (data.length > 0 && !selectedRoute) {
        setSelectedRoute(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load routes:', error);
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    console.log('initializeMap called');
    const currentRoute = routes.find(r => r.id === selectedRoute);
    console.log('Current route:', currentRoute);
    
    if (!currentRoute || !currentRoute.stops || currentRoute.stops.length === 0) {
      console.log('Cannot initialize map: missing route or stops');
      return;
    }

    // Validate first stop has valid coordinates
    const firstStop = currentRoute.stops[0];
    console.log('First stop:', firstStop);
    
    // Support both lat/lng and latitude/longitude formats
    const lat = firstStop.latitude || firstStop.lat;
    const lng = firstStop.longitude || firstStop.lng;
    
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      console.error('Invalid coordinates for first stop:', firstStop);
      return;
    }

    // Clear existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Wait for DOM element
    const mapElement = document.getElementById('tracking-map');
    if (!mapElement) {
      console.error('Map element not found');
      return;
    }

    try {
      // Create map centered on first stop
      const map = L.map('tracking-map').setView(
        [lat, lng],
        13
      );

      // Add Geoapify tiles
      L.tileLayer(
        'https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=d74bec8d5ac4405dbb427b8f32afc6de',
        {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 20,
        }
      ).addTo(map);

      // Prepare waypoints for OSRM routing
      const waypoints = currentRoute.stops.map((stop: any) => {
        const stopLat = stop.latitude || stop.lat;
        const stopLng = stop.longitude || stop.lng;
        return L.latLng(stopLat, stopLng);
      });

      // Add OSRM routing
      const routingControl = (L as any).Routing.control({
        waypoints: waypoints,
        router: (L as any).Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'driving',
        }),
        lineOptions: {
          styles: [
            {
              color: currentRoute.color || 'blue',
              opacity: 0.8,
              weight: 5,
            },
          ],
          addWaypoints: false,
        },
        createMarker: () => null, // We'll add custom markers
        show: false, // Hide the routing instructions panel
        addWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: true,
      }).addTo(map);

      routingControlRef.current = routingControl;

      // Listen for route found event to get actual route coordinates
      routingControl.on('routesfound', (e: any) => {
        const routes = e.routes;
        if (routes && routes[0]) {
          const routeCoords = routes[0].coordinates;
          setRouteCoordinates(routeCoords);
          console.log('Route coordinates loaded:', routeCoords.length, 'points');
        }
      });

      // Add stop markers
      currentRoute.stops.forEach((stop: any, index: number) => {
        const stopLat = stop.latitude || stop.lat;
        const stopLng = stop.longitude || stop.lng;
        
        const marker = L.marker([stopLat, stopLng], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${currentRoute.color || 'blue'}; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${index + 1}</div>`,
            iconSize: [30, 30],
          }),
        }).addTo(map);

        marker.bindPopup(`
          <div style="text-align: center;">
            <strong>${stop.name}</strong><br/>
            <small>Stop ${index + 1}</small>
          </div>
        `);
      });

      // Add moving bus marker
      const busIcon = L.divIcon({
        className: 'bus-marker',
        html: `<div style="background-color: red; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.4);">🚌</div>`,
        iconSize: [40, 40],
      });

      const busMarker = L.marker([lat, lng], {
        icon: busIcon,
        zIndexOffset: 1000, // Keep bus marker on top
      }).addTo(map);
      busMarkerRef.current = busMarker;

      mapRef.current = map;
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  // Update bus position on map based on actual route coordinates
  useEffect(() => {
    if (!busMarkerRef.current || routeCoordinates.length === 0) return;

    const currentRoute = routes.find(r => r.id === selectedRoute);
    if (!currentRoute || !currentRoute.stops || currentRoute.stops.length < 2) return;

    // Calculate position along the actual route coordinates
    const totalPoints = routeCoordinates.length;
    const currentIndex = Math.floor((busPosition / 100) * (totalPoints - 1));
    
    if (currentIndex < totalPoints) {
      const currentCoord = routeCoordinates[currentIndex];
      busMarkerRef.current.setLatLng(currentCoord);
      
      // Find which stops we're between
      const totalStops = currentRoute.stops.length;
      const segmentLength = 100 / (totalStops - 1);
      const currentSegment = Math.floor(busPosition / segmentLength);
      const segmentProgress = (busPosition % segmentLength) / segmentLength;
      
      // Update current stop index
      setCurrentStopIndex(Math.min(currentSegment, totalStops - 1));
      
      // Get next stop info
      const nextStopIndex = Math.min(currentSegment + 1, totalStops - 1);
      const nextStop = currentRoute.stops[nextStopIndex];
      
      // Update popup
      busMarkerRef.current.bindPopup(`
        <div style="text-align: center;">
          <strong>🚌 Bus Live Location</strong><br/>
          <small>Heading to ${nextStop.name}</small><br/>
          <small>${Math.round((1 - segmentProgress) * 100)}% to next stop</small>
        </div>
      `);
    }
  }, [busPosition, selectedRoute, routes, routeCoordinates]);

  const currentRoute = routes.find(r => r.id === selectedRoute);
  const nextStop = currentRoute?.stops?.[Math.min(currentStopIndex + 1, currentRoute.stops.length - 1)];
  const currentStop = currentRoute?.stops?.[currentStopIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No routes available</h3>
            <p className="mt-1 text-sm text-gray-500">Create a route first to track buses.</p>
            <button
              onClick={() => navigate('/admin')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Route Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Route to Track
          </label>
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.name} - {route.description}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-blue-600 text-white">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Live Bus Tracking
                </h2>
              </div>
              <div id="tracking-map" style={{ height: '500px', width: '100%' }}></div>
            </div>
          </div>

          {/* Live Info Panel */}
          <div className="space-y-6">
            {/* Current Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Current Status
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Current Location</p>
                  <p className="font-medium">{currentStop?.name || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Next Stop</p>
                  <p className="font-medium">{nextStop?.name || 'End of Route'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Progress</p>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${busPosition}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{Math.round(busPosition)}% Complete</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Estimated Passengers
                  </p>
                  <p className="font-medium text-2xl">{estimatedPassengers}</p>
                </div>
              </div>
            </div>

            {/* Route Info */}
            {currentRoute && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Route Information
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Route Name</p>
                    <p className="font-medium">{currentRoute.name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium">{currentRoute.description}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Frequency
                    </p>
                    <p className="font-medium">{currentRoute.frequency || 'N/A'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Total Stops</p>
                    <p className="font-medium">{currentRoute.stops?.length || 0} stops</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Operating Hours</p>
                    <p className="font-medium">{currentRoute.operatingHours || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/schedule', { state: { selectedRoute } })}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Schedule
                </button>
                <button
                  onClick={() => navigate('/routes')}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  View All Routes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
