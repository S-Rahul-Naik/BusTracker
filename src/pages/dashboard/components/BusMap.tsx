
import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Add custom styles for clickable route lines
const routeLineStyles = `
  .route-line-clickable {
    cursor: pointer !important;
  }
  .leaflet-interactive {
    cursor: pointer !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.innerHTML = routeLineStyles;
  document.head.appendChild(styleEl);
}

interface BusPosition {
  id: string;
  routeId: string;
  routeName?: string;
  position: {
    lat: number;
    lng: number;
  };
  eta: number;
  status: 'on-time' | 'delayed' | 'early';
  nextStop: string;
  delay: number;
  direction: string;
  finalDestination: string;
  completedStops: string[];
  upcomingStops: string[];
  allStopNames?: string[];
  capacity?: number;
  occupancy?: number;
  driver?: string;
}

interface BusStop {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  status: 'completed' | 'next' | 'upcoming';
  eta?: number;
}

interface BusMapProps {
  selectedRoute: string | null;
  busPositions: BusPosition[];
  setBusPositions: (positions: BusPosition[]) => void;
  focusRoute?: string | null;
}

export default function BusMap({ selectedRoute, busPositions, setBusPositions, focusRoute }: BusMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [mapHighlight, setMapHighlight] = useState<string | null>(null);
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [simulatedPositions, setSimulatedPositions] = useState<Map<string, {lat: number, lng: number}>>(new Map());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [busHistory, setBusHistory] = useState<Map<string, {lat: number, lng: number}[]>>(new Map());
  const [clickedRoute, setClickedRoute] = useState<string | null>(null);
  const [busSpeed, setBusSpeed] = useState<Map<string, number>>(new Map());
  const [lastPositions, setLastPositions] = useState<Map<string, {lat: number, lng: number, time: number}>>(new Map());
  const [routeLines, setRouteLines] = useState<Map<string, {lat: number, lng: number}[]>>(new Map());
  const [etaCountdowns, setEtaCountdowns] = useState<Map<string, number>>(new Map());
  const [distanceTraveled, setDistanceTraveled] = useState<Map<string, number>>(new Map());
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showRouteInfo, setShowRouteInfo] = useState(true);
  const [routeDetails, setRouteDetails] = useState<any>(null);
  
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const busMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const routeLinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const trailLinesRef = useRef<Map<string, L.Polyline>>(new Map());
  
  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map centered on Bellary
    const map = L.map(mapContainerRef.current).setView([15.15, 76.92], 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    setMapLoaded(true);

    // Load route lines from API
    const loadRouteLines = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/routes');
        const routes = await response.json();
        
        const lines = new Map();
        
        for (const route of routes) {
          if (route.stops && route.stops.length > 0) {
            const stopCoords = route.stops.map((stop: any) => ({
              lat: stop.lat,
              lng: stop.lng
            }));
            
            // Get road directions from OSRM routing service
            const coordinates = stopCoords.map((c: any) => `${c.lng},${c.lat}`).join(';');
            
            try {
              const routingResponse = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`
              );
              const routingData = await routingResponse.json();
              
              if (routingData.code === 'Ok' && routingData.routes && routingData.routes[0]) {
                // Use the road geometry from OSRM
                const roadCoordinates = routingData.routes[0].geometry.coordinates;
                const roadPath = roadCoordinates.map((coord: number[]) => ({ lat: coord[1], lng: coord[0] }));
                
                // Store the route path data (don't add to map yet)
                lines.set(route.id, roadPath);
              } else {
                // Fallback to straight lines if routing fails
                console.warn('OSRM routing failed for route', route.id, 'using straight lines');
                lines.set(route.id, stopCoords);
              }
            } catch (routingError) {
              console.error('Error fetching road directions:', routingError);
              // Fallback to straight lines
              lines.set(route.id, stopCoords);
            }
          }
        }
        setRouteLines(lines);
      } catch (error) {
        console.error('Error loading route lines:', error);
      }
    };
    
    loadRouteLines();

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Draw only selected route line on map
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || routeLines.size === 0) return;

    const map = mapRef.current;

    // Clear all existing route lines
    routeLinesRef.current.forEach(polyline => polyline.remove());
    routeLinesRef.current.clear();

    // Remove old stop markers
    if (window.stopMarkers && Array.isArray(window.stopMarkers)) {
      window.stopMarkers.forEach((marker: any) => marker.remove());
    }
    window.stopMarkers = [];

    // Draw only the selected route line
    if (selectedRoute && routeLines.has(selectedRoute) && routeDetails?.stops?.length) {
      const routePath = routeLines.get(selectedRoute);
      if (routePath) {
        const latLngs = routePath.map((c: any) => [c.lat, c.lng] as [number, number]);

        const polyline = L.polyline(latLngs, {
          color: '#1E40AF',
          weight: 8,
          opacity: 0.9,
          smoothFactor: 1.0,
          className: 'route-line-clickable'
        }).addTo(map);

        // Make the line clearly clickable
        polyline.on('mouseover', function() {
          this.setStyle({ weight: 10, opacity: 1 });
        });

        polyline.on('mouseout', function() {
          this.setStyle({ weight: 8, opacity: 0.9 });
        });

        // Add click handler to route line
        polyline.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setClickedRoute(prev => prev === selectedRoute ? null : selectedRoute);
        });

        routeLinesRef.current.set(selectedRoute, polyline);

        // Add numbered stop markers
        routeDetails.stops.forEach((stop: any, idx: number) => {
          if (stop.lat && stop.lng) {
            const iconHtml = `
              <div class="w-8 h-8 rounded-full bg-blue-100 border-2 border-blue-400 flex items-center justify-center font-bold text-blue-700 text-base shadow">${idx + 1}</div>
            `;
            const icon = L.divIcon({
              html: iconHtml,
              className: 'stop-marker',
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            });
            const marker = L.marker([stop.lat, stop.lng], { icon }).addTo(map);
            marker.bindPopup(`<div class='font-bold text-sm'>${idx + 1}. ${stop.name || `Stop ${idx + 1}`}</div>`);
            window.stopMarkers.push(marker);
          }
        });
      }
    }
  }, [selectedRoute, routeLines, mapLoaded, routeDetails]);

  // Fetch route details when route is selected
  useEffect(() => {
    const fetchRouteDetails = async () => {
      if (!selectedRoute) {
        setRouteDetails(null);
        return;
      }

      try {
        // Fetch all routes and find the selected one
        const response = await fetch(`http://localhost:8000/api/routes`);
        const routes = await response.json();
        const route = routes.find((r: any) => r.id === selectedRoute);
        
        if (route) {
          setRouteDetails(route);
          setShowRouteInfo(true);
        } else {
          console.warn('Route not found:', selectedRoute);
          setRouteDetails(null);
        }
      } catch (error) {
        console.error('Error fetching route details:', error);
      }
    };

    fetchRouteDetails();
  }, [selectedRoute]);

  // Play notification sound
  const playNotificationSound = () => {
    if (soundEnabled) {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGi77OeeSwwPUKfl8LZjHAU4kNfxzHksBSJ1xu/ekEALFFux6OypVRQLRp/f8r1sIQQpfs/ ');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    }
  };

  // Enhanced movement simulation with speed calculation
  useEffect(() => {
    const simulateMovement = () => {
      const now = Date.now();
      
      busPositions.forEach(bus => {
        const currentPos = simulatedPositions.get(bus.id) || bus.position;
        const lastPos = lastPositions.get(bus.id);
        
        // Calculate movement (simulate bus moving along route)
        const movementSpeed = 0.0003; // ~30 meters per update
        const angle = Math.random() * Math.PI * 2; // Random direction for now
        const newLat = currentPos.lat + Math.cos(angle) * movementSpeed;
        const newLng = currentPos.lng + Math.sin(angle) * movementSpeed;
        
        // Calculate speed if we have last position
        if (lastPos) {
          const timeDiff = (now - lastPos.time) / 1000; // seconds
          const latDiff = newLat - lastPos.lat;
          const lngDiff = newLng - lastPos.lng;
          const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000; // Convert to meters
          const speed = distance / timeDiff; // m/s
          setBusSpeed(prev => new Map(prev).set(bus.id, speed));
          
          // Update distance traveled
          setDistanceTraveled(prev => new Map(prev).set(
            bus.id, 
            (prev.get(bus.id) || 0) + distance
          ));
        }
        
        // Store in history for trail
        setBusHistory(prev => {
          const history = prev.get(bus.id) || [];
          const newHistory = [...history, currentPos].slice(-20); // Keep last 20 positions
          return new Map(prev).set(bus.id, newHistory);
        });
        
        // Update position
        setSimulatedPositions(prev => new Map(prev).set(bus.id, {
          lat: newLat,
          lng: newLng
        }));
        
        setLastPositions(prev => new Map(prev).set(bus.id, {
          lat: newLat,
          lng: newLng,
          time: now
        }));
        
        // Play sound on update
        playNotificationSound();
      });
    };

    // Update positions every 5 seconds
    const interval = setInterval(simulateMovement, 5000);
    return () => clearInterval(interval);
  }, [busPositions, simulatedPositions, lastPositions, soundEnabled]);

  // Update bus markers on Leaflet map
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;
    const filteredBuses = selectedRoute 
      ? busPositions.filter(bus => bus.routeId === selectedRoute)
      : busPositions;

    filteredBuses.forEach(bus => {
      const currentPos = simulatedPositions.get(bus.id) || bus.position;
      const latLng: [number, number] = [currentPos.lat, currentPos.lng];
      
      let marker = busMarkersRef.current.get(bus.id);
      
      // Show label only if this bus's route is clicked
      const showLabel = clickedRoute === bus.routeId;
      
      if (!marker) {
        // Create custom icon based on status
        const iconColor = bus.delay > 10 ? 'red' : bus.delay > 5 ? 'orange' : 'green';
        const iconHtml = `
          <div class="relative flex flex-col items-center">
            <div class="w-10 h-10 rounded-full bg-${iconColor}-500 border-2 border-white shadow-lg flex items-center justify-center animate-pulse">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/>
              </svg>
            </div>
            ${showLabel ? `<div class="mt-1 px-2 py-0.5 bg-white rounded shadow-md text-xs font-bold text-gray-900 whitespace-nowrap">Bus ${bus.id}</div>` : ''}
          </div>
        `;
        
        const icon = L.divIcon({
          html: iconHtml,
          className: 'bus-marker',
          iconSize: [60, 60],
          iconAnchor: [30, 30]
        });
        
        marker = L.marker(latLng, { icon }).addTo(map);
        
        // Add popup with bus info
        const speed = (busSpeed.get(bus.id) || 8.3).toFixed(1);
        const distance = ((distanceTraveled.get(bus.id) || 0) / 1000).toFixed(2);
        const etaMinutes = Math.floor((etaCountdowns.get(bus.id) || bus.eta * 60) / 60);
        const etaSeconds = Math.floor((etaCountdowns.get(bus.id) || bus.eta * 60) % 60);
        
        marker.bindPopup(`
          <div class="text-sm">
            <div class="font-bold text-lg mb-2">🚌 Bus ${bus.id}</div>
            <div class="space-y-1">
              <div><strong>Route:</strong> ${bus.routeName || 'Route ' + bus.routeId}</div>
              <div><strong>Next Stop:</strong> ${bus.nextStop}</div>
              <div><strong>ETA:</strong> ${etaMinutes}:${String(etaSeconds).padStart(2, '0')}</div>
              <div><strong>Speed:</strong> ${speed} m/s</div>
              <div><strong>Traveled:</strong> ${distance} km</div>
              ${bus.capacity ? `<div><strong>Occupancy:</strong> ${bus.occupancy}/${bus.capacity}</div>` : ''}
              <div class="mt-2 px-2 py-1 rounded text-center ${
                bus.delay > 10 ? 'bg-red-100 text-red-700' :
                bus.delay > 5 ? 'bg-orange-100 text-orange-700' :
                'bg-green-100 text-green-700'
              }">
                ${bus.delay > 10 ? 'Major Delay' : bus.delay > 5 ? 'Minor Delay' : 'On Time'}
                ${bus.delay !== 0 ? ` (${bus.delay > 0 ? '+' : ''}${bus.delay} min)` : ''}
              </div>
            </div>
          </div>
        `, {
          maxWidth: 300
        });
        
        busMarkersRef.current.set(bus.id, marker);
      } else {
        // Update existing marker position and icon
        marker.setLatLng(latLng);
        
        // Update icon to show/hide label based on clicked route
        const iconColor = bus.delay > 10 ? 'red' : bus.delay > 5 ? 'orange' : 'green';
        const iconHtml = `
          <div class="relative flex flex-col items-center">
            <div class="w-10 h-10 rounded-full bg-${iconColor}-500 border-2 border-white shadow-lg flex items-center justify-center animate-pulse">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/>
              </svg>
            </div>
            ${showLabel ? `<div class="mt-1 px-2 py-0.5 bg-white rounded shadow-md text-xs font-bold text-gray-900 whitespace-nowrap">Bus ${bus.id}</div>` : ''}
          </div>
        `;
        
        const updatedIcon = L.divIcon({
          html: iconHtml,
          className: 'bus-marker',
          iconSize: [60, 60],
          iconAnchor: [30, 30]
        });
        
        marker.setIcon(updatedIcon);
      }
      
      // Update trail
      const history = busHistory.get(bus.id);
      if (history && history.length > 1) {
        const trailLatLngs = history.map(pos => [pos.lat, pos.lng] as [number, number]);
        let trail = trailLinesRef.current.get(bus.id);
        
        if (!trail) {
          trail = L.polyline(trailLatLngs, {
            color: '#F59E0B',
            weight: 2,
            opacity: 0.6,
            smoothFactor: 1.0
          }).addTo(map);
          trailLinesRef.current.set(bus.id, trail);
        } else {
          trail.setLatLngs(trailLatLngs);
        }
      }
    });

    // Remove markers for buses that are no longer in the list
    busMarkersRef.current.forEach((marker, busId) => {
      if (!filteredBuses.find(b => b.id === busId)) {
        marker.remove();
        busMarkersRef.current.delete(busId);
        
        const trail = trailLinesRef.current.get(busId);
        if (trail) {
          trail.remove();
          trailLinesRef.current.delete(busId);
        }
      }
    });
  }, [busPositions, simulatedPositions, busHistory, busSpeed, distanceTraveled, etaCountdowns, selectedRoute, mapLoaded, clickedRoute]);

  // Update ETA countdowns every second
  useEffect(() => {
    const updateCountdowns = () => {
      busPositions.forEach(bus => {
        const currentEta = etaCountdowns.get(bus.id) || bus.eta * 60; // Convert to seconds
        if (currentEta > 0) {
          setEtaCountdowns(prev => new Map(prev).set(bus.id, currentEta - 1));
        }
      });
    };
    
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [busPositions, etaCountdowns]);

  // Generate bus stops when a bus is selected
  useEffect(() => {
    if (selectedBus) {
      const bus = busPositions.find(b => b.id === selectedBus);
      if (bus) {
        // For now, we don't have actual stop coordinates in the bus data
        // So we'll skip rendering stop overlays until we have that data
        // The route already shows stops in the timeline view
        setBusStops([]);
      }
    } else {
      setBusStops([]);
    }
  }, [selectedBus, busPositions]);

  const filteredBuses = selectedRoute 
    ? busPositions.filter(bus => bus.routeId === selectedRoute)
    : busPositions;

  const getStatusColor = (status: string, delay: number) => {
    if (delay > 10) return 'bg-red-600'; // Major delay
    if (delay > 5) return 'bg-orange-500'; // Minor delay
    if (status === 'delayed') return 'bg-yellow-500';
    if (status === 'early') return 'bg-blue-500';
    return 'bg-green-500'; // On time
  };

  const getStatusText = (status: string, delay: number) => {
    if (delay > 10) return 'Major Delay';
    if (delay > 5) return 'Minor Delay';
    if (status === 'early') return 'Arriving Soon';
    return 'On Time';
  };

  const getStopColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-gray-400';
      case 'next': return 'bg-blue-500';
      case 'upcoming': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction.toLowerCase()) {
      case 'northbound': return 'ri-arrow-up-line';
      case 'southbound': return 'ri-arrow-down-line';
      case 'eastbound': return 'ri-arrow-right-line';
      case 'westbound': return 'ri-arrow-left-line';
      default: return 'ri-navigation-line';
    }
  };

  // Handle route focus animation
  useEffect(() => {
    if (focusRoute) {
      setMapHighlight(focusRoute);
      // Remove highlight after animation
      setTimeout(() => setMapHighlight(null), 2000);
    }
  }, [focusRoute]);

  const handleBusClick = (busId: string) => {
    setSelectedBus(selectedBus === busId ? null : busId);
  };

  return (
  <div className="relative h-[600px] bg-gray-100 rounded-xl overflow-hidden">
      {/* Leaflet Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0"></div>

      {/* Compact Live Info - Top Left */}
      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-gray-900">Live Tracking</span>
          </div>
          <span className="text-xs text-gray-500 font-mono">{currentTime.toLocaleTimeString()}</span>
        </div>
        
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Buses:</span>
            <span className="font-semibold text-blue-600">{filteredBuses.length}</span>
          </div>
          {selectedRoute && (
            <div className="flex items-center gap-1">
              <span className="text-gray-600">Route:</span>
              <span className="font-semibold text-blue-600">{filteredBuses[0]?.routeName || 'Route'}</span>
            </div>
          )}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1 rounded transition-colors ${
              soundEnabled 
                ? 'text-green-600 hover:bg-green-50' 
                : 'text-gray-400 hover:bg-gray-50'
            }`}
            title={soundEnabled ? 'Sound On' : 'Sound Off'}
          >
            <i className={`text-sm ${soundEnabled ? 'ri-volume-up-line' : 'ri-volume-mute-line'}`}></i>
          </button>
        </div>

      {/* Minimal Map Controls - Top Right */}
      <div className="absolute top-3 right-3 flex gap-2">
        <button 
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.setView([15.15, 76.92], 13);
            }
          }}
          className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2 hover:bg-gray-50 transition-colors z-20"
          title="Reset View"
        >
          <i className="ri-focus-3-line text-gray-600 text-xl"></i>
        </button>
        {selectedBus && (
          <button 
            onClick={() => setSelectedBus(null)}
            className="bg-blue-600 text-white rounded-lg shadow-lg p-2 hover:bg-blue-700 transition-colors"
            title="Clear Selection"
          >
            <i className="ri-close-line text-sm"></i>
          </button>
        )}
      </div>

      </div>

      {/* Route Details Info Window */}
      {selectedRoute && routeDetails && showRouteInfo && (
  <div className="absolute top-20 left-3 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl max-w-sm w-80 max-h-[600px] flex flex-col overflow-hidden z-10">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <i className="ri-route-line text-lg"></i>
              <div>
                <div className="font-bold text-sm">
                  {routeDetails.name || busPositions.find(b => b.routeId === selectedRoute)?.routeName || `Route ${selectedRoute}`}
                </div>
                <div className="text-xs opacity-90">
                  {routeDetails.description || routeDetails.stops?.length ? `${routeDetails.stops.length} stops` : 'Route Information'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowRouteInfo(false)}
              className="hover:bg-white/20 rounded p-1 transition-colors"
              title="Close"
            >
              <i className="ri-close-line text-lg"></i>
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="overflow-y-auto flex-1">
            {/* Buses on this route */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <i className="ri-bus-fill text-blue-600"></i>
                Active Buses ({busPositions.filter(b => b.routeId === selectedRoute).length})
              </div>
              <div className="flex flex-wrap gap-2">
                {busPositions
                  .filter(b => b.routeId === selectedRoute)
                  .map(bus => (
                    <div
                      key={bus.id}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        bus.delay > 5 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      Bus {bus.id}
                      {bus.delay > 0 && <span className="ml-1 text-xs">+{bus.delay}min</span>}
                    </div>
                  ))}
              </div>
            </div>

            {/* Route Stops */}
            <div className="px-4 py-3 max-h-48 overflow-y-auto">
              <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <i className="ri-map-pin-line text-blue-600"></i>
                Stops & Timing ({routeDetails.stops?.length || 0} stops)
              </div>
              {routeDetails.stops && routeDetails.stops.length > 0 ? (
                <div className="space-y-1">
                  {routeDetails.stops.map((stop: any, index: number) => {
                    // Get the scheduled evening trip time (default 4:45 PM)
                    const eveningTripTime = routeDetails.eveningTripTime || "4:45 PM";
                    
                    // Parse the evening trip start time
                    const [timeStr, period] = eveningTripTime.split(' ');
                    const [hours, minutes] = timeStr.split(':').map(Number);
                    let tripStartHour = hours;
                    if (period === 'PM' && hours !== 12) tripStartHour += 12;
                    if (period === 'AM' && hours === 12) tripStartHour = 0;
                    
                    // Create trip start time for today
                    const tripStartTime = new Date();
                    tripStartTime.setHours(tripStartHour, minutes, 0, 0);
                    
                    // Calculate arrival time: start time + (index * 3.5 minutes per stop)
                    const minutesPerStop = 3.5;
                    const arrivalTime = new Date(tripStartTime.getTime() + (index * minutesPerStop * 60000));
                    
                    // Check if trip has started
                    const now = new Date();
                    const tripStarted = now >= tripStartTime;
                    const minutesUntilTrip = Math.round((tripStartTime.getTime() - now.getTime()) / 60000);
                    
                    // If trip hasn't started, show "Trip starts at..."
                    if (!tripStarted) {
                      return (
                        <div key={index} className="flex items-start gap-3 text-xs py-2 border-b border-gray-100">
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full bg-blue-100 border-2 border-blue-400 flex items-center justify-center font-bold text-blue-700 text-xs shadow`}>
                              {index + 1}
                            </div>
                            {index < routeDetails.stops.length - 1 && (
                              <div className="w-0.5 h-4 bg-gray-200"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-1">
                            <div className="font-medium text-gray-700">
                              {stop.name || `Stop ${index + 1}`}
                            </div>
                            <div className="text-gray-400 mt-0.5 flex items-center gap-2">
                              <i className="ri-time-line"></i>
                              {index === 0 ? (
                                <span className="text-orange-600 font-semibold">
                                  Trip starts at {eveningTripTime} ({minutesUntilTrip} min)
                                </span>
                              ) : (
                                <span>
                                  {arrivalTime.toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Trip has started - show real-time progress
                    const routeBuses = busPositions.filter(b => b.routeId === selectedRoute);
                    const nearestBus = routeBuses[0];
                    const nextStopName = nearestBus?.nextStop || '';
                    const currentStopIndex = routeDetails.stops.findIndex((s: any) => 
                      s.name === nextStopName
                    );
                    const isPassed = currentStopIndex > index;
                    const isCurrent = currentStopIndex === index;
                    
                    return (
                      <div key={index} className="flex items-start gap-3 text-xs py-2 border-b border-gray-100">
                        <div className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full ${
                            isPassed ? 'bg-gray-200 border-gray-400 text-gray-400' :
                            isCurrent ? 'bg-green-200 border-green-500 text-green-700 animate-pulse' :
                            'bg-blue-100 border-blue-400 text-blue-700'
                          } border-2 flex items-center justify-center font-bold text-xs shadow`}>
                            {index + 1}
                          </div>
                          {index < routeDetails.stops.length - 1 && (
                            <div className="w-0.5 h-4 bg-gray-300"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-1">
                          <div className={`font-medium ${isPassed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {stop.name || `Stop ${index + 1}`}
                          </div>
                          <div className="text-gray-500 mt-0.5 flex items-center gap-2">
                            <i className={`${isPassed ? 'ri-check-line text-gray-400' : 'ri-time-line'}`}></i>
                            {isPassed ? (
                              <span className="text-gray-400">Passed</span>
                            ) : isCurrent ? (
                              <span className="text-green-600 font-semibold">
                                Arriving Now
                              </span>
                            ) : (
                              <span>
                                {arrivalTime.toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-gray-500 text-center py-4">
                  No stops data available for this route
                </div>
              )}
            </div>

            {/* Footer - Inside scrollable content */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 flex items-center justify-between">
              <span>
                <i className="ri-time-line mr-1"></i>
                Updated {currentTime.toLocaleTimeString()}
              </span>
              <button
                onClick={() => setShowRouteInfo(false)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Hide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Route Info Button - when closed */}
      {selectedRoute && routeDetails && !showRouteInfo && (
        <button
          onClick={() => setShowRouteInfo(true)}
          className="absolute top-16 left-3 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 hover:bg-white transition-colors"
          title="Show Route Info"
        >
          <div className="flex items-center gap-2 text-sm">
            <i className="ri-information-line text-blue-600"></i>
            <span className="text-gray-700 font-medium">Route Info</span>
          </div>
        </button>
      )}
    </div>
  );
}
