import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl, ActivityIndicator, SafeAreaView } from 'react-native';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((d - now) / (1000 * 60 * 60 * 24));
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (diffDays === 0) return 'Today at ' + timeStr;
  if (diffDays === 1) return 'Tomorrow at ' + timeStr;
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'long' }) + ' at ' + timeStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const EventCard = ({ event, onPress }) => (
  <TouchableOpacity style={styles.eventCard} onPress={() => onPress(event)} activeOpacity={0.7}>
    {event.imageUrl ? <Image source={{ uri: event.imageUrl }} style={styles.eventImage} /> : <View style={[styles.eventImage, styles.eventImagePlaceholder]}><Text style={styles.eventImageEmoji}>&#x1F389;</Text></View>}
    <View style={styles.eventContent}>
      <View style={styles.eventMeta}>
        <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
        {event.category && <View style={styles.categoryBadge}><Text style={styles.categoryText}>{event.category}</Text></View>}
      </View>
      <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
      <Text style={styles.eventLocation} numberOfLines={1}>&#x1F4CD; {event.venueName || event.location || event.city || 'TBD'}</Text>
      {event.description ? <Text style={styles.eventDescription} numberOfLines={2}>{event.description}</Text> : null}
      <View style={styles.eventFooter}>
        <Text style={styles.attendees}>&#x1F465; {event.participantCount || 0} going</Text>
        <Text style={styles.price}>{event.price && event.price !== 'free' && event.price !== '0' ? '$' + event.price : 'Free'}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

export default function EventsScreen({ navigation }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const city = user?.city || 'Los Angeles';

  const fetchEvents = useCallback(async () => {
    try { const data = await api.getEvents(city); setEvents(Array.isArray(data) ? data : []); }
    catch (e) { console.log('Failed to fetch events:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [city]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  const onRefresh = () => { setRefreshing(true); fetchEvents(); };
  const handleEventPress = (event) => { navigation.navigate('EventDetail', { eventId: event.id, event }); };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>Events</Text><Text style={styles.headerSubtitle}>&#x1F4CD; {city}</Text></View>
      {loading ? <View style={styles.centered}><ActivityIndicator size={36} color="#F97316" /></View> : (
        <FlatList data={events} keyExtractor={(item) => String(item.id)} renderItem={({ item }) => <EventCard event={item} onPress={handleEventPress} />}
          contentContainerStyle={styles.listContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
          ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyIcon}>&#x1F4C5;</Text><Text style={styles.emptyTitle}>No upcoming events</Text><Text style={styles.emptySubtitle}>Check back later for events in {city}</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#111827' },
  headerSubtitle: { fontSize: 15, color: '#6B7280', marginTop: 2 },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  eventCard: { backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  eventImage: { width: '100%', height: 160 },
  eventImagePlaceholder: { backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' },
  eventImageEmoji: { fontSize: 48 },
  eventContent: { padding: 16 },
  eventMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  eventDate: { fontSize: 13, fontWeight: '600', color: '#F97316' },
  categoryBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  categoryText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  eventTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6, lineHeight: 24 },
  eventLocation: { fontSize: 14, color: '#6B7280', marginBottom: 6 },
  eventDescription: { fontSize: 14, color: '#9CA3AF', lineHeight: 20, marginBottom: 12 },
  eventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attendees: { fontSize: 13, color: '#6B7280' },
  price: { fontSize: 14, fontWeight: '700', color: '#059669' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF' },
});
