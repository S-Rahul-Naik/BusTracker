import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCATION_TASK_NAME } from '../config/config';
import { apiService } from './api';

// Define the background location task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    const location = locations[0];

    try {
      // Get stored driver info and token
      const driverInfoJson = await AsyncStorage.getItem('driverInfo');
      const token = await AsyncStorage.getItem('authToken');

      if (!driverInfoJson || !token) {
        console.log('No driver info or token found, skipping location update');
        return;
      }

      const driverInfo = JSON.parse(driverInfoJson);

      // Send location to backend
      await apiService.updateLocation(
        {
          bus_id: driverInfo.bus_id,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: new Date(location.timestamp).toISOString(),
        },
        token
      );

      console.log('📍 Background location sent:', {
        lat: location.coords.latitude.toFixed(6),
        lng: location.coords.longitude.toFixed(6),
        accuracy: Math.round(location.coords.accuracy),
      });
    } catch (error) {
      console.error('Failed to send background location:', error);
    }
  }
});

class LocationService {
  async requestPermissions(): Promise<boolean> {
    try {
      // Request foreground permissions first
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.log('Foreground location permission denied');
        return false;
      }

      // Request background permissions
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        console.log('Background location permission denied');
        return false;
      }

      console.log('✅ All location permissions granted');
      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  async startBackgroundTracking(): Promise<boolean> {
    try {
      // Check if task is already running
      const isTaskDefined = TaskManager.isTaskDefined(LOCATION_TASK_NAME);
      if (!isTaskDefined) {
        console.error('Background task not defined');
        return false;
      }

      // Check if already tracking
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (hasStarted) {
        console.log('Background tracking already active');
        return true;
      }

      // Start background location tracking
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 10, // Update every 10 meters
        timeInterval: 5000, // Update every 5 seconds minimum
        foregroundService: {
          notificationTitle: 'BusNotify - Trip Active',
          notificationBody: 'Tracking your location for students',
          notificationColor: '#2563eb',
        },
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
      });

      console.log('✅ Background location tracking started');
      return true;
    } catch (error) {
      console.error('Failed to start background tracking:', error);
      return false;
    }
  }

  async stopBackgroundTracking(): Promise<void> {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.log('✅ Background location tracking stopped');
      }
    } catch (error) {
      console.error('Failed to stop background tracking:', error);
    }
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      return location;
    } catch (error) {
      console.error('Failed to get current location:', error);
      return null;
    }
  }

  async isBackgroundTrackingActive(): Promise<boolean> {
    try {
      return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    } catch (error) {
      return false;
    }
  }
}

export const locationService = new LocationService();
