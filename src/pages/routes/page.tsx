
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import { apiClient } from '../../lib/api';

// Helper function to parse time string to minutes since midnight
const parseTime = (timeStr: string): number => {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  return hours * 60 + minutes;
};

// Get next trip information based on current time and schedule type
const getNextTrip = (route: any, scheduleType: string): { time: string; label: string; status: string; color: string } => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const morningTime = parseTime(route.morningTripTime || '7:00 AM');
  const halfDayTime = parseTime(route.halfDayTripTime || '1:00 PM');
  const eveningTime = parseTime(route.eveningTripTime || '4:45 PM');
  const examEveningTime = parseTime(route.examEveningTime || '5:20 PM');
  
  // Define trip duration (30 minutes for now, can be made dynamic)
  const tripDuration = 30;
  
  // If it's a holiday, no buses
  if (scheduleType === 'holiday') {
    return {
      time: 'No Service',
      label: '🏠 Holiday - No buses today',
      status: 'holiday',
      color: 'text-gray-500'
    };
  }
  
  // Check if morning trip is upcoming or in progress
  if (currentMinutes < morningTime) {
    const minutesUntil = morningTime - currentMinutes;
    if (minutesUntil <= 60) {
      return {
        time: route.morningTripTime || '7:00 AM',
        label: `Coming Soon (in ${minutesUntil} min)`,
        status: 'upcoming',
        color: 'text-blue-600'
      };
    }
    return {
      time: route.morningTripTime || '7:00 AM',
      label: 'Morning Trip (To College)',
      status: 'scheduled',
      color: 'text-gray-900'
    };
  }
  
  // Check if morning trip is in progress
  if (currentMinutes >= morningTime && currentMinutes < morningTime + tripDuration) {
    return {
      time: route.morningTripTime || '7:00 AM',
      label: '🚌 On the Way (Morning)',
      status: 'in-progress',
      color: 'text-green-600'
    };
  }
  
  // Morning trip completed, determine next trip based on schedule type
  let nextTripTime: number;
  let nextTripTimeStr: string;
  let nextTripLabel: string;
  
  if (scheduleType === 'halfday') {
    nextTripTime = halfDayTime;
    nextTripTimeStr = route.halfDayTripTime || '1:00 PM';
    nextTripLabel = 'Half Day Trip';
  } else if (scheduleType === 'exam') {
    nextTripTime = examEveningTime;
    nextTripTimeStr = route.examEveningTime || '5:20 PM';
    nextTripLabel = 'Evening Trip (Exam)';
  } else {
    // Regular day
    nextTripTime = eveningTime;
    nextTripTimeStr = route.eveningTripTime || '4:45 PM';
    nextTripLabel = 'Evening Trip';
  }
  
  if (currentMinutes < nextTripTime) {
    const minutesUntil = nextTripTime - currentMinutes;
    if (minutesUntil <= 60) {
      return {
        time: nextTripTimeStr,
        label: `🚌 Coming Soon (in ${minutesUntil} min)`,
        status: 'upcoming',
        color: 'text-orange-600'
      };
    }
    return {
      time: nextTripTimeStr,
      label: `${nextTripLabel} (From College)`,
      status: 'scheduled',
      color: 'text-gray-900'
    };
  }
  
  // Check if next trip is in progress
  if (currentMinutes >= nextTripTime && currentMinutes < nextTripTime + tripDuration) {
    return {
      time: nextTripTimeStr,
      label: `🚌 On the Way - ${nextTripLabel}`,
      status: 'in-progress',
      color: 'text-green-600'
    };
  }
  
  // All trips completed for the day
  return {
    time: 'Completed',
    label: 'All trips completed for today',
    status: 'completed',
    color: 'text-gray-500'
  };
};

export default function Routes() {
  const navigate = useNavigate();
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todaySchedule, setTodaySchedule] = useState<string>('regular');

  useEffect(() => {
    loadRoutes();
    loadTodaySchedule();
    
    // Update current time every minute to refresh trip status
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      loadTodaySchedule(); // Also refresh schedule type
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const loadTodaySchedule = async () => {
    try {
      const response = await apiClient.get('/today-schedule');
      if (response.data?.scheduleType) {
        setTodaySchedule(response.data.scheduleType);
      }
    } catch (error) {
      console.error('Error loading today schedule:', error);
      setTodaySchedule('regular');
    }
  };

  const loadRoutes = async () => {
    try {
      const data = await apiClient.getRoutes();
      console.log('Routes loaded:', data);
      setRoutes(data);
    } catch (error) {
      console.error('Failed to load routes:', error);
      setRoutes([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color: string, selected: boolean = false) => {
    const colors = {
      blue: selected ? 'bg-blue-50 border-blue-200' : 'bg-blue-500',
      green: selected ? 'bg-green-50 border-green-200' : 'bg-green-500',
      purple: selected ? 'bg-purple-50 border-purple-200' : 'bg-purple-500',
      orange: selected ? 'bg-orange-50 border-orange-200' : 'bg-orange-500'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Campus Bus Routes</h2>
          <p className="text-base sm:text-lg text-gray-600">
            Explore all available bus routes connecting different campus locations. 
            Tap on any route to view detailed information and real-time tracking.
          </p>
        </div>

        {/* Routes Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading routes...</p>
          </div>
        ) : routes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <i className="ri-route-line text-6xl text-gray-400 mb-4"></i>
            <p className="text-gray-600 text-lg">No routes available yet.</p>
            <p className="text-gray-500 mt-2">Check back later or contact your administrator.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {routes.map((route) => (
            <div 
              key={route.id}
              className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl cursor-pointer ${
                selectedRoute === route.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedRoute(selectedRoute === route.id ? null : route.id)}
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className={`w-3 h-3 sm:w-4 sm:h-4 ${getColorClasses(route.color)} rounded-full mr-2 sm:mr-3 flex-shrink-0`}></div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{route.name}</h3>
                      <p className="text-gray-600 text-sm sm:text-base truncate">{route.description}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <div className="text-sm font-medium text-gray-900">{route.stops?.length || 0} stops</div>
                    <div className="text-xs text-gray-500">{route.direction || 'Bidirectional'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
                  <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="text-base sm:text-lg font-bold text-gray-900">{route.stops?.length || 0}</div>
                    <div className="text-xs text-gray-600">Stops</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="text-base sm:text-lg font-bold text-gray-900">{route.frequency || 'N/A'}</div>
                    <div className="text-xs text-gray-600">Frequency</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className={`text-base sm:text-lg font-bold ${getStatusColor(route.status || 'active')}`}>
                      {(route.status || 'active')?.charAt(0).toUpperCase() + (route.status || 'active')?.slice(1)}
                    </div>
                    <div className="text-xs text-gray-600">Status</div>
                  </div>
                </div>

                {/* Next Trip Time - Dynamic */}
                <div className="mb-3 sm:mb-4 bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-xs text-gray-600 mb-1">⏰ Next Trip</div>
                      <div className={`text-base sm:text-lg font-bold ${getNextTrip(route, todaySchedule).color}`}>
                        {getNextTrip(route, todaySchedule).time}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {getNextTrip(route, todaySchedule).label}
                      </div>
                    </div>
                    {getNextTrip(route, todaySchedule).status === 'in-progress' && (
                      <div className="flex-shrink-0 ml-3">
                        <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-3 sm:mb-4">
                  <div className="text-sm text-gray-600 mb-1">Distance & Duration</div>
                  <div className="text-sm font-medium text-gray-900">
                    {route.distance || 'N/A'} • {route.duration || 'N/A'}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/live-tracking', { state: { selectedRoute: route.id } });
                    }}
                    className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors whitespace-nowrap text-sm"
                  >
                    <i className="ri-map-line mr-1"></i>
                    Track Live
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/schedule', { state: { selectedRoute: route.id } });
                    }}
                    className="flex-1 bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors whitespace-nowrap text-sm"
                  >
                    <i className="ri-calendar-line mr-1"></i>
                    Schedule
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedRoute === route.id && (
                <div className="border-t bg-gray-50 p-4 sm:p-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Route Stops</h4>
                  {route.stops && route.stops.length > 0 ? (
                    <div className="space-y-2 text-sm mb-4">
                      {route.stops.map((stop: any, index: number) => (
                        <div key={stop.id} className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold mr-3">
                            {index + 1}
                          </div>
                          <span className="text-gray-700">{stop.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm mb-4">No stops information available</p>
                  )}
                  
                  <div className="mt-4 pt-4 border-t">
                    <button 
                      onClick={() => navigate('/notifications', { state: { routeId: route.id } })}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap text-sm"
                    >
                      <i className="ri-notification-line mr-2"></i>
                      Subscribe to Route Alerts
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <button 
              onClick={() => navigate('/live-tracking')}
              className="p-3 sm:p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
            >
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                <i className="ri-map-line text-white text-sm sm:text-base"></i>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Live Bus Tracking</h4>
              <p className="text-xs sm:text-sm text-gray-600">See real-time bus locations on campus map</p>
            </button>

            <button 
              onClick={() => navigate('/schedule')}
              className="p-3 sm:p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
            >
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-600 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                <i className="ri-calendar-line text-white text-sm sm:text-base"></i>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Bus Schedules</h4>
              <p className="text-xs sm:text-sm text-gray-600">View timetables and plan your journey</p>
            </button>

            <button 
              onClick={() => navigate('/notifications')}
              className="p-3 sm:p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
            >
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-600 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                <i className="ri-notification-line text-white text-sm sm:text-base"></i>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Notifications</h4>
              <p className="text-xs sm:text-sm text-gray-600">Manage alerts and subscriptions</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
