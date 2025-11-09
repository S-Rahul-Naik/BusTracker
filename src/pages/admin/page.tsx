
import { useState } from 'react';
import Header from '../../components/feature/Header';
import RouteManagement from './components/RouteManagement';
import UserManagement from './components/UserManagement';
import SystemMetrics from './components/SystemMetrics';
import EmergencyBroadcast from './components/EmergencyBroadcast';
import GlobalScheduleSettings from './components/GlobalScheduleSettings';
import TodaySchedule from './components/TodaySchedule';
import BusManagement from './components/BusManagement';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', name: 'Overview', icon: 'ri-dashboard-line' },
    { id: 'today', name: 'Today\'s Schedule', icon: 'ri-calendar-check-line' },
    { id: 'buses', name: 'Buses', icon: 'ri-bus-line' },
    { id: 'routes', name: 'Routes', icon: 'ri-route-line' },
    { id: 'schedule', name: 'Global Schedule', icon: 'ri-time-line' },
    { id: 'users', name: 'Users', icon: 'ri-user-line' },
    { id: 'emergency', name: 'Emergency', icon: 'ri-alarm-warning-line' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <i className={`${tab.icon} mr-2`}></i>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <SystemMetrics />}
        {activeTab === 'today' && <TodaySchedule />}
        {activeTab === 'buses' && <BusManagement />}
        {activeTab === 'routes' && <RouteManagement />}
        {activeTab === 'schedule' && <GlobalScheduleSettings />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'emergency' && <EmergencyBroadcast />}
      </div>
    </div>
  );
}
