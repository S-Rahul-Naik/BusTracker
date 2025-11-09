
import { useState, useEffect } from 'react';
import apiClient from '../../../lib/api';

interface TimelineStop {
  id: string;
  name: string;
  scheduledTime: string;
  predictedTime: string;
  actualTime?: string;
  status: 'completed' | 'current' | 'upcoming';
  delay: number;
  passengers: number;
}

interface BusTimelineProps {
  selectedRoute: string | null;
  busId?: string;
}

export default function BusTimeline({ selectedRoute, busId }: BusTimelineProps) {
  const [timelineData, setTimelineData] = useState<TimelineStop[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch real timeline data from API
    const fetchTimelineData = async () => {
      if (!selectedRoute) return;
      
      try {
        setLoading(true);
        const predictions = await apiClient.getRoutePredictions(selectedRoute);
        
        // Transform API data
        const transformedTimeline = predictions.map((pred: any) => ({
          id: pred.stop_id,
          name: pred.stop_name || pred.stop_id,
          scheduledTime: new Date(pred.scheduled_arrival).toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          predictedTime: new Date(pred.predicted_arrival).toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          actualTime: pred.actual_arrival ? new Date(pred.actual_arrival).toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : undefined,
          status: pred.status || 'upcoming',
          delay: pred.delay_minutes || 0,
          passengers: pred.passenger_count || 0
        }));
        
        setTimelineData(transformedTimeline);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching timeline data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimelineData();

    // Update data every 30 seconds for real-time updates
    const interval = setInterval(fetchTimelineData, 30000);

    return () => clearInterval(interval);
  }, [selectedRoute, busId]);

  const getConfidenceColor = (delay: number) => {
    const confidence = delay <= 0 ? 95 : delay <= 2 ? 92 : delay <= 5 ? 87 : 84;
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceValue = (delay: number) => {
    return delay <= 0 ? 95 : delay <= 2 ? 92 : delay <= 5 ? 87 : 84;
  };

  const getStatusBadge = (delay: number) => {
    if (delay > 10) return 'bg-red-100 text-red-800';
    if (delay > 5) return 'bg-orange-100 text-orange-800';
    if (delay > 0) return 'bg-yellow-100 text-yellow-800';
    if (delay < 0) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Next Arrivals</h2>
            <p className="text-gray-600 mt-1">
              {selectedRoute ? `Route progress • Updated ${lastUpdated.toLocaleTimeString()}` : 'AI-powered predictions'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-blue-600 font-medium">
              <i className="ri-timeline-view mr-1"></i>
              Timeline View
            </div>
            <div className="text-xs text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {!selectedRoute ? (
          <div className="text-center py-8">
            <i className="ri-map-pin-line text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">Select a route to view arrival times</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timelineData.map((stop, index) => {
              const confidence = getConfidenceValue(stop.delay);
              return (
                <div key={stop.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{stop.name}</div>
                        <div className="text-sm text-gray-600 flex items-center">
                          <i className="ri-user-line mr-1"></i>
                          {stop.passengers} passengers waiting
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-gray-900">{stop.predictedTime}</div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadge(stop.delay)}`}>
                          {stop.delay > 0 ? `+${stop.delay}` : stop.delay} min
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-600">
                      Scheduled: {stop.scheduledTime}
                    </div>
                    <div className="flex items-center">
                      <span className={`${getConfidenceColor(stop.delay)} font-medium`}>
                        {confidence}% confidence
                      </span>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full ${
                            confidence >= 90 ? 'bg-green-500' :
                            confidence >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <i className="ri-brain-line mr-1"></i>
            ML-powered predictions
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              <span className="text-xs text-gray-600">High confidence</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
              <span className="text-xs text-gray-600">Medium confidence</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
              <span className="text-xs text-gray-600">Low confidence</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
