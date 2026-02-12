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
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';

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

      await fetchNearbyUsers(user?.city || 'Los Angeles');
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Could not get your location');
      setLoading(false);
    }
  };

  const fetchNearbyUsers = async (city) => {
    try {
      const data = await api.getUsersByLocation(city, 'all');

      // Demo coords (replace later with real lat/lng from DB)
      const usersWithCoords = (data || []).map((u) => ({
        ...u,
        latitude: 34.0522 + (Math.random() - 0.5) * 0.1,
        longitude: -118.2437 + (Math.random() - 0.5) * 0.1,
      }));

      setUsers(usersWithCoords);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (selectedUser) => {
    navigation.navigate('UserProfile', { userId: selectedUser.id });
  };

  const centerOnMyLocation = () => {
    if (!location) return;

    setRegion({
      ...location,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={styles.loadingText}>Finding nearby travelers...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {users.map((u) => (
          <Marker
            key={u.id}
            coordinate={{ latitude: u.latitude, longitude: u.longitude }}
            title={u.fullName || u.username}
            description={u.city}
            onPress={() => handleMarkerPress(u)}
            pinColor={u.userType === 'traveler' ? '#F97316' : '#10B981'}
          />
        ))}
      </MapView>

      <TouchableOpacity style={styles.locationButton} onPress={centerOnMyLocation}>
        <Text style={styles.locationIcon}>📍</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#fff',
    fontSize: 16,
  },
  locationButton: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    backgroundColor: '#111827',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  locationIcon: {
    fontSize: 22,
    color: '#fff',
  },
});
