import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';

// NOTE:
// MapView (react-native-maps) is intentionally NOT imported here so Expo Go can run.
// Expo Go does not include the native RNMapsAirModule.
// When you switch back to a Development Build, you can re-enable maps.

export default function MapScreen({ navigation }) {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState({
    latitude: 34.0522,
    longitude: -118.2437,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  useEffect(() => {
    requestLocationPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'We need location access to show nearby travelers on the map.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setLocation(userLocation);
      setRegion({
        ...userLocation,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });

      // Fetch nearby users (still useful for future maps + testing API)
      await fetchNearbyUsers(user?.city || 'Los Angeles');
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Could not get your location');
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyUsers = async (city) => {
    try {
      const data = await api.getUsersByLocation(city, 'all');
      // Mock coordinates for demo (in real app, users would have lat/long)
      const usersWithCoords = (data || []).map((u) => ({
        ...u,
        latitude: 34.0522 + (Math.random() - 0.5) * 0.1,
        longitude: -118.2437 + (Math.random() - 0.5) * 0.1,
      }));
      setUsers(usersWithCoords);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleMarkerPress = (selectedUser) => {
    // kept for when maps are re-enabled
    navigation.navigate('UserProfile', { userId: selectedUser.id });
  };

  const centerOnMyLocation = async () => {
    if (location) {
      setRegion({
        ...location,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={styles.loadingText}>Preparing map…</Text>
      </View>
    );
  }

  // Expo Go safe fallback UI (no react-native-maps)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}>
        <Text style={styles.title}>Map is disabled in Expo Go</Text>
        <Text style={styles.subtitle}>
          This screen uses native maps (react-native-maps), which Expo Go doesn’t include.
          We’ll re-enable it when using a Development Build.
        </Text>

        <TouchableOpacity style={styles.locationButton} onPress={centerOnMyLocation}>
          <Text style={styles.locationIcon}>📍</Text>
        </TouchableOpacity>

        {location ? (
          <Text style={styles.coords}>
            Your location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </Text>
        ) : (
          <Text style={styles.coords}>Getting your location…</Text>
        )}

        <Text style={styles.small}>
          Nearby users fetched (for testing API): {users?.length || 0}
        </Text>

        {/* Kept here as a reminder that the rest of the app can still be tested fast in Expo Go */}
        <Text style={styles.smallMuted}>
          Tip: Use Expo Go for login/matches/chat/events fast iteration. Switch to Dev Build only when testing maps/camera/push.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  loadingText: { marginTop: 12, fontSize: 16, opacity: 0.75, textAlign: 'center' },

  title: { fontSize: 20, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 14, opacity: 0.7, textAlign: 'center', marginBottom: 20 },

  locationButton: {
    backgroundColor: '#F97316',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  locationIcon: { fontSize: 18, color: '#FFFFFF' },

  coords: { marginTop: 16, fontSize: 12, opacity: 0.7, textAlign: 'center' },

  small: { marginTop: 10, fontSize: 12, opacity: 0.8, textAlign: 'center' },
  smallMuted: { marginTop: 8, fontSize: 12, opacity: 0.55, textAlign: 'center' },
});
