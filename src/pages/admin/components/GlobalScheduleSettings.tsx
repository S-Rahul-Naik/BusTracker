import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api';
import { toast } from 'react-hot-toast';
import { Clock, Save, RefreshCw } from 'lucide-react';

interface GlobalSchedule {
  morningTripTime: string;
  halfDayTripTime: string;
  eveningTripTime: string;
  examEveningTime: string;
}

export default function GlobalScheduleSettings() {
  const [globalSchedule, setGlobalSchedule] = useState<GlobalSchedule>({
    morningTripTime: '7:00 AM',
    halfDayTripTime: '1:00 PM',
    eveningTripTime: '4:45 PM',
    examEveningTime: '5:20 PM'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGlobalSchedule();
  }, []);

  const loadGlobalSchedule = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading global schedule...');
      const response = await apiClient.get('/admin/global-schedule');
      console.log('📥 Received global schedule:', response.data);
      if (response.data) {
        setGlobalSchedule(response.data);
        console.log('✅ Global schedule state updated:', response.data);
      }
    } catch (error) {
      console.error('❌ Error loading global schedule:', error);
      // Use defaults if not found
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('💾 Saving global schedule:', globalSchedule);
      const response = await apiClient.post('/admin/global-schedule', globalSchedule);
      console.log('✅ Save response:', response.data);
      toast.success('Global schedule updated successfully!');
    } catch (error) {
      console.error('❌ Error saving global schedule:', error);
      toast.error('Failed to save global schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyToAllRoutes = async () => {
    if (!confirm('This will update ALL routes with these global timings. Continue?')) {
      return;
    }

    setSaving(true);
    try {
      const response = await apiClient.post('/admin/apply-global-schedule');
      toast.success('Global schedule applied to all routes!');
      console.log('Applied to routes:', response.data);
    } catch (error) {
      console.error('Error applying global schedule:', error);
      toast.error('Failed to apply schedule to all routes');
    } finally {
      setSaving(false);
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-900">Global Schedule Settings</h2>
          <p className="text-sm text-gray-600 mt-1">
            Set default timings that apply to all bus routes
          </p>
        </div>
        <Clock className="h-8 w-8 text-blue-600" />
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">About Global Timings</h3>
            <div className="text-sm text-blue-700 mt-1 space-y-1">
              <p>• <strong>Morning Trip:</strong> Fixed at 7:00 AM for all buses (cannot be changed)</p>
              <p>• <strong>Half Day & Evening:</strong> Set default timings here that apply to all routes</p>
              <p>• <strong>Route Overrides:</strong> Individual routes can still have custom timings if needed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Schedule Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Default Bus Timings</h3>

        {/* Morning Trip - Fixed */}
        <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <span className="mr-2">🌅</span>
            Morning Trip (To College) - FIXED
          </label>
          <input
            type="text"
            value={globalSchedule.morningTripTime}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-600"
          />
          <p className="text-xs text-gray-500 mt-1">
            Morning timing is fixed for all buses and cannot be changed
          </p>
        </div>

        {/* Half Day Trip */}
        <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <span className="mr-2">🕐</span>
            Half Day Trip (From College)
          </label>
          <input
            type="text"
            value={globalSchedule.halfDayTripTime}
            onChange={(e) => setGlobalSchedule({ ...globalSchedule, halfDayTripTime: e.target.value })}
            placeholder="e.g., 1:00 PM"
            className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-600 mt-1">
            Default time when college ends early (half day)
          </p>
        </div>

        {/* Evening Normal Trip */}
        <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <span className="mr-2">🌆</span>
            Evening Trip - Normal Days (From College)
          </label>
          <input
            type="text"
            value={globalSchedule.eveningTripTime}
            onChange={(e) => setGlobalSchedule({ ...globalSchedule, eveningTripTime: e.target.value })}
            placeholder="e.g., 4:45 PM"
            className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-600 mt-1">
            Default time for regular college days
          </p>
        </div>

        {/* Evening Exam Trip */}
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <span className="mr-2">📝</span>
            Evening Trip - Exam Days (From College)
          </label>
          <input
            type="text"
            value={globalSchedule.examEveningTime}
            onChange={(e) => setGlobalSchedule({ ...globalSchedule, examEveningTime: e.target.value })}
            placeholder="e.g., 5:20 PM"
            className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-600 mt-1">
            Default time when exams are scheduled
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              <span>Save Global Settings</span>
            </>
          )}
        </button>

        <button
          onClick={handleApplyToAllRoutes}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className="h-5 w-5" />
          <span>Apply to All Routes</span>
        </button>
      </div>

      {/* Help Text */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">How it works:</h4>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li><strong>Save Global Settings:</strong> Updates the default timings for new routes</li>
          <li><strong>Apply to All Routes:</strong> Updates all existing routes with these timings</li>
          <li>Routes with custom timings will be overwritten when you apply globally</li>
          <li>You can still set custom timings for individual routes in Route Management</li>
        </ul>
      </div>
    </div>
  );
}
