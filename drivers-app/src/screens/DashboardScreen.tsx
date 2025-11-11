import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import { locationService } from '../services/locationService';
import type { DriverInfo } from '../types/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
};

type DashboardScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [tripActive, setTripActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  useEffect(() => {
    loadDriverInfo();
    checkTripStatus();
  }, []);

  const loadDriverInfo = async () => {
    try {
      const driverInfoJson = await AsyncStorage.getItem('driverInfo');
      if (driverInfoJson) {
        const info = JSON.parse(driverInfoJson);
        setDriverInfo(info);
      }
    } catch (error) {
      console.error('Failed to load driver info:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkTripStatus = async () => {
    const isActive = await locationService.isBackgroundTrackingActive();
    setTripActive(isActive);
  };

  const requestPermissions = async () => {
    const granted = await locationService.requestPermissions();
    if (!granted) {
      Alert.alert(
        'Location Permission Required',
        'This app needs location access to track the bus. Please enable location permissions in Settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const updateCurrentLocation = async () => {
    const location = await locationService.getCurrentLocation();
    if (location) {
      const accuracy = location.coords.accuracy ?? 0;
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: accuracy,
      });
      setGpsAccuracy(accuracy);
    }
  };

  const handleStartTrip = async () => {
    if (!driverInfo) {
      Alert.alert('Error', 'Driver information not found');
      return;
    }

    // Request permissions first
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    setLoading(true);

    try {
      // Get current location
      await updateCurrentLocation();

      // Get auth token
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        navigation.replace('Login');
        return;
      }

      // Start trip on backend
      await apiService.startTrip(
        {
          bus_id: driverInfo.bus_id,
          route_id: driverInfo.route_id,
        },
        token
      );

      // Start background location tracking
      const started = await locationService.startBackgroundTracking();
      
      if (started) {
        setTripActive(true);
        Alert.alert(
          '✅ Trip Started',
          'Your location is now being tracked in real-time. Students can see your live location on the map.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to start background tracking');
      }
    } catch (error: any) {
      console.error('Start trip error:', error);
      Alert.alert('Error', error.message || 'Failed to start trip');
    } finally {
      setLoading(false);
    }
  };

  const handleEndTrip = async () => {
    Alert.alert(
      'End Trip',
      'Are you sure you want to end the trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Trip',
          style: 'destructive',
          onPress: async () => {
            if (!driverInfo) return;

            setLoading(true);

            try {
              // Stop background tracking
              await locationService.stopBackgroundTracking();

              // End trip on backend
              const token = await AsyncStorage.getItem('authToken');
              if (token) {
                await apiService.endTrip(driverInfo.bus_id, token);
              }

              setTripActive(false);
              Alert.alert('✅ Trip Ended', 'Location tracking stopped successfully');
            } catch (error: any) {
              console.error('End trip error:', error);
              Alert.alert('Error', error.message || 'Failed to end trip');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      tripActive
        ? 'You have an active trip. Please end the trip before logging out.'
        : 'Are you sure you want to logout?',
      tripActive
        ? [{ text: 'OK' }]
        : [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Logout',
              style: 'destructive',
              onPress: async () => {
                await AsyncStorage.removeItem('authToken');
                await AsyncStorage.removeItem('driverInfo');
                navigation.replace('Login');
              },
            },
          ]
    );
  };

  if (loading && !driverInfo) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Driver Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* GPS Accuracy Warning */}
      {gpsAccuracy !== null && gpsAccuracy > 100 && (
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Poor GPS Signal</Text>
            <Text style={styles.warningText}>
              Accuracy: {Math.round(gpsAccuracy)}m (should be &lt;20m)
            </Text>
            <Text style={styles.warningSubtext}>
              Go outside for better satellite signal
            </Text>
          </View>
        </View>
      )}

      {/* Bus Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bus Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Bus Number</Text>
          <Text style={styles.infoValue}>{driverInfo?.bus_id || 'Not Assigned'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Route</Text>
          <Text style={styles.infoValue}>{driverInfo?.route_id || 'Not Assigned'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Driver</Text>
          <Text style={styles.infoValue}>{driverInfo?.name || 'Unknown'}</Text>
        </View>
      </View>

      {/* GPS Status */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>GPS Status</Text>
        {currentLocation && (
          <View>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Latitude:</Text>
              <Text style={styles.locationValue}>
                {currentLocation.latitude.toFixed(6)}
              </Text>
            </View>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Longitude:</Text>
              <Text style={styles.locationValue}>
                {currentLocation.longitude.toFixed(6)}
              </Text>
            </View>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Accuracy:</Text>
              <Text
                style={[
                  styles.locationValue,
                  currentLocation.accuracy < 20
                    ? styles.accuracyGood
                    : currentLocation.accuracy < 100
                    ? styles.accuracyFair
                    : styles.accuracyPoor,
                ]}
              >
                {Math.round(currentLocation.accuracy)}m
                {currentLocation.accuracy < 20
                  ? ' ✓'
                  : currentLocation.accuracy < 100
                  ? ' ⚠'
                  : ' ✗'}
              </Text>
            </View>
          </View>
        )}
        {!currentLocation && (
          <Text style={styles.noLocation}>Start trip to get GPS location</Text>
        )}
      </View>

      {/* Trip Controls */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Trip Controls</Text>

        {!tripActive ? (
          <TouchableOpacity
            style={[styles.startButton, loading && styles.buttonDisabled]}
            onPress={handleStartTrip}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.startButtonIcon}>▶️</Text>
                <Text style={styles.startButtonText}>Start Trip</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View>
            <View style={styles.activeCard}>
              <Text style={styles.activeIcon}>📡</Text>
              <View style={styles.activeContent}>
                <Text style={styles.activeTitle}>Trip Active</Text>
                <Text style={styles.activeSubtext}>
                  Live GPS tracking (updates automatically)
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.endButton, loading && styles.buttonDisabled]}
              onPress={handleEndTrip}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.endButtonIcon}>⏹</Text>
                  <Text style={styles.endButtonText}>End Trip</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>📱 How it works</Text>
        <Text style={styles.instructionItem}>1. Enable location permissions</Text>
        <Text style={styles.instructionItem}>2. Click "Start Trip" to begin tracking</Text>
        <Text style={styles.instructionItem}>
          3. App tracks your location even when closed
        </Text>
        <Text style={styles.instructionItem}>4. Students see your live location on map</Text>
        <Text style={styles.instructionItem}>5. Click "End Trip" when done</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  warningCard: {
    margin: 16,
    marginBottom: 0,
    padding: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7f1d1d',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#991b1b',
    marginBottom: 4,
  },
  warningSubtext: {
    fontSize: 12,
    color: '#b91c1c',
  },
  card: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  locationLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  accuracyGood: {
    color: '#10b981',
  },
  accuracyFair: {
    color: '#f59e0b',
  },
  accuracyPoor: {
    color: '#ef4444',
  },
  noLocation: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  startButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  activeCard: {
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  activeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  activeContent: {
    flex: 1,
  },
  activeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 4,
  },
  activeSubtext: {
    fontSize: 12,
    color: '#047857',
  },
  endButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  endButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  instructionsCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 12,
  },
  instructionItem: {
    fontSize: 14,
    color: '#1e3a8a',
    marginBottom: 8,
  },
});
