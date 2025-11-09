
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/feature/Header';

export default function Notifications() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'delay',
      route: 'Route 42',
      message: 'Bus delayed by 5 minutes due to traffic',
      time: '2 minutes ago',
      read: false
    },
    {
      id: 2,
      type: 'arrival',
      route: 'Route 15',
      message: 'Bus arriving at Library Complex in 3 minutes',
      time: '5 minutes ago',
      read: true
    },
    {
      id: 3,
      type: 'service',
      route: 'Route 88',
      message: 'Service temporarily suspended due to maintenance',
      time: '1 hour ago',
      read: false
    }
  ]);

  const [subscriptions, setSubscriptions] = useState([
    {
      id: 1,
      route: 'Route 42',
      stop: 'Engineering Building',
      alertTypes: ['delays', 'arrivals'],
      active: true
    },
    {
      id: 2,
      route: 'Route 15',
      stop: 'Library Complex',
      alertTypes: ['delays'],
      active: true
    }
  ]);

  const routes = [
    { id: 'route-1', name: 'Route 42', description: 'Main Campus ↔ Engineering Building' },
    { id: 'route-2', name: 'Route 15', description: 'Dormitories ↔ Library Complex' },
    { id: 'route-3', name: 'Route 88', description: 'Medical Center ↔ Sports Complex' },
    { id: 'route-4', name: 'Route 23', description: 'Student Housing ↔ Academic Center' }
  ];

  const busStops = [
    'Main Campus Gate', 'Engineering Building', 'Library Complex', 'Student Center',
    'Dormitory A', 'Dormitory B', 'Medical Center', 'Sports Complex', 'Academic Center',
    'Cafeteria', 'Administration Building', 'Parking Lot C'
  ];

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const toggleSubscription = (id: number) => {
    setSubscriptions(prev =>
      prev.map(sub =>
        sub.id === id ? { ...sub, active: !sub.active } : sub
      )
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'delay': return 'ri-time-line';
      case 'arrival': return 'ri-bus-line';
      case 'service': return 'ri-tools-line';
      default: return 'ri-notification-line';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'delay': return 'text-yellow-600 bg-yellow-100';
      case 'arrival': return 'text-green-600 bg-green-100';
      case 'service': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'notifications'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <i className="ri-notification-line mr-2"></i>
              Recent Notifications
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'subscriptions'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <i className="ri-settings-line mr-2"></i>
              Manage Subscriptions
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'new'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <i className="ri-add-line mr-2"></i>
              New Subscription
            </button>
          </nav>
        </div>

        {/* Recent Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Recent Notifications</h2>
                  <button 
                    onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Mark all as read
                  </button>
                </div>
              </div>
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-6 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-25' : ''}`}
                  >
                    <div className="flex items-start">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${getNotificationColor(notification.type)}`}>
                        <i className={`${getNotificationIcon(notification.type)} text-lg`}></i>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-900">{notification.route}</span>
                            {!notification.read && (
                              <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">{notification.time}</span>
                        </div>
                        <p className="text-gray-700 mt-1">{notification.message}</p>
                        {!notification.read && (
                          <button 
                            onClick={() => markAsRead(notification.id)}
                            className="text-sm text-blue-600 hover:text-blue-700 mt-2"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Manage Subscriptions */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Your Subscriptions</h2>
                <p className="text-gray-600 mt-1">Manage your bus alert subscriptions</p>
              </div>
              <div className="divide-y">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="font-medium text-gray-900">{subscription.route}</h3>
                          <span className="ml-2 text-sm text-gray-500">→ {subscription.stop}</span>
                        </div>
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-2">
                            {subscription.alertTypes.map((type) => (
                              <span 
                                key={type}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                              >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleSubscription(subscription.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            subscription.active ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              subscription.active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <button className="text-gray-400 hover:text-red-600 transition-colors">
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* New Subscription */}
        {activeTab === 'new' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Create New Subscription</h2>
                <p className="text-gray-600 mt-1">Set up alerts for your frequently used routes</p>
              </div>
              <div className="p-6">
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Route
                    </label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8">
                      <option value="">Choose a route...</option>
                      {routes.map((route) => (
                        <option key={route.id} value={route.id}>
                          {route.name} - {route.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Bus Stop
                    </label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8">
                      <option value="">Choose a stop...</option>
                      {busStops.map((stop) => (
                        <option key={stop} value={stop}>
                          {stop}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alert Types
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Bus arrival notifications</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Delay alerts</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Service disruptions</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Schedule changes</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notification Method
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="radio" name="method" className="border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Push notifications only</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="method" className="border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Email notifications</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="method" className="border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Both push and email</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button 
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      Create Subscription
                    </button>
                    <button 
                      type="button"
                      onClick={() => setActiveTab('subscriptions')}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
