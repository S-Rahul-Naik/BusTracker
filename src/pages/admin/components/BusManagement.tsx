import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api';
import { toast } from 'react-hot-toast';
import { Bus, Wrench, Plus, X, Trash2 } from 'lucide-react';

interface Bus {
  id: string;
  busNumber: string;
  routeId: string;
  routeName?: string;
  status: 'active' | 'maintenance' | 'inactive';
  driverName?: string;
  driverContact?: string;
  capacity: number;
  lastMaintenance?: string;
  notes?: string;
}

export default function BusManagement() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [repairingBus, setRepairingBus] = useState<Bus | null>(null);
  const [replacementBuses, setReplacementBuses] = useState<string[]>([]);
  const [busSearchQuery, setBusSearchQuery] = useState('');
  const [newBus, setNewBus] = useState({
    busNumber: '',
    routeId: '',
    status: 'active' as 'active' | 'maintenance' | 'inactive',
    driverName: '',
    driverContact: '',
    capacity: 40,
    notes: ''
  });

  useEffect(() => {
    loadBuses();
    loadRoutes();
  }, []);

  const loadBuses = async () => {
    try {
      const data = await apiClient.getAdminBuses();
      // Map backend response to frontend format
      const mappedBuses = data.map((bus: any) => ({
        id: bus.id,
        busNumber: bus.bus_number || bus.busNumber || '',
        routeId: bus.route_id || bus.routeId || '',
        routeName: bus.routeName || bus.route_name || '',
        status: bus.status || 'active',
        driverName: bus.driver_name || bus.driverName || '',
        driverContact: bus.driver_contact || bus.driverContact || '',
        capacity: bus.capacity || 40,
        lastMaintenance: bus.last_maintenance || bus.lastMaintenance,
        notes: bus.notes || ''
      }));
      setBuses(mappedBuses);
    } catch (error) {
      console.error('Failed to load buses:', error);
      setBuses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRoutes = async () => {
    try {
      const data = await apiClient.getRoutes();
      setRoutes(data);
    } catch (error) {
      console.error('Failed to load routes:', error);
    }
  };

  const handleAddBus = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBus.busNumber || !newBus.routeId) {
      toast.error('Please fill in required fields (Bus Number, Route)');
      return;
    }

    try {
      const route = routes.find(r => r.id === newBus.routeId);
      const busData = {
        route_id: newBus.routeId,
        bus_number: newBus.busNumber,
        driver_name: newBus.driverName,
        driver_contact: newBus.driverContact,
        capacity: newBus.capacity,
        status: newBus.status,
        notes: newBus.notes,
        routeName: route?.name || ''
      };
      
      await apiClient.createBus(busData);
      toast.success('Bus added successfully! 🚌');
      setShowAddForm(false);
      setNewBus({
        busNumber: '',
        routeId: '',
        status: 'active',
        driverName: '',
        driverContact: '',
        capacity: 40,
        notes: ''
      });
      loadBuses();
    } catch (error) {
      console.error('Error adding bus:', error);
      toast.error('Failed to add bus');
    }
  };

  const handleUpdateStatus = async (busId: string, status: 'active' | 'maintenance' | 'inactive') => {
    // If changing to maintenance, show replacement bus selection modal
    if (status === 'maintenance') {
      const bus = buses.find(b => b.id === busId);
      if (bus) {
        setRepairingBus(bus);
        setReplacementBuses([]);
        setBusSearchQuery('');
        setShowRepairModal(true);
        return;
      }
    }

    // For active or inactive, update directly
    try {
      await apiClient.updateBus(busId, { status });
      toast.success(`Bus status updated to ${status.toUpperCase()}`);
      loadBuses();
    } catch (error) {
      console.error('Error updating bus status:', error);
      toast.error('Failed to update bus status');
    }
  };

  const handleConfirmRepair = async () => {
    if (!repairingBus) return;

    if (replacementBuses.length === 0) {
      toast.error('Please select at least one replacement bus');
      return;
    }

    try {
      // Update the repairing bus status
      await apiClient.updateBus(repairingBus.id, { 
        status: 'maintenance',
        replacement_buses: replacementBuses 
      });
      
      toast.success(
        `Bus #${repairingBus.busNumber} marked for repair. Passengers reassigned to Bus #${
          replacementBuses.map(id => buses.find(b => b.id === id)?.busNumber).join(', Bus #')
        }`,
        { duration: 5000 }
      );
      
      setShowRepairModal(false);
      setRepairingBus(null);
      setReplacementBuses([]);
      loadBuses();
    } catch (error) {
      console.error('Error updating bus status:', error);
      toast.error('Failed to update bus status');
    }
  };

  const toggleReplacementBus = (busId: string) => {
    setReplacementBuses(prev => 
      prev.includes(busId) 
        ? prev.filter(id => id !== busId)
        : [...prev, busId]
    );
  };

  const handleDeleteBus = async (busId: string) => {
    if (!confirm('Are you sure you want to delete this bus?')) {
      return;
    }

    try {
      await apiClient.deleteBus(busId);
      toast.success('Bus deleted successfully');
      loadBuses();
    } catch (error) {
      console.error('Error deleting bus:', error);
      toast.error('Failed to delete bus');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'maintenance':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '✅';
      case 'maintenance':
        return '🔧';
      case 'inactive':
        return '⏸️';
      default:
        return '❓';
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
          <h2 className="text-2xl font-bold text-gray-900">Bus Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage buses, track maintenance, and assign routes
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add New Bus
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{buses.length}</div>
              <div className="text-sm text-gray-600">Total Buses</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {buses.filter(b => b.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {buses.filter(b => b.status === 'maintenance').length}
              </div>
              <div className="text-sm text-gray-600">Maintenance</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⏸️</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {buses.filter(b => b.status === 'inactive').length}
              </div>
              <div className="text-sm text-gray-600">Inactive</div>
            </div>
          </div>
        </div>
      </div>

      {/* Repair Bus Modal - Select Replacement Buses */}
      {showRepairModal && repairingBus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Bus Going for Repair</h3>
                    <p className="text-sm text-gray-600">Assign replacement bus(es) for Bus #{repairingBus.busNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRepairModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bus className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Bus #{repairingBus.busNumber} - Under Repair</h4>
                    <p className="text-sm text-gray-700 mb-2">Route: {repairingBus.routeName || 'Not assigned'}</p>
                    <p className="text-sm text-gray-600">
                      Capacity: {repairingBus.capacity} passengers
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Select Replacement Bus(es) *
                </h4>
                <p className="text-xs text-gray-600 mb-3">
                  Choose one or more active buses to accommodate passengers from Bus #{repairingBus.busNumber}
                </p>
                
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    value={busSearchQuery}
                    onChange={(e) => setBusSearchQuery(e.target.value)}
                    placeholder="🔍 Search by bus number, route, or driver name..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                  {busSearchQuery && (
                    <button
                      onClick={() => setBusSearchQuery('')}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {buses
                  .filter(bus => 
                    bus.id !== repairingBus.id && 
                    bus.status === 'active' &&
                    (busSearchQuery === '' || 
                      bus.busNumber.toLowerCase().includes(busSearchQuery.toLowerCase()) ||
                      (bus.routeName || '').toLowerCase().includes(busSearchQuery.toLowerCase()) ||
                      (bus.driverName || '').toLowerCase().includes(busSearchQuery.toLowerCase())
                    )
                  )
                  .map(bus => (
                    <div
                      key={bus.id}
                      onClick={() => toggleReplacementBus(bus.id)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        replacementBuses.includes(bus.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            replacementBuses.includes(bus.id) ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <Bus className={`w-5 h-5 ${
                              replacementBuses.includes(bus.id) ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Bus #{bus.busNumber}</h4>
                            <p className="text-sm text-gray-600">Capacity: {bus.capacity} passengers</p>
                            {bus.driverName && (
                              <p className="text-xs text-gray-500">Driver: {bus.driverName}</p>
                            )}
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          replacementBuses.includes(bus.id)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {replacementBuses.includes(bus.id) && (
                            <span className="text-white text-xs">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                {buses.filter(bus => 
                  bus.id !== repairingBus.id && 
                  bus.status === 'active' &&
                  (busSearchQuery === '' || 
                    bus.busNumber.toLowerCase().includes(busSearchQuery.toLowerCase()) ||
                    (bus.routeName || '').toLowerCase().includes(busSearchQuery.toLowerCase()) ||
                    (bus.driverName || '').toLowerCase().includes(busSearchQuery.toLowerCase())
                  )
                ).length === 0 && (
                  <div className="text-center py-8">
                    <Bus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">
                      {busSearchQuery ? `No buses found matching "${busSearchQuery}"` : 'No active buses available'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {busSearchQuery ? 'Try a different search term' : 'Add more buses or activate inactive buses'}
                    </p>
                  </div>
                )}
              </div>

              {replacementBuses.length > 0 && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Selected:</strong> {replacementBuses.length} replacement bus(es) - 
                    Total capacity: {replacementBuses.reduce((sum, id) => 
                      sum + (buses.find(b => b.id === id)?.capacity || 0), 0
                    )} passengers
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleConfirmRepair}
                  disabled={replacementBuses.length === 0}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    replacementBuses.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  🔧 Confirm Repair & Reassign Passengers
                </button>
                <button
                  onClick={() => setShowRepairModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Bus Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Add New Bus</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBus} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bus Number *
                  </label>
                  <input
                    required
                    type="text"
                    value={newBus.busNumber}
                    onChange={(e) => setNewBus({ ...newBus, busNumber: e.target.value })}
                    placeholder="e.g., 1, 2, 3, 4, 5..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to Route *
                  </label>
                  <select
                    required
                    value={newBus.routeId}
                    onChange={(e) => setNewBus({ ...newBus, routeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a route</option>
                    {routes.map(route => (
                      <option key={route.id} value={route.id}>{route.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    value={newBus.driverName}
                    onChange={(e) => setNewBus({ ...newBus, driverName: e.target.value })}
                    placeholder="Driver name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Driver Contact
                  </label>
                  <input
                    type="text"
                    value={newBus.driverContact}
                    onChange={(e) => setNewBus({ ...newBus, driverContact: e.target.value })}
                    placeholder="Phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity (passengers)
                  </label>
                  <input
                    type="number"
                    value={newBus.capacity}
                    onChange={(e) => setNewBus({ ...newBus, capacity: parseInt(e.target.value) || 40 })}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newBus.status}
                    onChange={(e) => setNewBus({ ...newBus, status: e.target.value as 'active' | 'maintenance' | 'inactive' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newBus.notes}
                  onChange={(e) => setNewBus({ ...newBus, notes: e.target.value })}
                  rows={3}
                  placeholder="Additional notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Bus
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bus List */}
      {buses.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Bus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Buses Added</h3>
          <p className="text-gray-600 mb-4">Start by adding your first bus to the system</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add First Bus
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buses.map((bus) => (
            <div key={bus.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bus className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Bus #{bus.busNumber}</h3>
                    <p className="text-sm text-gray-600">{bus.routeName || 'No route assigned'}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(bus.status)}`}>
                  {getStatusIcon(bus.status)} {bus.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-2 text-sm mb-4">
                {bus.driverName && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <span>👤</span>
                    <span>{bus.driverName}</span>
                  </div>
                )}
                {bus.driverContact && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <span>📞</span>
                    <span>{bus.driverContact}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-700">
                  <span>👥</span>
                  <span>Capacity: {bus.capacity}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {bus.status !== 'active' && (
                  <button
                    onClick={() => handleUpdateStatus(bus.id, 'active')}
                    className="flex-1 bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                  >
                    ✅ Active
                  </button>
                )}
                {bus.status !== 'maintenance' && (
                  <button
                    onClick={() => handleUpdateStatus(bus.id, 'maintenance')}
                    className="flex-1 bg-orange-100 text-orange-700 px-3 py-2 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
                  >
                    🔧 Repair
                  </button>
                )}
                <button
                  onClick={() => handleDeleteBus(bus.id)}
                  className="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {bus.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 italic">{bus.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
