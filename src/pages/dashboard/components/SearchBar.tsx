
import { useState, useEffect, useRef } from 'react';
import apiClient from '../../../lib/api';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  busCount: number;
}

interface BusStop {
  code: string;
  name: string;
  id?: string;
}

export default function SearchBar({ searchQuery, onSearchChange, busCount }: SearchBarProps) {
  const [fromStop, setFromStop] = useState<BusStop | null>(null);
  const [toStop, setToStop] = useState<BusStop | null>(null);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');
  const [busStops, setBusStops] = useState<BusStop[]>([]);

  // Fetch bus stops from API
  useEffect(() => {
    const fetchStops = async () => {
      try {
        const data = await apiClient.getStops();
        
        console.log('📍 Fetched stops from API:', data);
        
        // Transform API data
        const transformedStops = data.map((stop: any) => ({
          id: stop.id,
          code: stop.code || stop.name.substring(0, 3).toUpperCase(),
          name: stop.name
        }));
        
        setBusStops(transformedStops);
        console.log('✅ Stops loaded:', transformedStops.length);
      } catch (error) {
        console.error('❌ Error fetching stops:', error);
        // Show empty list if API fails - no fallback
        setBusStops([]);
      }
    };

    fetchStops();
  }, []);

  const filteredFromStops = busStops.filter(stop => 
    stop.name.toLowerCase().includes(fromSearch.toLowerCase()) ||
    stop.code.toLowerCase().includes(fromSearch.toLowerCase())
  );

  const filteredToStops = busStops.filter(stop => 
    stop.name.toLowerCase().includes(toSearch.toLowerCase()) ||
    stop.code.toLowerCase().includes(toSearch.toLowerCase())
  );

  const handleFromSelect = (stop: BusStop) => {
    setFromStop(stop);
    setFromSearch('');
    setShowFromDropdown(false);
    updateSearchQuery(stop, toStop);
  };

  const handleToSelect = (stop: BusStop) => {
    setToStop(stop);
    setToSearch('');
    setShowToDropdown(false);
    updateSearchQuery(fromStop, stop);
  };

  const updateSearchQuery = (from: BusStop | null, to: BusStop | null) => {
    if (from && to) {
      onSearchChange(`${from.name} to ${to.name}`);
    } else if (from) {
      onSearchChange(`from ${from.name}`);
    } else if (to) {
      onSearchChange(`to ${to.name}`);
    } else {
      onSearchChange('');
    }
  };

  const handleSwapStops = () => {
    const temp = fromStop;
    setFromStop(toStop);
    setToStop(temp);
    updateSearchQuery(toStop, temp);
  };

  const handleFindBuses = () => {
    if (fromStop && toStop) {
      // Use the same format as dropdown selection
      onSearchChange(`${fromStop.name} to ${toStop.name}`);
    } else if (fromStop) {
      onSearchChange(`from ${fromStop.name}`);
    } else if (toStop) {
      onSearchChange(`to ${toStop.name}`);
    }
  };

  const handleClear = () => {
    setFromStop(null);
    setToStop(null);
    setFromSearch('');
    setToSearch('');
    onSearchChange('');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Find Buses</h2>
        <div className="text-sm text-gray-600">
          {busCount} bus{busCount !== 1 ? 'es' : ''} found
        </div>
      </div>
      
      <div className="space-y-4">
        {/* From Stop */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
          <div className="relative">
            <div className="flex items-center border-2 border-gray-200 rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-l-lg">
                <span className="text-blue-600 font-bold text-sm">
                  {fromStop ? fromStop.code : '○'}
                </span>
              </div>
              <input
                type="text"
                value={fromStop ? fromStop.name : fromSearch}
                onChange={(e) => {
                  if (!fromStop) {
                    setFromSearch(e.target.value);
                    setShowFromDropdown(true);
                  }
                }}
                onFocus={() => {
                  if (!fromStop) {
                    setShowFromDropdown(true);
                  }
                }}
                placeholder="Enter starting point"
                className="flex-1 px-3 py-3 text-sm border-0 focus:outline-none focus:ring-0"
                readOnly={!!fromStop}
              />
              {fromStop && (
                <button
                  onClick={() => {
                    setFromStop(null);
                    setFromSearch('');
                    updateSearchQuery(null, toStop);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 mr-2"
                >
                  <i className="ri-close-line"></i>
                </button>
              )}
            </div>

            {/* From Dropdown */}
            {showFromDropdown && !fromStop && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                {filteredFromStops.map((stop) => (
                  <button
                    key={stop.code}
                    onClick={() => handleFromSelect(stop)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center">
                      <span className="w-8 h-8 bg-blue-100 rounded text-blue-600 font-bold text-xs flex items-center justify-center mr-3">
                        {stop.code}
                      </span>
                      <span className="text-sm text-gray-900">{stop.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwapStops}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            disabled={!fromStop && !toStop}
          >
            <i className="ri-arrow-up-down-line text-gray-600"></i>
          </button>
        </div>

        {/* To Stop */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <div className="relative">
            <div className="flex items-center border-2 border-gray-200 rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-l-lg">
                <span className="text-green-600 font-bold text-sm">
                  {toStop ? toStop.code : '○'}
                </span>
              </div>
              <input
                type="text"
                value={toStop ? toStop.name : toSearch}
                onChange={(e) => {
                  if (!toStop) {
                    setToSearch(e.target.value);
                    setShowToDropdown(true);
                  }
                }}
                onFocus={() => {
                  if (!toStop) {
                    setShowToDropdown(true);
                  }
                }}
                placeholder="Enter destination"
                className="flex-1 px-3 py-3 text-sm border-0 focus:outline-none focus:ring-0"
                readOnly={!!toStop}
              />
              {toStop && (
                <button
                  onClick={() => {
                    setToStop(null);
                    setToSearch('');
                    updateSearchQuery(fromStop, null);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 mr-2"
                >
                  <i className="ri-close-line"></i>
                </button>
              )}
            </div>

            {/* To Dropdown */}
            {showToDropdown && !toStop && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                {filteredToStops.map((stop) => (
                  <button
                    key={stop.code}
                    onClick={() => handleToSelect(stop)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center">
                      <span className="w-8 h-8 bg-green-100 rounded text-green-600 font-bold text-xs flex items-center justify-center mr-3">
                        {stop.code}
                      </span>
                      <span className="text-sm text-gray-900">{stop.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Find Buses Button */}
        <button
          onClick={handleFindBuses}
          disabled={!fromStop && !toStop}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <i className="ri-search-line mr-2"></i>
          Find buses
        </button>

        {/* Quick Actions */}
        {(fromStop || toStop) && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <button
              onClick={handleClear}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
            <div className="text-xs text-gray-500">
              {fromStop && toStop ? 'Route search ready' : 'Select both stops for route search'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
