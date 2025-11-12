// API Configuration
export const API_CONFIG = {
  // Updated to current laptop IP address
  BASE_URL: 'http://10.158.230.65:8000', // Current laptop IP on WiFi
  ENDPOINTS: {
    DRIVER_LOGIN: '/api/driver/login',
    UPDATE_LOCATION: '/api/driver/update-location',
    START_TRIP: '/api/driver/start-trip',
    END_TRIP: '/api/driver/end-trip',
  },
};

export const LOCATION_TASK_NAME = 'background-location-task';
