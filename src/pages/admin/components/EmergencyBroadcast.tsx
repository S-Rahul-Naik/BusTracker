
import { useState } from 'react';

export default function EmergencyBroadcast() {
  const [broadcastType, setBroadcastType] = useState('general');
  const [message, setMessage] = useState('');
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [urgencyLevel, setUrgencyLevel] = useState('medium');
  const [channels, setChannels] = useState({
    push: true,
    sms: false,
    email: true
  });

  const routes = [
    { id: 'route-1', name: 'Route 42', subscribers: 3247 },
    { id: 'route-2', name: 'Route 15', subscribers: 2156 },
    { id: 'route-3', name: 'Route 88', subscribers: 1834 },
    { id: 'route-4', name: 'Route 23', subscribers: 2891 }
  ];

  const recentBroadcasts = [
    {
      id: 'broadcast-1',
      type: 'emergency',
      message: 'Service suspended on Route 88 due to road construction',
      timestamp: '2 hours ago',
      recipients: 1834,
      channels: ['push', 'sms', 'email']
    },
    {
      id: 'broadcast-2',
      type: 'maintenance',
      message: 'Scheduled maintenance on Route 42 this weekend',
      timestamp: '1 day ago',
      recipients: 3247,
      channels: ['push', 'email']
    },
    {
      id: 'broadcast-3',
      type: 'weather',
      message: 'Delays expected due to heavy snow conditions',
      timestamp: '3 days ago',
      recipients: 12847,
      channels: ['push', 'sms', 'email']
    }
  ];

  const handleRouteToggle = (routeId: string) => {
    setSelectedRoutes(prev =>
      prev.includes(routeId)
        ? prev.filter(id => id !== routeId)
        : [...prev, routeId]
    );
  };

  const getTotalRecipients = () => {
    if (broadcastType === 'all') return 12847;
    return routes
      .filter(route => selectedRoutes.includes(route.id))
      .reduce((total, route) => total + route.subscribers, 0);
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Emergency Broadcast</h2>
        <p className="text-gray-600">Send urgent notifications to passengers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Broadcast Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Create Broadcast</h3>

            <form className="space-y-6">
              {/* Broadcast Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Broadcast Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBroadcastType('general')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      broadcastType === 'general'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <i className="ri-information-line text-xl mb-2"></i>
                    <div className="font-medium">General Alert</div>
                    <div className="text-sm text-gray-600">Service updates</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastType('emergency')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      broadcastType === 'emergency'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <i className="ri-alarm-warning-line text-xl mb-2"></i>
                    <div className="font-medium">Emergency</div>
                    <div className="text-sm text-gray-600">Critical alerts</div>
                  </button>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your broadcast message..."
                />
                <div className="text-sm text-gray-500 mt-1">{message.length}/500 characters</div>
              </div>

              {/* Urgency Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
                <select
                  value={urgencyLevel}
                  onChange={(e) => setUrgencyLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                >
                  <option value="low">Low - Information only</option>
                  <option value="medium">Medium - Important update</option>
                  <option value="high">High - Urgent action required</option>
                </select>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Target Audience</label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="audience"
                      value="all"
                      checked={broadcastType === 'all'}
                      onChange={() => setBroadcastType('all')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2">All Users (12,847 subscribers)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="audience"
                      value="routes"
                      checked={broadcastType === 'routes'}
                      onChange={() => setBroadcastType('routes')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2">Specific Routes</span>
                  </label>
                </div>

                {broadcastType === 'routes' && (
                  <div className="mt-3 space-y-2">
                    {routes.map((route) => (
                      <label key={route.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedRoutes.includes(route.id)}
                            onChange={() => handleRouteToggle(route.id)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-3 font-medium">{route.name}</span>
                        </div>
                        <span className="text-sm text-gray-600">{route.subscribers} subscribers</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Notification Channels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Notification Channels</label>
                <div className="space-y-2">
                  {Object.entries(channels).map(([channel, enabled]) => (
                    <label key={channel} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setChannels(prev => ({ ...prev, [channel]: e.target.checked }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 capitalize">{channel} Notifications</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Send Button */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
                  disabled={!message.trim()}
                >
                  <i className="ri-send-plane-line mr-2"></i>
                  Send to {getTotalRecipients().toLocaleString()} Users
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Recent Broadcasts */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Broadcasts</h3>

            <div className="space-y-4">
              {recentBroadcasts.map((broadcast) => (
                <div key={broadcast.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(broadcast.type)}`}>
                      {broadcast.type}
                    </span>
                    <span className="text-xs text-gray-500">{broadcast.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-900 mb-2">{broadcast.message}</p>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{broadcast.recipients.toLocaleString()} recipients</span>
                    <div className="flex space-x-1">
                      {broadcast.channels.map((channel) => (
                        <span key={channel} className="bg-blue-100 text-blue-600 px-1 py-0.5 rounded">
                          {channel}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 text-blue-600 hover:text-blue-700 text-sm whitespace-nowrap">
              View All Broadcasts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
