
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/feature/Header';
import { apiClient } from '../../lib/api';

// College bus schedule types
type TripType = 'morning' | 'evening' | 'halfday';
type ScheduleType = 'regular' | 'halfday' | 'holiday';

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

  // College bus schedules - typically 2 trips per day
  const getCollegeBusSchedule = (): BusTrip[] => {
    if (scheduleType === 'regular') {
      return [
        {
          time: '7:00 AM',
          type: 'morning',
          direction: 'to_college',
          label: 'Morning Trip (To College)'
        },
        {
          time: '5:00 PM',
          type: 'evening',
          direction: 'from_college',
          label: 'Evening Trip (From College)'
        }
      ];
    } else if (scheduleType === 'halfday') {
      return [
        {
          time: '7:00 AM',
          type: 'morning',
          direction: 'to_college',
          label: 'Morning Trip (To College)'
        },
        {
          time: '1:00 PM',
          type: 'halfday',
          direction: 'from_college',
          label: 'Half Day (From College)'
        }
      ];
    }
    return []; // Holiday - no buses
  };

  const formatTimeTo12Hour = (time24: string) => {
    // If already in 12-hour format, return as is
    if (time24.includes('AM') || time24.includes('PM')) return time24;
    
    const [hour, minute] = time24.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
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

  // Generate schedule times based on route frequency
  const generateScheduleTimes = (startTime: string, endTime: string, frequencyMinutes: number) => {
    const times = [];
    const [startHour, startMin] = startTime.split(':').map(n => parseInt(n));
    const [endHour, endMin] = endTime.split(':').map(n => parseInt(n));
    
    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    while (currentMinutes <= endMinutes) {
      const hour = Math.floor(currentMinutes / 60);
      const min = currentMinutes % 60;
      times.push(`${hour}:${min.toString().padStart(2, '0')}`);
      currentMinutes += frequencyMinutes;
    }
    
    return times;
  };

  const currentRoute = routes.find(r => r.id === selectedRoute);
  
  const getScheduleForRoute = () => {
    if (!currentRoute) return null;
    
    // Parse operating hours (e.g., "7:00 AM - 10:00 PM")
    const hours = currentRoute.operatingHours || '7:00 AM - 10:00 PM';
    const [start, end] = hours.split(' - ');
    
    // Convert to 24-hour format
    const convertTo24Hour = (time: string) => {
      const [t, period] = time.split(' ');
      let [hour, min] = t.split(':');
      let h = parseInt(hour);
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return `${h}:${min}`;
    };
    
    const startTime = convertTo24Hour(start);
    const endTime = convertTo24Hour(end);
    
    // Parse frequency (e.g., "6 min" -> 6)
    const freq = currentRoute.frequency || '15 min';
    const frequencyMinutes = parseInt(freq);
    
    return {
      frequency: freq,
      firstBus: start,
      lastBus: end,
      times: generateScheduleTimes(startTime, endTime, frequencyMinutes)
    };
  };

  const currentSchedule = getScheduleForRoute();

  const getCurrentTime = () => {
    const now = new Date();
    return now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
  };

  const formatTimeTo12Hour = (time24: string) => {
    const [hour, minute] = time24.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const getTimeUntil = (busTimeMinutes: number) => {
    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
    const diffMinutes = busTimeMinutes - currentTotalMinutes;
    
    if (diffMinutes <= 5) return 'Coming Soon';
    if (diffMinutes < 60) return `In ${diffMinutes} min`;
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    if (minutes === 0) return `In ${hours} hour${hours > 1 ? 's' : ''}`;
    return `In ${hours}h ${minutes}m`;
  };

  const getNextBuses = () => {
    if (!currentSchedule) return [];
    
    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    return currentSchedule.times
      .map(time => {
        const [hour, minute] = time.split(':').map(Number);
        const totalMinutes = hour * 60 + minute;
        return { time, totalMinutes };
      })
      .filter(({ totalMinutes }) => totalMinutes > currentTotalMinutes)
      .slice(0, 3);
  };

  const nextBuses = getNextBuses();

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
        {/* Route and Day Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Route Selection */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Route</h2>
            <div className="space-y-3">
              {routes.map((route) => (
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
                    <div className={`w-4 h-4 rounded-full mr-3 ${route.color === 'blue' ? 'bg-blue-500' : route.color === 'green' ? 'bg-green-500' : route.color === 'purple' ? 'bg-purple-500' : 'bg-orange-500'}`}></div>
                    <div>
                      <div className="font-semibold text-gray-900">{route.name}</div>
                      <div className="text-sm text-gray-600">{route.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Day Selection */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule Type</h2>
            <div className="space-y-3">
              <button
                onClick={() => setSelectedDay('weekday')}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  selectedDay === 'weekday' 
                    ? 'bg-blue-50 border-2 border-blue-200' 
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Weekdays</div>
                    <div className="text-sm text-gray-600">Monday - Friday</div>
                  </div>
                  <i className="ri-calendar-line text-gray-400"></i>
                </div>
              </button>

              <button
                onClick={() => setSelectedDay('weekend')}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  selectedDay === 'weekend' 
                    ? 'bg-blue-50 border-2 border-blue-200' 
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Weekends</div>
                    <div className="text-sm text-gray-600">Saturday - Sunday</div>
                  </div>
                  <i className="ri-calendar-2-line text-gray-400"></i>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Schedule Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Next Buses */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Buses</h3>
            {nextBuses.length > 0 ? (
              <div className="space-y-3">
                {nextBuses.map((bus, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                        <i className="ri-bus-line text-white text-sm"></i>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{formatTimeTo12Hour(bus.time)}</div>
                        <div className="text-sm text-gray-600">
                          {getTimeUntil(bus.totalMinutes)}
                        </div>
                      </div>
                    </div>
                    {index === 0 && getTimeUntil(bus.totalMinutes) === 'Coming Soon' && (
                      <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Coming Soon
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="ri-time-line text-4xl mb-2"></i>
                <p>No more buses today</p>
                <p className="text-sm">Service resumes at {currentSchedule?.firstBus || '7:00 AM'} tomorrow</p>
              </div>
            )}
          </div>

          {/* Schedule Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Info</h3>
            {currentSchedule ? (
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Frequency</div>
                  <div className="font-medium text-gray-900">{currentSchedule.frequency}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600">First Bus</div>
                  <div className="font-medium text-gray-900">{currentSchedule.firstBus}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600">Last Bus</div>
                  <div className="font-medium text-gray-900">{currentSchedule.lastBus}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600">Total Trips</div>
                  <div className="font-medium text-gray-900">{currentSchedule.times.length} trips</div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No schedule available</p>
            )}
          </div>

          {/* Route Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/live-tracking', { state: { selectedRoute } })}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <i className="ri-map-line mr-2"></i>
                Track This Route
              </button>
              <button 
                onClick={() => navigate('/notifications', { state: { routeId: selectedRoute } })}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                <i className="ri-notification-line mr-2"></i>
                Set Alerts
              </button>
              <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap">
                <i className="ri-download-line mr-2"></i>
                Download Schedule
              </button>
            </div>
          </div>
        </div>

        {/* Full Schedule */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {currentRoute?.name} - Full Schedule
                </h3>
                <p className="text-gray-600 mt-1">
                  {selectedDay === 'weekday' ? 'Monday - Friday' : 'Saturday - Sunday'} schedule
                </p>
              </div>
              <div className="text-sm text-gray-600">
                All times shown in 24-hour format
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {currentSchedule ? (
              <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-3">
                {currentSchedule.times.map((time, index) => {
                const currentTime = getCurrentTime();
                const [currentHour, currentMinute] = currentTime.split(':').map(Number);
                const [timeHour, timeMinute] = time.split(':').map(Number);
                const isNext = timeHour * 60 + timeMinute > currentHour * 60 + currentMinute;
                const isCurrentNext = isNext && index === currentSchedule.times.findIndex(t => {
                  const [h, m] = t.split(':').map(Number);
                  return h * 60 + m > currentHour * 60 + currentMinute;
                });

                return (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg text-center transition-all ${
                      isCurrentNext 
                        ? 'bg-blue-100 border-2 border-blue-500 text-blue-700 font-bold' 
                        : isNext 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {time}
                    </div>
                    {isCurrentNext && (
                      <div className="text-xs mt-1">Next</div>
                    )}
                  </div>
                );
              })}
            </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No schedule times available for this route.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
