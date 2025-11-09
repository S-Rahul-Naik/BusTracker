
import { useState, useEffect } from 'react';

interface RouteAnalytics {
  routeId: string;
  routeName: string;
  avgDelay: number;
  onTimePercentage: number;
  totalTrips: number;
  peakHours: string[];
  frequentDelays: string[];
}

export default function SystemMetrics() {
  const [analytics, setAnalytics] = useState<RouteAnalytics[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [systemStats, setSystemStats] = useState({
    totalBuses: 24,
    activeBuses: 22,
    onTimePercentage: 87.3,
    avgSystemDelay: 3.2,
    totalPassengers: 12847,
    peakHour: '8:00 AM'
  });

  useEffect(() => {
    // Mock analytics data
    const mockAnalytics: RouteAnalytics[] = [
      {
        routeId: 'route-1',
        routeName: 'Route 42 - Downtown ↔ Airport',
        avgDelay: 4.2,
        onTimePercentage: 82.5,
        totalTrips: 156,
        peakHours: ['7:00-9:00 AM', '5:00-7:00 PM'],
        frequentDelays: ['Traffic congestion on Main St', 'Weather conditions']
      },
      {
        routeId: 'route-2',
        routeName: 'Route 15 - University ↔ Mall',
        avgDelay: 1.8,
        onTimePercentage: 94.2,
        totalTrips: 128,
        peakHours: ['8:00-10:00 AM', '3:00-6:00 PM'],
        frequentDelays: ['Student rush hours', 'Construction delays']
      },
      {
        routeId: 'route-3',
        routeName: 'Route 88 - Hospital ↔ Station',
        avgDelay: 6.7,
        onTimePercentage: 76.8,
        totalTrips: 98,
        peakHours: ['6:00-8:00 AM', '4:00-6:00 PM'],
        frequentDelays: ['Emergency vehicle priority', 'Road construction']
      },
      {
        routeId: 'route-4',
        routeName: 'Route 23 - Suburbs ↔ City Center',
        avgDelay: 2.1,
        onTimePercentage: 91.4,
        totalTrips: 142,
        peakHours: ['7:30-9:30 AM', '5:30-7:30 PM'],
        frequentDelays: ['Highway traffic', 'Weather delays']
      }
    ];

    setAnalytics(mockAnalytics);
  }, [selectedPeriod]);

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getDelayColor = (delay: number) => {
    if (delay <= 2) return 'text-green-600';
    if (delay <= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-8">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="ri-bus-line text-blue-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Buses</p>
              <p className="text-2xl font-bold text-gray-900">{systemStats.totalBuses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="ri-play-circle-line text-green-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Now</p>
              <p className="text-2xl font-bold text-gray-900">{systemStats.activeBuses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="ri-time-line text-purple-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">On Time</p>
              <p className="text-2xl font-bold text-gray-900">{systemStats.onTimePercentage}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="ri-timer-line text-orange-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Delay</p>
              <p className="text-2xl font-bold text-gray-900">{systemStats.avgSystemDelay}m</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <i className="ri-user-line text-indigo-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Passengers</p>
              <p className="text-2xl font-bold text-gray-900">{systemStats.totalPassengers.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="ri-fire-line text-red-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Peak Hour</p>
              <p className="text-lg font-bold text-gray-900">{systemStats.peakHour}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Route Analytics</h2>
          <div className="flex space-x-2">
            {['today', 'week', 'month'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedPeriod === period
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Route Performance Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Route</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">On Time %</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Avg Delay</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Total Trips</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Peak Hours</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Common Issues</th>
              </tr>
            </thead>
            <tbody>
              {analytics.map((route) => (
                <tr key={route.routeId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-900">{route.routeName}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(route.onTimePercentage)}`}>
                      {route.onTimePercentage}%
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`font-medium ${getDelayColor(route.avgDelay)}`}>
                      {route.avgDelay} min
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-900">{route.totalTrips}</td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      {route.peakHours.map((hour, index) => (
                        <div key={index} className="text-sm text-gray-600">{hour}</div>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      {route.frequentDelays.slice(0, 2).map((issue, index) => (
                        <div key={index} className="text-sm text-gray-600">{issue}</div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Delay Distribution</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">On Time (0-2 min)</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">65%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Minor Delay (2-5 min)</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '22%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">22%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Major Delay (5+ min)</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '13%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">13%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Hour Analysis</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">7:00-9:00 AM</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">High</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">12:00-2:00 PM</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">Medium</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">5:00-7:00 PM</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">Very High</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
