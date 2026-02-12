import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
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

      // Fetch nearby users
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
      // Add mock coordinates for demo (in real app, users would have lat/long in database)
      const usersWithCoords = (data || []).map((u, index) => ({
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
        showsUserLocation={true}
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
        <Text style={styles.locationIcon}>📍</