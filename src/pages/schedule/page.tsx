import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/feature/Header';
import { apiClient } from '../../lib/api';

// College bus schedule types
type TripType = 'morning' | 'evening' | 'halfday';
type ScheduleType = 'regular' | 'halfday' | 'exam' | 'holiday';

interface BusTrip {
  time: string;
  type: TripType;
  direction: 'to_college' | 'from_college';
  label: string;
}

export default function Schedule() {
  const navigate = useNavigate();
  const location = useLocation();
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<string>(
    location.state?.selectedRoute || ''
  );
  const [scheduleType, setScheduleType] = useState<ScheduleType>('regular');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadRoutes();
  }, []);

  // Update current time every minute for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

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

  // College bus schedules - uses route-specific timings
  const getCollegeBusSchedule = (): BusTrip[] => {
    if (!currentRoute) return [];
    
    if (scheduleType === 'regular') {
      return [
        {
          time: currentRoute.morningTripTime || '7:00 AM',
          type: 'morning',
          direction: 'to_college',
          label: 'Morning Trip (To College)'
        },
        {
          time: currentRoute.eveningTripTime || '4:45 PM',
          type: 'evening',
          direction: 'from_college',
          label: 'Evening Trip (From College)'
        }
      ];
    } else if (scheduleType === 'halfday') {
      return [
        {
          time: currentRoute.morningTripTime || '7:00 AM',
          type: 'morning',
          direction: 'to_college',
          label: 'Morning Trip (To College)'
        },
        {
          time: currentRoute.halfDayTripTime || '1:00 PM',
          type: 'halfday',
          direction: 'from_college',
          label: 'Half Day (From College)'
        }
      ];
    } else if (scheduleType === 'exam') {
      return [
        {
          time: currentRoute.morningTripTime || '7:00 AM',
          type: 'morning',
          direction: 'to_college',
          label: 'Morning Trip (To College)'
        },
        {
          time: currentRoute.examEveningTime || '5:20 PM',
          type: 'evening',
          direction: 'from_college',
          label: 'Evening Trip - Exam Day (From College)'
        }
      ];
    }
    return []; // Holiday - no buses
  };

  const parseTime12Hour = (time12: string): number => {
    const match = time12.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    
    let hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const period = match[3].toUpperCase();
    
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    
    return hour * 60 + minute;
  };

  const getTimeUntil = (busTime: string) => {
    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
    const busTimeMinutes = parseTime12Hour(busTime);
    const diffMinutes = busTimeMinutes - currentTotalMinutes;
    
    if (diffMinutes < 0) return 'Departed';
    if (diffMinutes <= 15) return 'Coming Soon';
    if (diffMinutes < 60) return `In ${diffMinutes} min`;
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    if (minutes === 0) return `In ${hours} hour${hours > 1 ? 's' : ''}`;
    return `In ${hours}h ${minutes}m`;
  };

  const getNextTrip = (): BusTrip | null => {
    const trips = getCollegeBusSchedule();
    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
    
    for (const trip of trips) {
      const tripMinutes = parseTime12Hour(trip.time);
      if (tripMinutes > currentTotalMinutes) {
        return trip;
      }
    }
    return null; // All trips completed for today
  };

  const currentRoute = routes.find(r => r.id === selectedRoute);
  const busSchedule = getCollegeBusSchedule();
  const nextTrip = getNextTrip();

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
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center bg-white rounded-xl shadow-lg p-12">
            <i className="ri-calendar-line text-6xl text-gray-400 mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Routes Available</h2>
            <p className="text-gray-600">Please create some routes first to view schedules.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">College Bus Schedule</h1>
          <p className="text-gray-600 mt-2">View and manage college bus timings</p>
        </div>

        {/* Route Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Route</h2>
            <div className="space-y-3">
              {routes.map((route) => {
                const colorClass = route.color === 'blue' ? 'bg-blue-500' : 
                                  route.color === 'green' ? 'bg-green-500' :
                                  route.color === 'red' ? 'bg-red-500' : 'bg-gray-500';
                
                return (
                  <button
                    key={route.id}
                    onClick={() => setSelectedRoute(route.id)}
                    className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                      selectedRoute === route.id 
                        ? 'bg-blue-50 border-2 border-blue-200' 
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full ${colorClass} mr-3`}></div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{route.name}</div>
                        <div className="text-sm text-gray-600">{route.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule Type Selection */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule Type</h2>
            <div className="space-y-3">
              <button
                onClick={() => setScheduleType('regular')}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  scheduleType === 'regular' 
                    ? 'bg-blue-50 border-2 border-blue-200' 
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Regular Day</div>
                    <div className="text-sm text-gray-600">Morning & Evening Trips</div>
                  </div>
                  <i className="ri-calendar-line text-gray-400"></i>
                </div>
              </button>

              <button
                onClick={() => setScheduleType('halfday')}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  scheduleType === 'halfday' 
                    ? 'bg-orange-50 border-2 border-orange-200' 
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Half Day</div>
                    <div className="text-sm text-gray-600">Early Dismissal ({currentRoute?.halfDayTripTime || '1:00 PM'})</div>
                  </div>
                  <i className="ri-calendar-event-line text-gray-400"></i>
                </div>
              </button>

              <button
                onClick={() => setScheduleType('exam')}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  scheduleType === 'exam' 
                    ? 'bg-purple-50 border-2 border-purple-200' 
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Exam Day</div>
                    <div className="text-sm text-gray-600">Late Evening ({currentRoute?.examEveningTime || '5:20 PM'})</div>
                  </div>
                  <i className="ri-file-list-3-line text-gray-400"></i>
                </div>
              </button>

              <button
                onClick={() => setScheduleType('holiday')}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  scheduleType === 'holiday' 
                    ? 'bg-red-50 border-2 border-red-200' 
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Holiday</div>
                    <div className="text-sm text-gray-600">No buses running</div>
                  </div>
                  <i className="ri-calendar-close-line text-gray-400"></i>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Schedule Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Next Bus */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Bus</h3>
            {nextTrip ? (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                    <i className="ri-bus-line text-white text-lg"></i>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{nextTrip.time}</div>
                    <div className="text-sm text-gray-600">{getTimeUntil(nextTrip.time)}</div>
                  </div>
                </div>
                <div className="pt-3 border-t border-blue-200">
                  <div className="text-sm font-medium text-gray-700">{nextTrip.label}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {nextTrip.direction === 'to_college' ? '🎒 To College' : '🏠 From College'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="ri-time-line text-4xl mb-2"></i>
                <p className="font-medium">All trips completed</p>
                <p className="text-sm mt-1">Next bus at 7:00 AM tomorrow</p>
              </div>
            )}
          </div>

          {/* Today's Schedule */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h3>
            {busSchedule.length > 0 ? (
              <div className="space-y-3">
                {busSchedule.map((trip, index) => {
                  const status = getTimeUntil(trip.time);
                  const isDeparted = status === 'Departed';
                  const isComing = status === 'Coming Soon';
                  
                  return (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border-2 ${
                        isDeparted ? 'bg-gray-50 border-gray-200 opacity-60' :
                        isComing ? 'bg-green-50 border-green-200' :
                        'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                            isDeparted ? 'bg-gray-300' :
                            isComing ? 'bg-green-500' :
                            'bg-blue-500'
                          }`}>
                            <i className="ri-bus-2-line text-white text-xl"></i>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-bold text-gray-900">{trip.time}</span>
                              {isComing && (
                                <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
                                  Coming Soon!
                                </span>
                              )}
                              {isDeparted && (
                                <span className="px-2 py-1 bg-gray-400 text-white text-xs rounded-full">
                                  Departed
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">{trip.label}</div>
                            {!isDeparted && (
                              <div className="text-sm font-medium text-gray-700 mt-1">{status}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl">
                            {trip.direction === 'to_college' ? '🎒' : '🏠'}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {trip.direction === 'to_college' ? 'To College' : 'From College'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <i className="ri-calendar-close-line text-6xl mb-3"></i>
                <p className="text-lg font-medium">Holiday - No Buses Today</p>
                <p className="text-sm mt-2">Enjoy your day off! 🎉</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/live-tracking', { state: { selectedRoute } })}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <i className="ri-map-pin-line"></i>
              Track This Bus
            </button>
            <button
              onClick={() => navigate('/notifications')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <i className="ri-notification-line"></i>
              Set Alerts
            </button>
            <button
              onClick={() => navigate('/routes')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              <i className="ri-route-line"></i>
              View All Routes
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex">
            <i className="ri-information-line text-blue-500 text-xl mr-3"></i>
            <div>
              <p className="text-sm text-blue-900 font-medium">College Bus Timings</p>
              <p className="text-sm text-blue-700 mt-1">
                Regular days: 2 trips (Morning & Evening) • Half days: Early dismissal at 1:00 PM • Schedule may change based on college announcements
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
