import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { MapPin, Navigation, LogOut, PlayCircle, StopCircle, Radio, AlertTriangle } from 'lucide-react';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [tripActive, setTripActive] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const locationIntervalRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    // Check if driver is logged in
    const token = localStorage.getItem('driver_token');
    const info = localStorage.getItem('driver_info');
    
    if (!token || !info) {
      navigate('/driver/login');
      return;
    }
    
    setDriverInfo(JSON.parse(info));
    checkLocationPermission();
  }, [navigate]);

  const checkLocationPermission = async () => {
    if ('geolocation' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setLocationPermission(permission.state === 'granted');
        
        if (permission.state === 'granted') {
          getCurrentPosition();
        }
      } catch (error) {
        console.error('Permission check error:', error);
      }
    }
  };

  const getCurrentPosition = () => {
    if ('geolocation' in navigator) {
      const options = {
        enableHighAccuracy: true, // Use GPS instead of WiFi/cell tower
        timeout: 10000, // Wait up to 10 seconds
        maximumAge: 0 // Don't use cached location
      };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log('🎯 High-accuracy GPS obtained:', location);
          console.log('📊 Accuracy: ' + position.coords.accuracy + ' meters');
          setCurrentLocation(location);
          setLocationPermission(true);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Please enable location access');
          setLocationPermission(false);
        },
        options // Use the high-accuracy options
      );
    }
  };

  const sendLocationUpdate = async (lat: number, lng: number) => {
    const token = localStorage.getItem('driver_token');
    
    console.log('🚀 Sending location update:', { lat, lng, bus_id: driverInfo?.bus_id });
    
    try {
      const response = await fetch('http://localhost:8000/api/driver/update-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bus_id: driverInfo.bus_id,
          latitude: lat,
          longitude: lng,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Location updated successfully:', data);
        setLastUpdate(new Date());
        toast.success(`📍 GPS updated: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      } else {
        const error = await response.text();
        console.error('❌ Location update failed:', response.status, error);
        toast.error('Failed to update location');
      }
    } catch (error) {
      console.error('❌ Location update error:', error);
    }
  };

  const startTrip = async () => {
    if (!locationPermission) {
      toast.error('Please enable location access first');
      return;
    }

    const token = localStorage.getItem('driver_token');
    
    try {
      const response = await fetch('http://localhost:8000/api/driver/start-trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bus_id: driverInfo.bus_id,
          route_id: driverInfo.route_id,
        }),
      });

      if (response.ok) {
        setTripActive(true);
        toast.success('Trip started! GPS tracking is now active');
        
        // Keep screen awake to prevent GPS from stopping (Web App limitation workaround)
        try {
          if ('wakeLock' in navigator) {
            wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
            console.log('🔋 Screen wake lock activated - phone won\'t sleep');
            toast.success('📱 Screen will stay awake during trip', { duration: 3000 });
          }
        } catch (err) {
          console.warn('Wake lock not supported:', err);
          toast('⚠️ Keep screen on manually for continuous tracking', { duration: 5000 });
        }
        
        // Send current location immediately
        if (currentLocation) {
          sendLocationUpdate(currentLocation.lat, currentLocation.lng);
        }
        
        // Use watchPosition for CONTINUOUS real-time GPS tracking (not polling!)
        // This actively monitors GPS and updates immediately when location changes
        const gpsOptions = {
          enableHighAccuracy: true, // Force GPS hardware, not WiFi/network
          timeout: 10000,
          maximumAge: 0 // Never use cached location - always get fresh GPS
        };
        
        locationIntervalRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            
            // Update accuracy state
            setGpsAccuracy(accuracy);
            
            // Check if GPS accuracy is poor (using WiFi/network instead of real GPS)
            if (accuracy > 100) {
              console.warn('⚠️ Poor GPS accuracy:', accuracy + 'm');
              console.warn('💡 Please enable GPS in device settings and go outdoors');
              toast.error(`⚠️ Poor GPS signal! Accuracy: ${Math.round(accuracy)}m. Enable GPS and go outside!`, {
                duration: 5000
              });
            }
            
            console.log('📍 GPS Update (LIVE TRACKING):', {
              lat, 
              lng, 
              accuracy: accuracy + 'm',
              timestamp: new Date().toLocaleTimeString()
            });
            
            setCurrentLocation({ lat, lng });
            sendLocationUpdate(lat, lng);
          },
          (error) => {
            console.error('❌ GPS error:', error.message);
            toast.error('GPS signal lost. Trying again...');
          },
          gpsOptions
        );
      }
    } catch (error) {
      toast.error('Failed to start trip');
      console.error('Start trip error:', error);
    }
  };

  const endTrip = async () => {
    const token = localStorage.getItem('driver_token');
    
    // Stop watching GPS position
    if (locationIntervalRef.current) {
      navigator.geolocation.clearWatch(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    
    // Release screen wake lock
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
      console.log('🔋 Screen wake lock released');
    }
    
    try {
      const response = await fetch(`http://localhost:8000/api/driver/end-trip?bus_id=${driverInfo.bus_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setTripActive(false);
        toast.success('Trip ended successfully');
      }
    } catch (error) {
      toast.error('Failed to end trip');
      console.error('End trip error:', error);
    }
  };

  const handleLogout = () => {
    if (tripActive) {
      endTrip();
    }
    localStorage.removeItem('driver_token');
    localStorage.removeItem('driver_info');
    navigate('/driver/login');
  };

  if (!driverInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Driver Dashboard</h1>
            <p className="text-blue-100">Welcome, {driverInfo.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* GPS Accuracy Warning */}
        {gpsAccuracy !== null && gpsAccuracy > 100 && (
          <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900 mb-1">⚠️ Poor GPS Signal Detected!</h3>
              <p className="text-sm text-red-800 mb-2">
                Current accuracy: <strong>{Math.round(gpsAccuracy)} meters</strong> (should be &lt;20m)
              </p>
              <p className="text-sm text-red-700">
                Your device is using WiFi/network location instead of real GPS. This means the location is inaccurate!
              </p>
              <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc list-inside">
                <li>Enable GPS/Location Services in your device settings</li>
                <li>Go outside or near a window for better satellite signal</li>
                <li>Make sure Chrome has location permission</li>
                <li>Wait a few moments for GPS to lock on satellites</li>
              </ul>
            </div>
          </div>
        )}

        {/* Bus Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Bus Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Bus Number</p>
              <p className="text-lg font-semibold text-gray-900">{driverInfo.bus_id || 'Not Assigned'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Route</p>
              <p className="text-lg font-semibold text-gray-900">{driverInfo.route_id || 'Not Assigned'}</p>
            </div>
          </div>
        </div>

        {/* GPS Status Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">GPS Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className={`w-6 h-6 ${locationPermission ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <p className="font-semibold">{locationPermission ? 'Location Enabled' : 'Location Disabled'}</p>
                <p className="text-sm text-gray-600">
                  {locationPermission ? 'GPS signal detected' : 'Please enable location access'}
                </p>
              </div>
            </div>

            {currentLocation && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Current Position</p>
                <p className="font-mono text-sm">
                  Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}
                </p>
                {gpsAccuracy !== null && (
                  <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                    gpsAccuracy < 20 ? 'bg-green-100 text-green-800' :
                    gpsAccuracy < 100 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    <Navigation className="w-3 h-3" />
                    Accuracy: {Math.round(gpsAccuracy)}m
                    {gpsAccuracy < 20 ? ' ✓ Excellent' : 
                     gpsAccuracy < 100 ? ' ⚠ Fair' : 
                     ' ✗ Poor'}
                  </div>
                )}
                {lastUpdate && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Trip Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Trip Controls</h2>
          
          {!tripActive ? (
            <button
              onClick={startTrip}
              disabled={!locationPermission || !driverInfo.bus_id}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-colors"
            >
              <PlayCircle className="w-6 h-6" />
              Start Trip
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 flex items-center gap-3">
                <Radio className="w-6 h-6 text-green-600 animate-pulse" />
                <div>
                  <p className="font-semibold text-green-900">Trip Active</p>
                  <p className="text-sm text-green-700">📡 Live GPS tracking (updates automatically when you move)</p>
                </div>
              </div>
              
              <button
                onClick={endTrip}
                className="w-full bg-red-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-red-700 flex items-center justify-center gap-3 transition-colors"
              >
                <StopCircle className="w-6 h-6" />
                End Trip
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            How it works
          </h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li>1. Enable location access when prompted</li>
            <li>2. Click "Start Trip" to begin broadcasting your location</li>
            <li>3. 📡 Your GPS location is tracked continuously in real-time (not polling!)</li>
            <li>4. Students can see your live location on the map</li>
            <li>5. Click "End Trip" when you complete the route</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
