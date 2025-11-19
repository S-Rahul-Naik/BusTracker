
import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../../lib/api';
import { toast } from 'react-hot-toast';
import RouteMap from '../../../components/map/RouteMap';

interface Route {
  id: string;
  name: string;
  description: string;
  frequency: string;
  operatingHours: string;
  direction: string;
  stops: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    order: number;
  }>;
  color: string;
  status: 'active' | 'inactive' | 'maintenance';
  distance?: string;
  duration?: string;
  // College bus specific timings
  morningTripTime?: string;
  halfDayTripTime?: string;
  eveningTripTime?: string;
  examEveningTime?: string;
  useGlobalSchedule?: boolean;
}

interface MapStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  order: number;
}

interface RouteData {
  stops: MapStop[];
  distance: string;
  duration: string;
  routePath: string;
}

export default function RouteManagement() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [showMapPreview, setShowMapPreview] = useState(false);
  const [showMapEditor, setShowMapEditor] = useState(false);
  const [selectedRouteForMap, setSelectedRouteForMap] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<RouteData>({
    stops: [],
    distance: '',
    duration: '',
    routePath: ''
  });
  const [newRoute, setNewRoute] = useState({
    name: '',
    description: '',
    frequency: '',
    operatingHours: 'N/A', // Not used for college buses
    direction: 'bidirectional',
    stops: [] as MapStop[],
    color: 'blue',
    distance: '',
    duration: '',
    // College bus specific timings
    morningTripTime: '7:00 AM',
    halfDayTripTime: '1:00 PM',
    eveningTripTime: '4:45 PM',
    examEveningTime: '5:20 PM',
    useGlobalSchedule: true // Use global timings by default
  });

  const [globalSchedule, setGlobalSchedule] = useState({
    morningTripTime: '7:00 AM',
    halfDayTripTime: '1:00 PM',
    eveningTripTime: '4:45 PM',
    examEveningTime: '5:20 PM'
  });
  
  // Custom stop management
  const [customStops, setCustomStops] = useState<MapStop[]>([]);
  const [newStopName, setNewStopName] = useState('');
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [placeSuggestions, setPlaceSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const searchTimeoutRef = useRef<any>(null);

  // Load routes from backend on component mount
  useEffect(() => {
    loadRoutes();
    loadGlobalSchedule();
    
    // Initialize Google Places Autocomplete
    if ((window as any).google) {
      autocompleteService.current = new (window as any).google.maps.places.AutocompleteService();
      placesService.current = new (window as any).google.maps.places.PlacesService(
        document.createElement('div')
      );
    }
  }, []);

  const loadGlobalSchedule = async () => {
    try {
      const response = await apiClient.get('/admin/global-schedule');
      if (response.data) {
        setGlobalSchedule(response.data);
        // Update new route with global schedule if using global
        if (newRoute.useGlobalSchedule) {
          setNewRoute(prev => ({
            ...prev,
            morningTripTime: response.data.morningTripTime,
            halfDayTripTime: response.data.halfDayTripTime,
            eveningTripTime: response.data.eveningTripTime,
            examEveningTime: response.data.examEveningTime
          }));
        }
      }
    } catch (error) {
      console.error('Error loading global schedule:', error);
      // Use defaults if not found
    }
  };

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const routesData = await apiClient.getRoutes();
      // Cast the routes data to match our local Route interface
      setRoutes(routesData as any);
    } catch (error) {
      console.error('Failed to load routes:', error);
      toast.error('Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const colorOptions = [
    { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
    { value: 'green', label: 'Green', class: 'bg-green-500' },
    { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
    { value: 'red', label: 'Red', class: 'bg-red-500' },
    { value: 'yellow', label: 'Yellow', class: 'bg-yellow-500' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submit clicked!');
    console.log('Custom stops:', customStops);
    console.log('New route data:', newRoute);
    console.log('Editing route ID:', editingRouteId);
    
    // Use customStops since that's what we're building in the map
    if (customStops.length < 2) {
      toast.error('Please add at least 2 stops using the map builder.');
      return;
    }
    
    // Validate required fields
    if (!newRoute.name || !newRoute.description || !newRoute.frequency || !newRoute.operatingHours) {
      toast.error('Please fill in all required fields (Name, Description, Frequency, Operating Hours)');
      return;
    }
    
    // Make sure stops are synced with newRoute
    const routeToSubmit = {
      ...newRoute,
      stops: customStops
    };
    
    console.log(editingRouteId ? 'Updating route:' : 'Creating route:', routeToSubmit);
    
    try {
      if (editingRouteId) {
        // Update existing route
        await apiClient.updateRoute(editingRouteId, routeToSubmit);
        
        console.log('Route updated successfully');
        
        // Update the route in local state
        setRoutes(prev => prev.map(r => 
          r.id === editingRouteId 
            ? { ...r, ...routeToSubmit } 
            : r
        ));
        
        toast.success('Route updated successfully! 🚌');
        setEditingRouteId(null);
      } else {
        // Create new route
        const createdRoute = await apiClient.createRoute(routeToSubmit);
        
        console.log('Route created successfully:', createdRoute);
        
        // Add the created route to local state
        const route: Route = {
          id: createdRoute.id,
          ...routeToSubmit,
          status: 'active'
        };

        setRoutes(prev => [...prev, route]);
        
        toast.success('Route created successfully! 🚌');
      }
      
      // Reset form and clear stops
      setNewRoute({
        name: '',
        description: '',
        frequency: '',
        operatingHours: 'N/A',
        direction: 'bidirectional',
        stops: [],
        color: 'blue',
        distance: '',
        duration: '',
        morningTripTime: globalSchedule.morningTripTime,
        halfDayTripTime: globalSchedule.halfDayTripTime,
        eveningTripTime: globalSchedule.eveningTripTime,
        examEveningTime: globalSchedule.examEveningTime,
        useGlobalSchedule: true
      });
      setCustomStops([]);
      setRouteData({ stops: [], distance: '', duration: '', routePath: '' });
      setShowAddForm(false);
    } catch (error: any) {
      console.error(editingRouteId ? 'Failed to update route:' : 'Failed to create route:', error);
      toast.error(error.response?.data?.detail || `Failed to ${editingRouteId ? 'update' : 'create'} route. Please try again.`);
    }
  };

  const handlePreviewRoute = (routeId: string) => {
    setSelectedRouteForMap(routeId);
    setShowMapPreview(true);
  };

  const handleOpenMapEditor = () => {
    setCustomStops(newRoute.stops);
    setRouteData({
      stops: newRoute.stops,
      distance: newRoute.distance,
      duration: newRoute.duration,
      routePath: ''
    });
    setShowMapEditor(true);
  };

  const handleSaveMapStops = () => {
    setNewRoute(prev => ({ 
      ...prev, 
      stops: routeData.stops,
      distance: routeData.distance,
      duration: routeData.duration
    }));
    setShowMapEditor(false);
  };

  const handleDeleteRoute = async (routeId: string, routeName: string) => {
    if (!confirm(`Are you sure you want to delete route "${routeName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.deleteRoute(routeId);
      toast.success('Route deleted successfully');
      loadRoutes();
    } catch (error) {
      console.error('Failed to delete route:', error);
      toast.error('Failed to delete route');
    }
  };

  const handleEditRoute = (route: any) => {
    setEditingRouteId(route.id);
    setNewRoute({
      name: route.name,
      description: route.description,
      color: route.color,
      direction: route.direction,
      stops: route.stops || [],
      distance: route.distance || '',
      duration: route.duration || '',
      frequency: route.frequency || 0,
      useGlobalSchedule: route.useGlobalSchedule !== false,
      morningTripTime: route.morningTripTime || '7:00 AM',
      halfDayTripTime: route.halfDayTripTime || '1:00 PM',
      eveningTripTime: route.eveningTripTime || '4:45 PM',
      examEveningTime: route.examEveningTime || '5:20 PM',
      operatingHours: route.operatingHours || 'N/A'
    });
    setShowAddForm(true);
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle adding stops manually - not used with templates anymore  // Add custom stop function
  const handleAddCustomStop = async () => {
    if (!newStopName.trim()) {
      toast.error('Please enter a stop name');
      return;
    }

    setSearchingLocation(true);
    
    // Simulate geocoding (in real app, use Google Maps Geocoding API)
    setTimeout(() => {
      const newStop: MapStop = {
        id: `stop-${Date.now()}`,
        name: newStopName,
        lat: 15.1394 + (Math.random() - 0.5) * 0.05, // Random lat near Ballari
        lng: 76.9214 + (Math.random() - 0.5) * 0.05, // Random lng near Ballari
        order: customStops.length + 1
      };
      
      const updatedStops = [...customStops, newStop];
      setCustomStops(updatedStops);
      
      // Update route data
      setRouteData(prev => ({
        ...prev,
        stops: updatedStops,
        distance: `${(updatedStops.length * 1.5).toFixed(1)} km`,
        duration: `${updatedStops.length * 5} min`
      }));
      
      setNewRoute(prev => ({
        ...prev,
        stops: updatedStops
      }));
      
      setNewStopName('');
      setShowSuggestions(false);
      setSearchingLocation(false);
      toast.success(`Stop "${newStop.name}" added!`);
    }, 1000);
  };

  // Handle place search with OpenStreetMap Nominatim (FREE, no API key needed)
  const handlePlaceSearch = (value: string) => {
    setNewStopName(value);
    
    if (value.length < 2) {
      setPlaceSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce the API call
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Use Geoapify Autocomplete API - better place data than Nominatim
        const GEOAPIFY_API_KEY = 'd74bec8d5ac4405dbb427b8f32afc6de';
        
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?` +
          `text=${encodeURIComponent(value)}` +
          `&filter=rect:76.85,15.10,77.00,15.20` + // Ballari bounding box
          `&bias=proximity:76.9214,15.1394` + // Bias towards Ballari center
          `&limit=10` +
          `&apiKey=${GEOAPIFY_API_KEY}`
        );

        const data = await response.json();
        
        // Geoapify returns results in 'features' array
        const suggestions = (data.features || []).map((feature: any) => ({
          structured_formatting: {
            main_text: feature.properties.name || feature.properties.address_line1 || feature.properties.formatted,
            secondary_text: feature.properties.address_line2 || feature.properties.city || ''
          },
          place_id: feature.properties.place_id,
          place_data: {
            name: feature.properties.name || feature.properties.address_line1 || feature.properties.formatted,
            address: feature.properties.formatted,
            lat: feature.properties.lat,
            lng: feature.properties.lon
          }
        }));

        setPlaceSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch (error) {
        console.error('Error searching places:', error);
        setPlaceSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms debounce for better performance
  };

  // Handle place selection
  const handlePlaceSelect = (place: any) => {
    setSearchingLocation(true);
    
    const placeData = place.place_data;
    const newStop: MapStop = {
      id: `stop-${Date.now()}`,
      name: placeData.name,
      lat: placeData.lat,
      lng: placeData.lng,
      order: customStops.length + 1
    };
    
    const updatedStops = [...customStops, newStop];
    setCustomStops(updatedStops);
    
    // Update route data (distance and duration will come from routing engine)
    setRouteData(prev => ({
      ...prev,
      stops: updatedStops
    }));
    
    setNewRoute(prev => ({
      ...prev,
      stops: updatedStops
    }));
    
    setNewStopName('');
    setPlaceSuggestions([]);
    setShowSuggestions(false);
    setSearchingLocation(false);
    toast.success(`Stop "${newStop.name}" added!`);
  };

  const handleRemoveStop = (stopId: string) => {
    const updatedStops = customStops.filter(s => s.id !== stopId).map((s, idx) => ({
      ...s,
      order: idx + 1
    }));
    
    setCustomStops(updatedStops);
    setRouteData(prev => ({
      ...prev,
      stops: updatedStops
    }));
    setNewRoute(prev => ({
      ...prev,
      stops: updatedStops
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Route Management</h2>
          <p className="text-gray-600">Manage bus routes with Google Maps integration</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (showAddForm) {
              setEditingRouteId(null);
              setNewRoute({
                name: '',
                description: '',
                frequency: '',
                operatingHours: 'N/A',
                direction: 'bidirectional',
                stops: [],
                color: 'blue',
                distance: '',
                duration: '',
                morningTripTime: globalSchedule.morningTripTime,
                halfDayTripTime: globalSchedule.halfDayTripTime,
                eveningTripTime: globalSchedule.eveningTripTime,
                examEveningTime: globalSchedule.examEveningTime,
                useGlobalSchedule: true
              });
              setCustomStops([]);
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          <i className="ri-add-line mr-2"></i>
          {showAddForm ? 'Cancel' : 'Add New Route'}
        </button>
      </div>

      {/* Add/Edit Route Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingRouteId ? 'Edit Route' : 'Add New Route'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route Name *</label>
                <input
                  required
                  type="text"
                  value={newRoute.name}
                  onChange={(e) => setNewRoute(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Route 42"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
                <input
                  required
                  type="text"
                  value={newRoute.frequency}
                  onChange={(e) => setNewRoute(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 15 minutes"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <input
                required
                type="text"
                value={newRoute.description}
                onChange={(e) => setNewRoute(prev => ({ ...prev, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Main Campus ↔ Engineering Building"
              />
            </div>

            {/* College Bus Trip Timings */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <i className="ri-bus-line text-blue-600"></i>
                    College Bus Trip Timings
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure departure times for this route
                  </p>
                </div>
                
                {/* Toggle: Use Global vs Custom */}
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRoute.useGlobalSchedule}
                      onChange={(e) => {
                        const useGlobal = e.target.checked;
                        setNewRoute(prev => ({
                          ...prev,
                          useGlobalSchedule: useGlobal,
                          ...(useGlobal ? {
                            morningTripTime: globalSchedule.morningTripTime,
                            halfDayTripTime: globalSchedule.halfDayTripTime,
                            eveningTripTime: globalSchedule.eveningTripTime,
                            examEveningTime: globalSchedule.examEveningTime
                          } : {})
                        }));
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {newRoute.useGlobalSchedule ? '🌍 Use Global Timings' : '✏️ Custom Timings'}
                    </span>
                  </label>
                </div>
              </div>

              {newRoute.useGlobalSchedule && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <i className="ri-information-line text-blue-600 mt-0.5"></i>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Using Global Timings</p>
                      <p className="mt-1">This route will use the default timings set in Global Schedule Settings.</p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div>🌅 Morning: <strong>{globalSchedule.morningTripTime}</strong></div>
                        <div>🕐 Half Day: <strong>{globalSchedule.halfDayTripTime}</strong></div>
                        <div>🌆 Evening: <strong>{globalSchedule.eveningTripTime}</strong></div>
                        <div>📝 Exam: <strong>{globalSchedule.examEveningTime}</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Morning Trip - Always Fixed */}
                <div className={`p-4 rounded-lg border ${newRoute.useGlobalSchedule ? 'bg-gray-50 border-gray-300' : 'bg-blue-50 border-blue-200'}`}>
                  <label className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-2xl">🌅</span>
                    Morning Trip (To College) - FIXED
                  </label>
                  <input
                    type="text"
                    value={newRoute.morningTripTime}
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed text-gray-600"
                    placeholder="e.g., 7:00 AM"
                  />
                  <p className="text-xs text-gray-600 mt-1">Morning time is always fixed at 7:00 AM</p>
                </div>

                {/* Half Day Trip */}
                <div className={`p-4 rounded-lg border ${newRoute.useGlobalSchedule ? 'bg-gray-50 border-gray-300' : 'bg-orange-50 border-orange-200'}`}>
                  <label className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-2xl">🕐</span>
                    Half Day Trip (From College) *
                  </label>
                  <input
                    required
                    type="text"
                    value={newRoute.halfDayTripTime}
                    onChange={(e) => setNewRoute(prev => ({ ...prev, halfDayTripTime: e.target.value }))}
                    disabled={newRoute.useGlobalSchedule}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                      newRoute.useGlobalSchedule 
                        ? 'border-gray-300 bg-gray-100 cursor-not-allowed text-gray-600' 
                        : 'border-orange-300 focus:ring-orange-500'
                    }`}
                    placeholder="e.g., 1:00 PM"
                  />
                  <p className="text-xs text-gray-600 mt-1">Early dismissal time</p>
                </div>

                {/* Evening Trip - Normal */}
                <div className={`p-4 rounded-lg border ${newRoute.useGlobalSchedule ? 'bg-gray-50 border-gray-300' : 'bg-purple-50 border-purple-200'}`}>
                  <label className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-2xl">🌆</span>
                    Evening Trip - Normal (From College) *
                  </label>
                  <input
                    required
                    type="text"
                    value={newRoute.eveningTripTime}
                    onChange={(e) => setNewRoute(prev => ({ ...prev, eveningTripTime: e.target.value }))}
                    disabled={newRoute.useGlobalSchedule}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                      newRoute.useGlobalSchedule 
                        ? 'border-gray-300 bg-gray-100 cursor-not-allowed text-gray-600' 
                        : 'border-purple-300 focus:ring-purple-500'
                    }`}
                    placeholder="e.g., 4:45 PM"
                  />
                  <p className="text-xs text-gray-600 mt-1">Regular day departure time</p>
                </div>

                {/* Evening Trip - Exam Days */}
                <div className={`p-4 rounded-lg border ${newRoute.useGlobalSchedule ? 'bg-gray-50 border-gray-300' : 'bg-red-50 border-red-200'}`}>
                  <label className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-2xl">📝</span>
                    Evening Trip - Exam Days (From College) *
                  </label>
                  <input
                    required
                    type="text"
                    value={newRoute.examEveningTime}
                    onChange={(e) => setNewRoute(prev => ({ ...prev, examEveningTime: e.target.value }))}
                    disabled={newRoute.useGlobalSchedule}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                      newRoute.useGlobalSchedule 
                        ? 'border-gray-300 bg-gray-100 cursor-not-allowed text-gray-600' 
                        : 'border-red-300 focus:ring-red-500'
                    }`}
                    placeholder="e.g., 5:20 PM"
                  />
                  <p className="text-xs text-gray-600 mt-1">Departure time when exams are scheduled</p>
                </div>
              </div>

              <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                <div className="flex">
                  <i className="ri-information-line text-yellow-700 mr-2"></i>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Important Notes:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Morning time (7:00 AM) is fixed for all buses and cannot be changed</li>
                      <li>Toggle "Use Global Timings" to use default schedule or set custom times</li>
                      <li>All buses on this route depart at the same time</li>
                      <li>Evening time varies based on regular days vs exam days</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Route Color *</label>
              <div className="flex space-x-3">
                {colorOptions.map((color) => (
                  <label
                    key={color.value}
                    className={`relative w-12 h-12 rounded-lg cursor-pointer transition-all hover:scale-110 ${
                      newRoute.color === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="color"
                      value={color.value}
                      checked={newRoute.color === color.value}
                      onChange={(e) => setNewRoute(prev => ({ ...prev, color: e.target.value }))}
                      className="sr-only"
                    />
                    <div className={`w-full h-full rounded-lg ${color.class} flex items-center justify-center`}>
                      {newRoute.color === color.value && (
                        <i className="ri-check-line text-white text-lg"></i>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Google Maps Route Builder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Route Path & Stops *</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <i className="ri-map-2-line text-4xl text-gray-400 mb-4"></i>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Google Maps Route Builder</h4>
                  <p className="text-gray-600 mb-4">Select a template above or create custom route with accurate directions</p>
                  
                  {newRoute.stops.length > 0 && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{newRoute.stops.length}</div>
                          <div className="text-sm text-gray-600">Stops</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{newRoute.distance}</div>
                          <div className="text-sm text-gray-600">Distance</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-orange-600">{newRoute.duration}</div>
                          <div className="text-sm text-gray-600">Duration</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={handleOpenMapEditor}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    <i className="ri-map-line mr-2"></i>
                    {newRoute.stops.length > 0 ? 'Edit Route on Map' : 'Open Route Builder'}
                  </button>
                </div>
              </div>
              
              {newRoute.stops.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-semibold text-gray-900 mb-3">Route Stops</h5>
                  <div className="space-y-2">
                    {newRoute.stops.map((stop, index) => (
                      <div key={stop.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{stop.name}</div>
                          <div className="text-sm text-gray-500">
                            {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                          </div>
                        </div>
                        {index < newRoute.stops.length - 1 && (
                          <div className="text-gray-400">
                            <i className="ri-arrow-right-line"></i>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex space-x-4 pt-4 border-t">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <i className="ri-save-line mr-2"></i>
                Create Route
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Google Maps Route Editor Modal */}
      {showMapEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col my-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Google Maps Route Builder</h3>
                <p className="text-gray-600 text-sm mt-1">Create accurate bus routes with real directions and timing</p>
              </div>
              <button
                onClick={() => setShowMapEditor(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            {/* Map and Route Info Container - Scrollable */}
            <div className="flex-1 flex overflow-hidden" style={{ minHeight: '500px', maxHeight: 'calc(95vh - 300px)' }}>
              {/* Interactive Route Map with Leaflet */}
              <div className="flex-1 relative overflow-hidden rounded-bl-xl">
                <RouteMap 
                  stops={customStops} 
                  onRouteCalculated={(distance, duration) => {
                    setRouteData(prev => ({
                      ...prev,
                      distance,
                      duration
                    }));
                    // Auto-update frequency field with calculated duration
                    setNewRoute(prev => ({
                      ...prev,
                      frequency: duration,
                      distance,
                      duration
                    }));
                  }}
                />
              </div>

              {/* Route Details Panel */}
              <div className="w-96 bg-gray-50 border-l flex flex-col h-full overflow-hidden">
                <div className="p-3 border-b bg-white flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">Route Details</h4>
                    {customStops.length > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                        {customStops.length} stops
                      </span>
                    )}
                  </div>

                  {/* Add Custom Stop Section */}
                  <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2 flex items-center text-xs">
                      <i className="ri-add-circle-line text-blue-600 mr-1"></i>
                      Add Bus Stop
                    </h5>
                    <div className="space-y-2 relative">
                      <div className="relative">
                        <input
                          ref={autocompleteInputRef}
                          type="text"
                          placeholder="Search for a place (e.g., BITM Hospete Road)"
                          value={newStopName}
                          onChange={(e) => handlePlaceSearch(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !showSuggestions && handleAddCustomStop()}
                          onFocus={() => newStopName.length >= 3 && placeSuggestions.length > 0 && setShowSuggestions(true)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <i className="ri-search-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        
                        {/* Autocomplete Suggestions Dropdown */}
                        {showSuggestions && placeSuggestions.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {placeSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => handlePlaceSelect(suggestion)}
                                className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                              >
                                <div className="flex items-start">
                                  <i className="ri-map-pin-line text-blue-600 mt-1 mr-2 flex-shrink-0"></i>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 text-sm truncate">
                                      {suggestion.structured_formatting.main_text}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {suggestion.structured_formatting.secondary_text}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={handleAddCustomStop}
                        disabled={searchingLocation || !newStopName.trim()}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {searchingLocation ? (
                          <>
                            <i className="ri-loader-4-line animate-spin mr-2"></i>
                            Searching location...
                          </>
                        ) : (
                          <>
                            <i className="ri-map-pin-add-line mr-2"></i>
                            Add Stop to Route
                          </>
                        )}
                      </button>
                    </div>
                    {customStops.length === 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Or select a template above
                      </p>
                    )}
                  </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: '300px', maxHeight: 'calc(100vh - 400px)' }}>
                  {customStops.length > 0 ? (
                    <>
                      {/* Route Summary */}
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div>
                            <div className="text-lg font-bold text-blue-600">{routeData.distance || 'N/A'}</div>
                            <div className="text-xs text-gray-600">Distance</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-600">{routeData.duration || 'N/A'}</div>
                            <div className="text-xs text-gray-600">Duration</div>
                          </div>
                        </div>
                      </div>

                      {/* Stops List */}
                      <div className="space-y-3">
                        {customStops.map((stop, index) => (
                          <div key={stop.id} className="bg-white rounded-lg p-3 shadow-sm border hover:border-blue-300 transition-colors">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-sm">{stop.name}</div>
                                <div className="text-xs text-gray-500">
                                  {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveStop(stop.id)}
                                className="ml-2 text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                title="Remove stop"
                              >
                                <i className="ri-close-line text-lg"></i>
                              </button>
                            </div>
                            {index < customStops.length - 1 && (
                              <div className="flex items-center justify-center mt-2">
                                <div className="flex items-center">
                                  <div className="w-px h-3 bg-blue-300"></div>
                                  <i className="ri-arrow-down-s-line text-blue-500 text-sm mx-1"></i>
                                  <div className="w-px h-3 bg-blue-300"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Route Actions */}
                      <button
                        onClick={() => {
                          setCustomStops([]);
                          setRouteData({ stops: [], distance: '', duration: '', routePath: '' });
                        }}
                        className="w-full text-red-600 hover:bg-red-50 py-2 rounded-lg transition-colors text-sm border border-red-200 hover:border-red-300 font-medium"
                      >
                        <i className="ri-delete-bin-line mr-1"></i>
                        Clear All Stops
                      </button>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center py-8">
                        <i className="ri-map-pin-line text-5xl text-gray-300 mb-3"></i>
                        <p className="text-gray-600 font-medium text-sm mb-2">No stops added yet</p>
                        <p className="text-gray-500 text-xs px-4">
                          Add stops above to build your route
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fixed Save Button at Bottom */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <button
                    onClick={handleSaveMapStops}
                    disabled={customStops.length < 2}
                    className={`w-full py-3 rounded-lg font-medium transition-colors ${
                      customStops.length >= 2
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {customStops.length >= 2 ? (
                      <>
                        <i className="ri-save-line mr-2"></i>
                        Save Route ({customStops.length} stops)
                      </>
                    ) : (
                      <>
                        <i className="ri-map-pin-line mr-2"></i>
                        Add at least 2 stops
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing Routes */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Existing Routes</h3>
          <p className="text-gray-600 mt-1">Manage and monitor current bus routes with Google Maps integration</p>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading routes...</p>
          </div>
        ) : routes.length === 0 ? (
          <div className="p-12 text-center">
            <i className="ri-route-line text-6xl text-gray-300"></i>
            <p className="mt-4 text-gray-600">No routes yet. Create your first route above!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stops</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {routes.map((route) => (
                <tr key={route.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full mr-3 ${colorOptions.find(c => c.value === route.color)?.class}`}></div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{route.name}</div>
                        <div className="text-sm text-gray-500">{route.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium text-blue-600">{route.distance || 'N/A'}</div>
                      <div className="text-green-600">{route.duration || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{route.frequency}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{route.stops.length} stops</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      route.status === 'active' ? 'bg-green-100 text-green-800' :
                      route.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {route.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handlePreviewRoute(route.id)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <i className="ri-map-line mr-1"></i>
                      View Map
                    </button>
                    <button 
                      onClick={() => handleEditRoute(route)}
                      className="text-gray-600 hover:text-gray-900 bg-gray-50 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <i className="ri-edit-line mr-1"></i>
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteRoute(route.id, route.name)}
                      className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100 transition-colors"
                      title="Delete Route"
                    >
                      <i className="ri-delete-bin-line mr-1"></i>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Map Preview Modal */}
      {showMapPreview && selectedRouteForMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Route Preview</h3>
                <p className="text-gray-600">Interactive map view with live route data</p>
              </div>
              <button
                onClick={() => setShowMapPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <i className="ri-close-line text-gray-600 text-xl"></i>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {/* Route Information */}
              {(() => {
                const route = routes.find(r => r.id === selectedRouteForMap);
                return route ? (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full mr-3 ${colorOptions.find(c => c.value === route.color)?.class}`}></div>
                        <h4 className="text-lg font-semibold text-gray-900">{route.name}</h4>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-3">{route.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Distance:</span>
                        <span className="ml-2 font-medium text-blue-600">{route.distance || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <span className="ml-2 font-medium text-green-600">{route.duration || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Frequency:</span>
                        <span className="ml-2 font-medium">{route.frequency}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Stops:</span>
                        <span className="ml-2 font-medium">{route.stops.length}</span>
                      </div>
                    </div>
                    
                    {/* College Bus Trip Timings */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <i className="ri-time-line text-blue-600"></i>
                        Trip Timings {route.useGlobalSchedule && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">🌍 Global</span>}
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🌅</span>
                          <div>
                            <div className="text-gray-500 text-xs">Morning</div>
                            <div className="font-medium text-gray-900">{route.morningTripTime || '7:00 AM'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🕐</span>
                          <div>
                            <div className="text-gray-500 text-xs">Half Day</div>
                            <div className="font-medium text-gray-900">{route.halfDayTripTime || '1:00 PM'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🌆</span>
                          <div>
                            <div className="text-gray-500 text-xs">Evening</div>
                            <div className="font-medium text-gray-900">{route.eveningTripTime || '4:45 PM'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📝</span>
                          <div>
                            <div className="text-gray-500 text-xs">Exam</div>
                            <div className="font-medium text-gray-900">{route.examEveningTime || '5:20 PM'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Interactive Route Map */}
              <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden mb-6">
                {(() => {
                  const route = routes.find(r => r.id === selectedRouteForMap);
                  return route ? (
                    <RouteMap stops={route.stops} />
                  ) : null;
                })()}

                {/* Live indicator */}
                <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2 z-[1000]">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-xs text-gray-600 font-medium">Live Route Preview</span>
                  </div>
                </div>

                {/* Route Info */}
                {(() => {
                  const route = routes.find(r => r.id === selectedRouteForMap);
                  return route?.distance && route?.duration ? (
                    <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="text-center">
                          <div className="font-bold text-blue-600">{route.distance}</div>
                          <div className="text-xs text-gray-600">Distance</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-green-600">{route.duration}</div>
                          <div className="text-xs text-gray-600">Duration</div>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Route Stops */}
              {(() => {
                const route = routes.find(r => r.id === selectedRouteForMap);
                return route ? (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-900 mb-3">Route Stops</h5>
                    <div className="space-y-2">
                      {route.stops.map((stop, index) => (
                        <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{stop.name}</div>
                            <div className="text-sm text-gray-500">
                              {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                            </div>
                          </div>
                          {index < route.stops.length - 1 && (
                            <div className="text-gray-400">
                              <i className="ri-arrow-right-line"></i>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
