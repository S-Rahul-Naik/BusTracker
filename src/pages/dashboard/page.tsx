
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Header from '../../components/feature/Header';
import BusMap from './components/BusMap';
import RouteSelector from './components/RouteSelector';
import SearchBar from './components/SearchBar';
import BusTimeline from './components/BusTimeline';
import apiClient from '../../lib/api';

export default function Dashboard() {
  const navigate = useNavigate();
  // const navigate = useNavigate(); // Removed unused variable
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [busPositions, setBusPositions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [filteredBuses, setFilteredBuses] = useState<any[]>([]);
  const [mapFocusRoute, setMapFocusRoute] = useState<string | null>(null);
  // const [loading, setLoading] = useState(true); // Removed unused variable

  useEffect(() => {
    // Fetch real bus positions from API
    const fetchBuses = async () => {
      try {
  // setLoading(true); // Removed unused reference
        const buses = await apiClient.getBuses();
        const routes = await apiClient.getRoutes();
        
        console.log('📍 Fetched buses:', buses);
        console.log('🚍 Fetched routes:', routes);
        
        // Transform API data to match component structure
        const transformedBuses = buses.map((bus: any) => {
          // Find the route for this bus
          const route = routes.find((r: any) => r.id === bus.route_id);
          const routeStops = route?.stops || [];
          
          // Extract stop names from route - ensure we get strings only
          const stopNames = routeStops.map((s: any) => {
            if (typeof s === 'string') return s;
            if (typeof s === 'object' && s.name) return String(s.name);
            return String(s);
          });
          const firstStop = stopNames[0] || 'Unknown';
          const lastStop = stopNames[stopNames.length - 1] || 'Unknown';
          
          return {
            id: bus.bus_number || bus.id,
            routeId: bus.route_id,
            routeName: bus.routeName || route?.name || 'Unknown Route',
            position: bus.current_location 
              ? { 
                  lat: bus.current_location.latitude || bus.current_location.lat || 0, 
                  lng: bus.current_location.longitude || bus.current_location.lng || 0
                }
              : (
                  routeStops[0] && typeof routeStops[0] === 'object' && 'lat' in routeStops[0] && 'lng' in routeStops[0]
                    ? { lat: (routeStops[0] as { lat: number; lng: number }).lat, lng: (routeStops[0] as { lat: number; lng: number }).lng }
                    : { lat: 0, lng: 0 }
                ),
            eta: bus.eta_minutes,
            status: bus.status,
            nextStop: bus.next_stop,
            delay: bus.delay_minutes,
            direction: bus.direction,
            finalDestination: bus.final_destination,
            completedStops: bus.completed_stops,
            upcomingStops: bus.upcoming_stops,
            driver: bus.driver_name,
            capacity: bus.capacity,
            occupancy: bus.current_occupancy,
            // Add all stop names for search
            allStopNames: stopNames
          };
        });
        
        console.log('✅ Transformed buses:', transformedBuses);
        setBusPositions(transformedBuses);
      } catch (error) {
        console.error('Error fetching buses:', error);
        toast.error('Failed to load bus data');
      } finally {
  // setLoading(false); // Removed unused reference
      }
    };

    fetchBuses();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchBuses, 30000);

    return () => clearInterval(interval);
  }, []);

  // Filter buses based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredBuses([]); // Don't show buses until searchQuery is set
    } else {
      let filtered = [];
      // ...existing code for filtering...
      if (searchQuery.includes(' to ')) {
        const [fromStop, toStop] = searchQuery.split(' to ');
        filtered = busPositions.filter(bus => {
          const allStops = bus.allStopNames || [...bus.completedStops, bus.nextStop, ...bus.upcomingStops];
          const hasFromStop = allStops.some((stop: string) => stop && fromStop && stop.toLowerCase().includes(fromStop.toLowerCase()));
          const hasToStop = allStops.some((stop: string) => stop && toStop && stop.toLowerCase().includes(toStop.toLowerCase()));
          return hasFromStop && hasToStop;
        });
      } else if (searchQuery.startsWith('from ')) {
        const stopName = searchQuery.replace('from ', '');
        filtered = busPositions.filter(bus => {
          const allStops = bus.allStopNames || [...bus.completedStops, bus.nextStop, ...bus.upcomingStops];
          return allStops.some((stop: string) => stop && stopName && stop.toLowerCase().includes(stopName.toLowerCase()));
        });
      } else if (searchQuery.startsWith('to ')) {
        const stopName = searchQuery.replace('to ', '');
        filtered = busPositions.filter(bus => {
          const allStops = bus.allStopNames || [...bus.completedStops, bus.nextStop, ...bus.upcomingStops];
          return allStops.some((stop: string) => stop && stopName && stop.toLowerCase().includes(stopName.toLowerCase()));
        });
      } else {
        filtered = busPositions.filter(bus => {
          const searchLower = searchQuery.toLowerCase();
          const allStops = bus.allStopNames || [...bus.completedStops, bus.nextStop, ...bus.upcomingStops];
          return (
            bus.id.toLowerCase().includes(searchLower) ||
            bus.routeId.toLowerCase().includes(searchLower) ||
            bus.routeName?.toLowerCase().includes(searchLower) ||
            bus.nextStop.toLowerCase().includes(searchLower) ||
            bus.finalDestination.toLowerCase().includes(searchLower) ||
            allStops.some((stop: string) => stop && stop.toLowerCase().includes(searchLower))
          );
        });
      }
      setFilteredBuses(filtered);
    }
  }, [searchQuery, busPositions]);

  // Initialize filteredBuses when busPositions changes
  useEffect(() => {
    if (busPositions.length > 0 && filteredBuses.length === 0 && !searchQuery) {
      setFilteredBuses(busPositions);
    }
  }, [busPositions, filteredBuses.length, searchQuery]);

  const handleRouteMapView = (routeId: string) => {
    setMapFocusRoute(routeId);
    // Reset focus after animation
    setTimeout(() => setMapFocusRoute(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Search Bar */}
        <div className="mb-6 sm:mb-8">
          <SearchBar 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            busCount={filteredBuses.length}
            hasSearched={hasSearched}
            setHasSearched={setHasSearched}
          />
        </div>

  {/* Found Buses List */}
  {hasSearched && searchQuery.includes(' to ') && filteredBuses.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 sm:p-6 border-b bg-gradient-to-r from-green-50 to-blue-50">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Found {filteredBuses.length} Bus{filteredBuses.length !== 1 ? 'es' : ''}
                </h2>
                <p className="text-gray-600 mt-1 text-sm">Click on a bus to see details</p>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                  {filteredBuses.map((bus) => (
                    <div 
                      key={bus.id}
                      className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <i className="ri-bus-line text-blue-600 text-xl"></i>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">Bus #{bus.id}</h3>
                              <p className="text-sm text-gray-600">{bus.routeName || 'Route ' + bus.routeId}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <div className="flex items-center text-sm">
                              <i className="ri-map-pin-line text-blue-600 mr-2"></i>
                              <span className="text-gray-600">Next Stop:</span>
                              <span className="font-medium text-gray-900 ml-1">{bus.nextStop}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <i className="ri-flag-line text-green-600 mr-2"></i>
                              <span className="text-gray-600">Destination:</span>
                              <span className="font-medium text-gray-900 ml-1">{bus.finalDestination}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <i className="ri-time-line text-purple-600 mr-2"></i>
                              <span className="text-gray-600">ETA:</span>
                              <span className="font-medium text-gray-900 ml-1">{bus.eta} min</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <i className="ri-user-line text-orange-600 mr-2"></i>
                              <span className="text-gray-600">Driver:</span>
                              <span className="font-medium text-gray-900 ml-1">{bus.driver || 'N/A'}</span>
                            </div>
                          </div>
                          {/* Action Buttons */}
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex flex-wrap gap-2">
                              <button
                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors flex items-center gap-2"
                                onClick={() => {
                                  setSelectedRoute(bus.routeId);
                                  handleRouteMapView(bus.routeId);
                                }}
                              >
                                <i className="ri-route-line"></i>
                                {bus.routeName || 'Route ' + bus.routeId}
                              </button>
                              <button
                                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200 transition-colors flex items-center gap-2"
                                onClick={() => {
                                  // Navigate to live-tracking page with route pre-selected
                                  navigate('/live-tracking', { state: { selectedRoute: bus.routeId } });
                                }}
                              >
                                <i className="ri-map-pin-user-line"></i>
                                Live Tracking
                              </button>
                              <button
                                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-semibold hover:bg-purple-200 transition-colors flex items-center gap-2"
                                onClick={() => {
                                  // Scroll to timeline section
                                  const timeline = document.querySelector('[data-timeline-container]');
                                  timeline?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  setSelectedRoute(bus.routeId);
                                }}
                              >
                                <i className="ri-time-line"></i>
                                Timeline
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            bus.status === 'on-time' ? 'bg-green-100 text-green-700' :
                            bus.status === 'delayed' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {bus.status === 'on-time' ? 'On Time' : bus.status === 'delayed' ? 'Delayed' : 'Early'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

  {/* No Results Message */}
  {hasSearched && searchQuery.includes(' to ') && filteredBuses.length === 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-bus-line text-gray-400 text-3xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Buses Found</h3>
              <p className="text-gray-600">Try searching for a different route or stop</p>
            </div>
          </div>
        )}

        {/* Bus Routes Section - Full Width */}
        <div className="mb-6 sm:mb-8">
          <RouteSelector 
            selectedRoute={selectedRoute}
            onRouteSelect={setSelectedRoute}
            onRouteMapView={handleRouteMapView}
          />
        </div>

        {/* Main Map Area - Full Width */}
        <div className="mb-6 sm:mb-8" data-map-container>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 sm:p-6 border-b">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Live Bus Tracking</h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Real-time bus positions and predicted arrivals</p>
            </div>
            <BusMap 
              selectedRoute={selectedRoute}
              busPositions={filteredBuses}
              setBusPositions={setBusPositions}
              focusRoute={mapFocusRoute}
            />
          </div>
        </div>

        {/* Timeline Section - Full Width */}
        <div className="mb-6 sm:mb-8" data-timeline-container>
          <BusTimeline selectedRoute={selectedRoute} />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mt-6 sm:mt-8">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="ri-bus-line text-green-600 text-lg sm:text-xl"></i>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">On Time</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">18</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="ri-time-line text-yellow-600 text-lg sm:text-xl"></i>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Minor Delays</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">4</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="ri-alert-line text-red-600 text-lg sm:text-xl"></i>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Major Delays</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">2</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="ri-user-line text-purple-600 text-lg sm:text-xl"></i>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Students Tracking</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">1,247</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
