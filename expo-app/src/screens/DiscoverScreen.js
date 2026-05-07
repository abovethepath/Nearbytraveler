// Discover People — the Home tab. Replaces the WebView wrapper around /home.
// Renders two sections:
//   1. "New to Nearby Traveler" horizontal scroll (calls /api/users/recently-joined)
//   2. Main FlatList of users (calls /api/users)
// The server already sorts seeded users (aura=99) to the bottom and filters
// the recently-joined endpoint to seeded-only for social proof. The native
// screen just renders what the server returns, with light client-side filters
// (no businesses, no @nearbytravlr id=1, current user pinned first).
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';
import UserAvatar from '../components/UserAvatar';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getAge(user) {
  if (typeof user?.age === 'number' && user.age > 0) return user.age;
  if (!user?.dateOfBirth) return null;
  try {
    const ms = Date.now() - new Date(user.dateOfBirth).getTime();
    const years = Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000));
    return years > 0 && years < 120 ? years : null;
  } catch {
    return null;
  }
}

function getCity(user) {
  return user?.city || user?.hometownCity || '';
}

function getCountry(user) {
  return user?.country || user?.hometownCountry || '';
}

function getTravelDestination(user) {
  if (user?.userType === 'business') return null;
  if (user?.isCurrentlyTraveling) {
    return (
      user?.destinationCity ||
      (user?.travelDestination && String(user.travelDestination).split(',')[0]?.trim()) ||
      null
    );
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// "New to Nearby Traveler" horizontal scroll card
// ─────────────────────────────────────────────────────────────────────────────

const NewMemberCard = ({ user, onPress, navigation }) => {
  const city = getCity(user);
  return (
    <TouchableOpacity style={styles.newMemberCard} onPress={() => onPress(user)} activeOpacity={0.8}>
      <UserAvatar user={user} size={56} navigation={navigation} style={styles.newMemberAvatar} />
      <Text style={styles.newMemberName} numberOfLines={1}>
        {user?.firstName || user?.username || 'New'}
      </Text>
      {city ? (
        <Text style={styles.newMemberCity} numberOfLines={1}>{city}</Text>
      ) : null}
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main feed user card
// ─────────────────────────────────────────────────────────────────────────────

const UserCard = ({ user, isAvailable, onPress, navigation }) => {
  const age = getAge(user);
  const city = getCity(user);
  const country = getCountry(user);
  const dest = getTravelDestination(user);
  const isTraveler = user?.userType === 'traveler' || user?.isCurrentlyTraveling;
  const displayName = user?.firstName || user?.username || 'User';

  return (
    <TouchableOpacity style={styles.userCard} onPress={() => onPress(user)} activeOpacity={0.7}>
      <View style={styles.avatarWrapper}>
        <UserAvatar user={user} size={64} navigation={navigation} style={styles.avatar} />
        {isAvailable ? <View style={styles.availableDot} /> : null}
      </View>
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.userName} numberOfLines={1}>
            {displayName}
            {age ? <Text style={styles.userAge}>, {age}</Text> : null}
          </Text>
        </View>
        {city ? (
          <Text style={styles.userCity} numberOfLines={1}>
            {'\u{1F4CD} '}{city}{country ? `, ${country}` : ''}
          </Text>
        ) : null}
        {dest ? (
          <Text style={styles.travelDest} numberOfLines={1}>
            {'\u{2708}\u{FE0F} '}{dest}
          </Text>
        ) : null}
        <View style={styles.tagRow}>
          {isTraveler ? (
            <View style={[styles.tag, styles.travelerTag]}><Text style={styles.tagText}>Traveler</Text></View>
          ) : (
            <View style={[styles.tag, styles.localTag]}><Text style={styles.tagText}>Local</Text></View>
          )}
          {isAvailable ? (
            <View style={[styles.tag, styles.availableTag]}><Text style={styles.tagText}>Available Now</Text></View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function DiscoverScreen({ navigation }) {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [recentlyJoined, setRecentlyJoined] = useState([]);
  const [availableIds, setAvailableIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      // Fire all three in parallel — keeps the screen snappy on cold load.
      const [users, joined, availIds] = await Promise.all([
        api.getDiscoverPeople(),
        api.getRecentlyJoined(10),
        api.getAvailableNowIds(),
      ]);
      setAllUsers(Array.isArray(users) ? users : []);
      setRecentlyJoined(Array.isArray(joined) ? joined : []);
      setAvailableIds(new Set((Array.isArray(availIds) ? availIds : []).map(Number)));
    } catch (e) {
      setError(e?.message || 'Could not load. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  // Cross-tab navigation to native UserProfile (root-level screen).
  const rootNav = navigation.getParent?.()?.getParent?.() ?? navigation;
  const handleUserPress = (u) => {
    if (!u?.id) return;
    rootNav.navigate('UserProfile', { userId: u.id });
  };
  const handleOpenAvailableNow = () => {
    rootNav.navigate('AvailableNow');
  };

  // Filter: drop businesses, drop @nearbytravlr (id=1), pin current user first.
  // Server already sorted seeded users (aura=99) to the bottom, so we trust order.
  const orderedUsers = React.useMemo(() => {
    const meId = Number(user?.id) || -1;
    const filtered = allUsers.filter((u) => {
      if (!u || u.userType === 'business') return false;
      if (u.id === 1 || u.username === 'nearbytravlr') return false;
      return true;
    });
    const me = filtered.find((u) => Number(u.id) === meId);
    const others = filtered.filter((u) => Number(u.id) !== meId);
    return me ? [me, ...others] : others;
  }, [allUsers, user?.id]);

  const renderHeader = () => {
    if (recentlyJoined.length === 0) return null;
    return (
      <View style={styles.newMembersSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{'\u{1F44B} '}New to Nearby Traveler</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.newMembersScroll}
        >
          {recentlyJoined.map((u) => (
            <NewMemberCard key={u.id} user={u} onPress={handleUserPress} navigation={navigation} />
          ))}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size={36} color="#F97316" />
        </View>
      </SafeAreaView>
    );
  }

  if (error && orderedUsers.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>{'\u{26A0}\u{FE0F}'}</Text>
          <Text style={styles.errorTitle}>Couldn't load</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); fetchAll(); }}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Discover</Text>
            <Text style={styles.headerSubtitle}>People nearby and around the world</Text>
          </View>
          <TouchableOpacity
            style={styles.availableNowButton}
            onPress={handleOpenAvailableNow}
            activeOpacity={0.85}
          >
            <Text style={styles.availableNowButtonText}>{'⚡ Available now'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={orderedUsers}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            isAvailable={availableIds.has(Number(item.id))}
            onPress={handleUserPress}
            navigation={navigation}
          />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{'\u{1F30D}'}</Text>
            <Text style={styles.emptyTitle}>No one here yet</Text>
            <Text style={styles.emptySubtitle}>Pull to refresh, or check back soon.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  availableNowButton: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  availableNowButtonText: { fontSize: 12, fontWeight: '700', color: '#92400E' },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  errorIcon: { fontSize: 36, marginBottom: 12 },
  errorTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 4 },
  errorSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  retryButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  listContent: { paddingBottom: 20 },

  // New members horizontal scroll
  newMembersSection: { backgroundColor: '#FFFFFF', paddingTop: 14, paddingBottom: 14, marginBottom: 8 },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  newMembersScroll: { paddingHorizontal: 16, gap: 12 },
  newMemberCard: {
    width: 88,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  newMemberAvatar: { marginBottom: 8 },
  newMemberName: { fontSize: 13, fontWeight: '600', color: '#111827', textAlign: 'center' },
  newMemberCity: { fontSize: 11, color: '#9CA3AF', marginTop: 2, textAlign: 'center' },

  // Main feed user card
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  userName: { fontSize: 17, fontWeight: '700', color: '#111827' },
  userAge: { fontSize: 17, fontWeight: '500', color: '#6B7280' },
  userCity: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  travelDest: { fontSize: 13, color: '#F97316', marginTop: 2, fontWeight: '600' },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  travelerTag: { backgroundColor: '#EFF6FF' },
  localTag: { backgroundColor: '#F0FDF4' },
  availableTag: { backgroundColor: '#FEF3C7' },
  tagText: { fontSize: 11, fontWeight: '600', color: '#374151' },

  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
});
