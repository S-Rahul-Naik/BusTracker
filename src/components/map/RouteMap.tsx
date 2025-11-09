import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { ChevronUp, ChevronDown, Navigation } from 'lucide-react';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface RouteMapProps {
  stops: Array<{
    lat: number;
    lng: number;
    name: string;
  }>;
  onRouteCalculated?: (distance: string, duration: string) => void;
}

export default function RouteMap({ stops, onRouteCalculated }: RouteMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const routingControlRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [routeInstructions, setRouteInstructions] = useState<any[]>([]);
  const [routeSummary, setRouteSummary] = useState<{ distance: string; duration: string } | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not already created
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([15.1420, 76.9120], 13);
      
      // Use Geoapify map tiles (better styling and more modern)
      const GEOAPIFY_API_KEY = 'd74bec8d5ac4405dbb427b8f32afc6de';
      L.tileLayer(`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`, {
        attribution: '&copy; <a href="https://www.geoapify.com/">Geoapify</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 20
      }).addTo(mapRef.current);
    }

    // Remove existing routing control if any
    if (routingControlRef.current) {
      mapRef.current?.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    // Add routing if we have 2 or more stops
    if (stops.length >= 2 && mapRef.current) {
      const waypoints = stops.map(stop => L.latLng(stop.lat, stop.lng));
      
      routingControlRef.current = (L as any).Routing.control({
        waypoints: waypoints,
        router: (L as any).Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'driving' // Use 'driving' profile for accurate road distances
        }),
        routeWhileDragging: false,
        showAlternatives: false,
        addWaypoints: false,
        show: false, // Hide the default routing panel
        lineOptions: {
          styles: [{ color: '#1e40af', weight: 5, opacity: 0.8 }]
        },
        createMarker: function(i: number, waypoint: any) {
          const marker = L.marker(waypoint.latLng, {
            draggable: false,
            icon: L.divIcon({
              className: 'custom-marker',
              html: `<div style="background-color: #3b82f6; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${i + 1}</div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            })
          });
          
          marker.bindPopup(`<b>Stop ${i + 1}</b><br/>${stops[i].name}`);
          return marker;
        }
      }).addTo(mapRef.current);

      // Listen for route calculation
      routingControlRef.current.on('routesfound', function(e: any) {
        const routes = e.routes;
        const summary = routes[0].summary;
        const instructions = routes[0].instructions;
        
        // Store instructions for display
        setRouteInstructions(instructions);
        
        // Convert distance to km
        const distanceKm = (summary.totalDistance / 1000).toFixed(1);
        
        // Get base driving time from routing engine (optimistic car speed)
        const baseDrivingTimeMin = Math.round(summary.totalTime / 60);
        
        // Adjust for realistic bus speed (buses are ~40% slower than cars in city traffic)
        const adjustedDrivingTimeMin = Math.round(baseDrivingTimeMin * 1.4);
        
        // Add buffer time for bus stops (3 minutes per stop, excluding first stop)
        const stopBufferMin = (stops.length - 1) * 3;
        
        // Total realistic duration
        const totalDurationMin = adjustedDrivingTimeMin + stopBufferMin;
        
        // Store summary for display
        setRouteSummary({
          distance: `${distanceKm} km`,
          duration: `${totalDurationMin} min`
        });
        
        // Call the callback with realistic values
        if (onRouteCalculated) {
          onRouteCalculated(`${distanceKm} km`, `${totalDurationMin} min`);
        }
      });

      // Fit bounds to show all markers
      const bounds = L.latLngBounds(waypoints);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else if (stops.length === 1 && mapRef.current) {
      // Single stop - just show marker
      L.marker([stops[0].lat, stops[0].lng])
        .addTo(mapRef.current)
        .bindPopup(`<b>${stops[0].name}</b>`)
        .openPopup();
      
      mapRef.current.setView([stops[0].lat, stops[0].lng], 15);
    }

    return () => {
      if (routingControlRef.current && mapRef.current) {
        mapRef.current.removeControl(routingControlRef.current);
      }
    };
  }, [stops]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '500px' }} />
      
      {/* Collapsible Route Directions Bubble */}
      {routeSummary && (
        <div 
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxWidth: isExpanded ? '400px' : '200px',
            zIndex: 1000,
            transition: 'all 0.3s ease'
          }}
        >
          {/* Header - Always Visible */}
          <div 
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Navigation size={18} color="#3b82f6" />
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                  {routeSummary.distance} · {routeSummary.duration}
                </div>
                {!isExpanded && (
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    {routeInstructions.length} steps
                  </div>
                )}
              </div>
            </div>
            {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </div>

          {/* Expanded Content - Route Instructions */}
          {isExpanded && (
            <div 
              style={{
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '12px'
              }}
            >
              {routeInstructions.map((instruction: any, idx: number) => (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '8px 0',
                    borderBottom: idx < routeInstructions.length - 1 ? '1px solid #f3f4f6' : 'none'
                  }}
                >
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280',
                    minWidth: '50px',
                    fontWeight: '500'
                  }}>
                    {instruction.distance ? `${(instruction.distance / 1000).toFixed(1)} km` : '0 m'}
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#374151',
                    flex: 1
                  }}>
                    {instruction.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
