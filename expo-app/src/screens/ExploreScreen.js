import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl, ActivityIndicator, SafeAreaView, TextInput } from 'react-native';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';

const UserCard = ({ user, onPress }) => (
  <TouchableOpacity style={styles.userCard} onPress={() => onPress(user)} activeOpacity={0.7}>
    <Image source={user.profileImage ? { uri: user.profileImage } : require('../../assets/icon.png')} style={styles.avatar} />
    <View style={styles.userInfo}>
      <Text style={styles.userName} numberOfLines={1}>{user.fullName || user.username}</Text>
      <Text style={styles.userCity} numberOfLines={1}>&#x1F4CD; {user.city || 'Unknown location'}</Text>
      {user.bio ? <Text style={styles.userBio} numberOfLines={2}>{user.bio}</Text> : null}
      <View style={styles.tagRow}>
        {user.userType === 'traveler' && <View style={[styles.tag, styles.travelerTag]}><Text style={styles.tagText}>Traveler</Text></View>}
        {user.userType === 'local' && <View style={[styles.tag, styles.localTag]}><Text style={styles.tagText}>Local</Text></View>}
        {user.availableToMeet && <View style={[styles.tag, styles.availableTag]}><Text style={styles.tagText}>Available</Text></View>}
      </View>
    </View>
  </TouchableOpacity>
);

export default function ExploreScreen({ navigation }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [city, setCity] = useState(user?.city || 'Los Angeles');
  const [filter, setFilter] = useState('all');

  const fetchUsers = useCallback(async () => {
    try {
      const data = await api.getUsersByLocation(city, filter);
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) { console.log('Failed to fetch users:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [city, filter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  const onRefresh = () => { setRefreshing(true); fetchUsers(); };
  const handleUserPress = (selectedUser) => { navigation.navigate('UserProfile', { userId: selectedUser.id }); };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>&#x1F50D;</Text>
          <TextInput style={styles.searchInput} placeholder="Search by city..." placeholderTextColor="#9CA3AF" value={city} onChangeText={setCity} onSubmitEditing={fetchUsers} returnKeyType="search" />
        </View>
      </View>
      <View style={styles.filterRow}>
        {[{ key: 'all', label: 'All' }, { key: 'traveler', label: 'Travelers' }, { key: 'local', label: 'Locals' }].map((f) => (
          <TouchableOpacity key={f.key} style={[styles.filterTab, filter === f.key && styles.filterTabActive]} onPress={() => setFilter(f.key)}>
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View> : (
        <FlatList data={users} keyExtractor={(item) => String(item.id)} renderItem={({ item }) => <UserCard user={item} onPress={handleUserPress} />}
          contentContainerStyle={styles.listContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
          ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyIcon}>&#x1F30E;</Text><Text style={styles.emptyTitle}>No travelers found</Text><Text style={styles.emptySubtitle}>Try searching a different city</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  searchSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#111827' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  filterTabActive: { backgroundColor: '#FFF7ED', borderColor: '#F97316' },
  filterText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  filterTextActive: { color: '#F97316', fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  userCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F3F4F6', marginRight: 14 },
  userInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 2 },
  userCity: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  userBio: { fontSize: 13, color: '#9CA3AF', lineHeight: 18, marginBottom: 8 },
  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  travelerTag: { backgroundColor: '#EFF6FF' },
  localTag: { backgroundColor: '#F0FDF4' },
  availableTag: { backgroundColor: '#FFF7ED' },
  tagText: { fontSize: 12, fontWeight: '500', color: '#374151' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF' },
});
