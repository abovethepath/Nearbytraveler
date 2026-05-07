// AvailableNowScreen — native screen for the "who's free right now" feed.
//
// Reached via a header button on DiscoverScreen (root-level Stack.Screen, not a
// tab). Shows a MapView with markers for each available user in the current
// city, a list view below, and a self-toggle button to mark yourself available.
//
// react-native-maps note (mirrors the pattern in MapScreen.js):
//   We require() the module at runtime and gracefully fall back to a list-only
//   view if the native module isn't present (e.g. running in Expo Go). EAS
//   builds for TestFlight / App Store include the native module, so MapView
//   renders normally there.
//
// Privacy note:
//   /api/available-now does NOT return precise lat/lng for users (deliberate).
//   We jitter coordinates around the active city center so the map shows
//   approximate "in this city" presence without leaking real GPS positions.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';
import UserAvatar from '../components/UserAvatar';

// ─────────────────────────────────────────────────────────────────────────────
// Conditional map import (Expo Go has no native MapView module)
// ─────────────────────────────────────────────────────────────────────────────
let MapView = null;
let Marker = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const Maps = require('react-native-maps');
  MapView = Maps.default || Maps.MapView || null;
  Marker = Maps.Marker || null;
} catch (e) {
  // Expo Go or environment without the native module — MapView stays null and
  // we render the list-only fallback.
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_REGION = {
  latitude: 34.0522,   // Los Angeles fallback (matches launch market)
  longitude: -118.2437,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

function pickActiveCity(user) {
  if (user?.isCurrentlyTraveling) {
    return (
      user?.destinationCity ||
      (user?.travelDestination && String(user.travelDestination).split(',')[0]?.trim()) ||
      user?.hometownCity ||
      'Los Angeles'
    );
  }
  return user?.hometownCity || user?.city || 'Los Angeles';
}

function timeLeft(expiresAt) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m left`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h left`;
}

// Deterministic jitter so the same userId always lands at the same point.
function jitterFromId(id, base, range) {
  const n = Number(id) || 0;
  // simple LCG-ish hash to a [-1, 1] range
  const x = ((Math.sin(n * 9301 + 49297) + 1) / 2) * 2 - 1;
  return base + x * range;
}

// ─────────────────────────────────────────────────────────────────────────────
// List item card
// ─────────────────────────────────────────────────────────────────────────────

const AvailableUserCard = ({ entry, onPress, navigation }) => {
  const u = entry?.user || {};
  const left = timeLeft(entry?.expiresAt);
  return (
    <TouchableOpacity style={styles.userCard} onPress={() => onPress(u)} activeOpacity={0.7}>
      <View style={styles.avatarWrapper}>
        <UserAvatar user={u} size={56} navigation={navigation} style={styles.avatar} />
        <View style={styles.availableDot} />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {u.firstName || u.fullName || u.username || 'Someone'}
        </Text>
        {u.hometownCity || u.city ? (
          <Text style={styles.userCity} numberOfLines={1}>
            {'\u{1F4CD} '}{u.hometownCity || u.city}
          </Text>
        ) : null}
        <View style={styles.tagRow}>
          <View style={styles.availableTag}>
            <Text style={styles.availableTagText}>Available now</Text>
          </View>
          {left ? <Text style={styles.timeLeftText}>{left}</Text> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function AvailableNowScreen({ navigation }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [myStatus, setMyStatus] = useState({ isAvailable: false });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState(null);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [locationGranted, setLocationGranted] = useState(false);
  const refreshTimer = useRef(null);

  const activeCity = pickActiveCity(user);

  // Request location permission once. We don't gate the screen on it — the API
  // returns users by city — but having user location lets us center the map on
  // them rather than on the city's hardcoded center.
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationGranted(false);
          return;
        }
        setLocationGranted(true);
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setRegion({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: 0.12,
          longitudeDelta: 0.12,
        });
      } catch (e) {
        // Non-fatal — just stay with the default region.
        setLocationGranted(false);
      }
    })();
  }, []);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [list, status] = await Promise.all([
        api.getAvailableNowList(activeCity),
        api.getMyAvailableNowStatus(),
      ]);
      const filtered = (Array.isArray(list) ? list : []).filter(
        (e) => e && e.isAvailable && e.user && e.user.id !== user?.id,
      );
      setEntries(filtered);
      setMyStatus(status || { isAvailable: false });
    } catch (e) {
      setError(e?.message || 'Could not load. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCity, user?.id]);

  useEffect(() => {
    fetchAll();
    // Web refetches every 20s; mirror that here.
    refreshTimer.current = setInterval(fetchAll, 20000);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [fetchAll]);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const handleToggleAvailable = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      if (myStatus?.isAvailable) {
        await api.clearAvailableNow();
      } else {
        await api.setAvailableNow({ city: activeCity });
      }
      await fetchAll();
    } catch (e) {
      Alert.alert('Could not update', e?.message || 'Try again in a moment.');
    } finally {
      setToggling(false);
    }
  };

  // Tap a user (pin or list item) → native UserProfile at root level.
  const handleUserPress = (u) => {
    if (!u?.id) return;
    navigation.getParent()?.navigate('UserProfile', { userId: u.id });
    // navigation here is the root stack; UserProfile is a sibling, so direct
    // navigate works too. getParent fallback handles future restructures.
  };

  // Build map markers — jitter coordinates around the region center per user id
  // (stable per user, doesn't reveal precise GPS).
  const markers = entries.map((e) => ({
    id: e.user.id,
    user: e.user,
    latitude: jitterFromId(e.user.id, region.latitude, 0.04),
    longitude: jitterFromId(e.user.id + 7, region.longitude, 0.04),
  }));

  const headerBar = (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>{'‹ Back'}</Text>
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Available Now</Text>
        <Text style={styles.headerSubtitle}>{activeCity}</Text>
      </View>
      <View style={{ width: 60 }} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {headerBar}
        <View style={styles.centered}>
          <ActivityIndicator size={36} color="#F97316" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {headerBar}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
      >
        {/* Map view (or fallback) */}
        <View style={styles.mapContainer}>
          {MapView && Marker ? (
            <MapView
              style={styles.map}
              region={region}
              showsUserLocation={locationGranted}
              showsMyLocationButton={false}
              loadingEnabled
            >
              {markers.map((m) => (
                <Marker
                  key={m.id}
                  coordinate={{ latitude: m.latitude, longitude: m.longitude }}
                  title={m.user.firstName || m.user.username || 'Someone'}
                  description="Available now"
                  pinColor="#F97316"
                  onCalloutPress={() => handleUserPress(m.user)}
                />
              ))}
            </MapView>
          ) : (
            <View style={[styles.map, styles.mapFallback]}>
              <Text style={styles.mapFallbackEmoji}>{'\u{1F5FA}\u{FE0F}'}</Text>
              <Text style={styles.mapFallbackTitle}>Map view (TestFlight + App Store only)</Text>
              <Text style={styles.mapFallbackSubtitle}>
                Native maps are unavailable in Expo Go. The list below works the same.
              </Text>
            </View>
          )}
        </View>

        {/* Self-toggle button */}
        <TouchableOpacity
          style={[
            styles.toggleButton,
            myStatus?.isAvailable ? styles.toggleButtonActive : null,
            toggling ? styles.toggleButtonDisabled : null,
          ]}
          onPress={handleToggleAvailable}
          disabled={toggling}
          activeOpacity={0.85}
        >
          {toggling ? (
            <ActivityIndicator color={myStatus?.isAvailable ? '#FFFFFF' : '#F97316'} />
          ) : (
            <Text style={[styles.toggleButtonText, myStatus?.isAvailable ? styles.toggleButtonTextActive : null]}>
              {myStatus?.isAvailable ? 'Stop being available' : `⚡ I'm available now`}
            </Text>
          )}
        </TouchableOpacity>

        {/* Section heading */}
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderTitle}>
            {entries.length === 0
              ? 'No one available right now'
              : `${entries.length} ${entries.length === 1 ? 'person' : 'people'} available`}
          </Text>
        </View>

        {/* List of available users */}
        {error && entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.errorIcon}>{'\u{26A0}\u{FE0F}'}</Text>
            <Text style={styles.errorTitle}>Couldn't load</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{'\u{1F634}'}</Text>
            <Text style={styles.emptyTitle}>It's quiet right now</Text>
            <Text style={styles.emptySubtitle}>
              Tap the button above to be the first one available in {activeCity}.
            </Text>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item, i) => String(item?.user?.id || i)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <AvailableUserCard entry={item} onPress={handleUserPress} navigation={navigation} />
            )}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: { width: 60 },
  backText: { color: '#F97316', fontSize: 16, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  scrollContent: { paddingBottom: 32 },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Map
  mapContainer: { backgroundColor: '#FFFFFF', marginBottom: 12 },
  map: { width: '100%', height: 260 },
  mapFallback: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  mapFallbackEmoji: { fontSize: 36, marginBottom: 8 },
  mapFallbackTitle: { fontSize: 15, fontWeight: '700', color: '#374151', textAlign: 'center', marginBottom: 4 },
  mapFallbackSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center' },

  // Toggle button
  toggleButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  toggleButtonDisabled: { opacity: 0.7 },
  toggleButtonText: { fontSize: 16, fontWeight: '700', color: '#F97316' },
  toggleButtonTextActive: { color: '#FFFFFF' },

  // List
  listHeader: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  listHeaderTitle: { fontSize: 14, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.04 },

  userCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarWrapper: { position: 'relative', marginRight: 14 },
  avatar: {},
  availableDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: { flex: 1, justifyContent: 'center' },
  userName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  userCity: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  availableTag: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  availableTagText: { fontSize: 11, fontWeight: '600', color: '#92400E' },
  timeLeftText: { fontSize: 11, color: '#9CA3AF' },

  // Empty / error state
  emptyState: { alignItems: 'center', paddingTop: 24, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },

  errorIcon: { fontSize: 36, marginBottom: 12 },
  errorTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 4 },
  errorSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#F97316', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
