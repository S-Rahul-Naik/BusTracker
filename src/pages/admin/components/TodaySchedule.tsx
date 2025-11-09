import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api';
import { toast } from 'react-hot-toast';
import { Calendar, Sun, Clock, BookOpen, Home } from 'lucide-react';

type ScheduleType = 'regular' | 'halfday' | 'exam' | 'holiday';

export default function TodaySchedule() {
  const [todaySchedule, setTodaySchedule] = useState<ScheduleType>('regular');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTodaySchedule();
  }, []);

  const loadTodaySchedule = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/today-schedule');
      if (response.data?.scheduleType) {
        setTodaySchedule(response.data.scheduleType);
      }
    } catch (error) {
      console.error('Error loading today schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleChange = async (type: ScheduleType) => {
    setSaving(true);
    try {
      await apiClient.post('/admin/today-schedule', { scheduleType: type });
      setTodaySchedule(type);
      toast.success(`Schedule updated to ${type.toUpperCase()}!`);
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  const scheduleTypes = [
    {
      id: 'regular' as ScheduleType,
      name: 'Regular Day',
      icon: Sun,
      color: 'bg-blue-500 hover:bg-blue-600',
      borderColor: 'border-blue-500',
      description: 'Morning + Evening Normal'
    },
    {
      id: 'halfday' as ScheduleType,
      name: 'Half Day',
      icon: Clock,
      color: 'bg-orange-500 hover:bg-orange-600',
      borderColor: 'border-orange-500',
      description: 'Morning + Half Day (1:00 PM)'
    },
    {
      id: 'exam' as ScheduleType,
      name: 'Exam Day',
      icon: BookOpen,
      color: 'bg-purple-500 hover:bg-purple-600',
      borderColor: 'border-purple-500',
      description: 'Morning + Evening Exam'
    },
    {
      id: 'holiday' as ScheduleType,
      name: 'Holiday',
      icon: Home,
      color: 'bg-gray-500 hover:bg-gray-600',
      borderColor: 'border-gray-500',
      description: 'No buses scheduled'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Today's Schedule</h2>
          <p className="text-sm text-gray-600 mt-1">
            Set the bus schedule type for today - students will see this on the app
          </p>
        </div>
        <Calendar className="h-8 w-8 text-blue-600" />
      </div>

      {/* Current Schedule Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium opacity-90">Current Schedule</div>
            <div className="text-3xl font-bold mt-1">
              {scheduleTypes.find(s => s.id === todaySchedule)?.name || 'Regular Day'}
            </div>
            <div className="text-sm opacity-90 mt-2">
              {scheduleTypes.find(s => s.id === todaySchedule)?.description}
            </div>
          </div>
          <div className="text-6xl opacity-20">
            {(() => {
              const Icon = scheduleTypes.find(s => s.id === todaySchedule)?.icon || Sun;
              return <Icon className="w-16 h-16" />;
            })()}
          </div>
        </div>
      </div>

      {/* Schedule Type Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Today's Schedule</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scheduleTypes.map((type) => {
            const Icon = type.icon;
            const isActive = todaySchedule === type.id;
            
            return (
              <button
                key={type.id}
                onClick={() => handleScheduleChange(type.id)}
                disabled={saving || isActive}
                className={`
                  relative p-6 rounded-lg border-2 transition-all duration-200
                  ${isActive 
                    ? `${type.borderColor} bg-gray-50` 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                  ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-start gap-4">
                  <div className={`
                    w-12 h-12 rounded-lg ${type.color} 
                    flex items-center justify-center flex-shrink-0
                  `}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900">{type.name}</h4>
                      {isActive && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">How it works</h3>
            <div className="text-sm text-blue-700 mt-1 space-y-1">
              <p>• Students see the selected schedule type on the app</p>
              <p>• Bus timings automatically adjust based on schedule type</p>
              <p>• Changes take effect immediately for all users</p>
              <p>• Schedule resets to "Regular Day" at midnight</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Morning Trip</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">7:00 AM</div>
          <div className="text-xs text-gray-500 mt-1">Fixed for all days</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Afternoon/Evening</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {todaySchedule === 'halfday' && '1:00 PM'}
            {todaySchedule === 'regular' && '5:30 PM'}
            {todaySchedule === 'exam' && '5:30 PM'}
            {todaySchedule === 'holiday' && 'N/A'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {todaySchedule === 'holiday' ? 'No service' : 'From college'}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Trips Today</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {todaySchedule === 'holiday' ? '0' : '2'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {todaySchedule === 'holiday' ? 'Holiday' : 'Morning + Afternoon/Evening'}
          </div>
        </div>
      </div>
    </div>
  );
}
