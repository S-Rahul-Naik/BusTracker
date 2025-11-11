// API Configuration
export const API_CONFIG = {
  // Change this to your laptop IP or deployed backend URL
  BASE_URL: 'http://192.168.1.100:8000', // Replace with your laptop IP
  ENDPOINTS: {
    DRIVER_LOGIN: '/api/driver/login',
    UPDATE_LOCATION: '/api/driver/update-location',
    START_TRIP: '/api/driver/start-trip',
    END_TRIP: '/api/driver/end-trip',
  },
};

export const LOCATION_TASK_NAME = 'background-location-task';
