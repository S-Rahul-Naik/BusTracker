
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import apiClient from '../../../lib/api';
import SubscriptionModal from './SubscriptionModal';

interface Route {
  id: string;
  name: string;
  description: string;
  activeBuses: number;
  avgDelay: number;
  color: string;
  totalStops: number;
  status: 'active' | 'delayed' | 'maintenance';
}

interface RouteSelectorProps {
  selectedRoute: string | null;
  onRouteSelect: (routeId: string | null) => void;
  onRouteMapView?: (routeId: string) => void;
}

export default function RouteSelector({ selectedRoute, onRouteSelect, onRouteMapView }: RouteSelectorProps) {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real routes from API
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getRoutes();
        
        // Transform API data to match component structure
        const transformedRoutes = data.map((route: any) => ({
          id: route.id,
          name: route.name,
          description: route.description || `${route.stops?.[0]?.name || 'Start'} ↔ ${route.stops?.[route.stops?.length - 1]?.name || 'End'}`,
          activeBuses: route.active_buses || 0,
          avgDelay: route.average_delay || 0,
          color: route.color || 'bg-blue-500',
          totalStops: route.stops?.length || 0,
          status: route.status || (route.average_delay > 5 ? 'delayed' : 'active')
        }));
        
        setRoutes(transformedRoutes);
      } catch (error) {
        console.error('Error fetching routes:', error);
        toast.error('Failed to load routes');
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
    
    // Refresh routes every 2 minutes
    const interval = setInterval(fetchRoutes, 120000);
    return () => clearInterval(interval);
  }, []);

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  const totalActiveBuses = routes.reduce((sum, route) => sum + route.activeBuses, 0);

  const handleAllRoutesClick = () => {
    onRouteSelect(null);
    setExpandedRoute(null);
    // Show notification feedback
    const button = document.querySelector('[data-all-routes]') as HTMLElement;
    if (button) {
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = 'scale(1)';
      }, 150);
    }
  };

  const handleRouteClick = (routeId: string) => {
    onRouteSelect(routeId);
    setExpandedRoute(expandedRoute === routeId ? null : routeId);
    
    // Add visual feedback
    const button = document.querySelector(`[data-route="${routeId}"]`) as HTMLElement;
    if (button) {
      button.style.transform = 'scale(0.98)';
      setTimeout(() => {
        button.style.transform = 'scale(1)';
      }, 150);
    }
  };

  const handleViewRouteMap = (routeId: string) => {
    // First select the route
    onRouteSelect(routeId);
    // Then trigger map focus
    if (onRouteMapView) {
      onRouteMapView(routeId);
    }
    // Scroll to map section
    const mapElement = document.querySelector('[data-map-container]');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleScheduleClick = (routeId: string) => {
    // Navigate to schedule page with the specific route
    navigate(`/schedule?route=${routeId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delayed': return 'ri-time-line text-yellow-600';
      case 'maintenance': return 'ri-tools-line text-red-600';
      default: return 'ri-check-line text-green-600';
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Bus Routes</h2>
          <p className="text-gray-600 mt-1">Select a route to track</p>
        </div>
        
        <div className="p-4">
          <button
            data-all-routes
            onClick={handleAllRoutesClick}
            className={`w-full text-left p-4 rounded-lg mb-3 transition-all duration-200 hover:shadow-md ${
              selectedRoute === null 
                ? 'bg-blue-50 border-2 border-blue-200 shadow-sm' 
                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-400 rounded-full mr-3"></div>
                <div>
                  <div className="font-semibold text-gray-900">All Routes</div>
                  <div className="text-sm text-gray-600">View all active buses</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{totalActiveBuses} buses</div>
                <div className="text-xs text-gray-500">Total active</div>
              </div>
            </div>
          </button>

          <div className="space-y-3">
            {routes.map((route) => (
              <div key={route.id}>
                <button
                  data-route={route.id}
                  onClick={() => handleRouteClick(route.id)}
                  className={`w-full text-left p-4 rounded-lg transition-all duration-200 hover:shadow-md ${
                    selectedRoute === route.id 
                      ? 'bg-blue-50 border-2 border-blue-200 shadow-sm' 
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 ${route.color} rounded-full mr-3`}></div>
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center">
                          {route.name}
                          <i className={`ml-2 text-sm ${getStatusIcon(route.status)}`}></i>
                        </div>
                        <div className="text-sm text-gray-600">{route.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{route.activeBuses} buses</div>
                      <div className={`text-xs ${route.avgDelay > 5 ? 'text-red-600' : route.avgDelay > 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {route.avgDelay > 0 ? `+${route.avgDelay}` : route.avgDelay} min avg
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded Route Details */}
                {expandedRoute === route.id && (
                  <div className="mt-2 ml-7 p-3 bg-blue-25 rounded-lg border border-blue-100">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Total Stops:</span>
                        <span className="ml-2 font-medium">{route.totalStops}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className={`ml-2 font-medium capitalize ${
                          route.status === 'active' ? 'text-green-600' :
                          route.status === 'delayed' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {route.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-3">
                      <button 
                        onClick={() => handleViewRouteMap(route.id)}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors whitespace-nowrap"
                      >
                        <i className="ri-map-line mr-1"></i>View Route Map
                      </button>
                      <button 
                        onClick={() => handleScheduleClick(route.id)}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors whitespace-nowrap"
                      >
                        <i className="ri-calendar-line mr-1"></i>Schedule
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50">
          <button 
            onClick={() => setShowSubscriptionModal(true)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <i className="ri-notification-line mr-2"></i>
            Subscribe to Alerts
          </button>
        </div>
      </div>

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        routes={routes}
      />
    </>
  );
}
