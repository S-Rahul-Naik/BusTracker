
import { useState } from 'react';

interface Route {
  id: string;
  name: string;
  description: string;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  routes: Route[];
}

export default function SubscriptionModal({ isOpen, onClose, routes }: SubscriptionModalProps) {
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferences, setPreferences] = useState({
    delays: true,
    arrivals: false,
    emergencies: true,
    maintenance: false
  });
  const [channels, setChannels] = useState({
    push: true,
    email: false,
    sms: false
  });

  const handleRouteToggle = (routeId: string) => {
    setSelectedRoutes(prev =>
      prev.includes(routeId)
        ? prev.filter(id => id !== routeId)
        : [...prev, routeId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle subscription logic here
    console.log('Subscription data:', {
      routes: selectedRoutes,
      email,
      phone,
      preferences,
      channels
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Subscribe to Route Alerts</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Route Selection */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Select Routes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {routes.map((route) => (
                <label key={route.id} className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={selectedRoutes.includes(route.id)}
                    onChange={() => handleRouteToggle(route.id)}
                    className="text-blue-600 focus:ring-blue-500 mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{route.name}</div>
                    <div className="text-sm text-gray-600">{route.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Notification Preferences */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(preferences).map(([key, value]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setPreferences(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="text-blue-600 focus:ring-blue-500 mr-3"
                  />
                  <span className="text-gray-700 capitalize">
                    {key === 'delays' && 'Delay Notifications'}
                    {key === 'arrivals' && 'Arrival Reminders'}
                    {key === 'emergencies' && 'Emergency Alerts'}
                    {key === 'maintenance' && 'Maintenance Updates'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Notification Channels */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Notification Channels</h4>
            <div className="space-y-2">
              {Object.entries(channels).map(([key, value]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setChannels(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="text-blue-600 focus:ring-blue-500 mr-3"
                  />
                  <span className="text-gray-700">
                    {key === 'push' && 'Push Notifications'}
                    {key === 'email' && 'Email Notifications'}
                    {key === 'sms' && 'SMS Notifications'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedRoutes.length === 0 || !email}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <i className="ri-notification-line mr-2"></i>
              Subscribe to {selectedRoutes.length} Route{selectedRoutes.length !== 1 ? 's' : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
