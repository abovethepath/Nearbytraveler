import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';

export default function EventDetailScreen({ route, navigation }) {
  const { eventId, event } = route.params;
  const { user } = useAuth();
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  if (!event) return <SafeAreaView style={styles.container}><Text>Event not found</Text></SafeAreaView>;

  const handleJoin = async () => {
    setJoining(true);
    try { await api.joinEvent(event.id); setJoined(true); Alert.alert('You are in!', 'You have joined this event.'); }
    catch (e) { Alert.alert('Error', 'Could not join event.'); }
    finally { setJoining(false); }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backText}>Back</Text></TouchableOpacity>
        {event.imageUrl ? <Image source={{ uri: event.imageUrl }} style={styles.heroImage} /> : <View style={[styles.heroImage, styles.heroPlaceholder]}><Text style={styles.heroEmoji}>&#x1F389;</Text></View>}
        <View style={styles.content}>
          {event.category && <View style={styles.categoryBadge}><Text style={styles.categoryText}>{event.category}</Text></View>}
          <Text style={styles.title}>{event.title}</Text>
          <View style={styles.infoRow}><Text style={styles.infoIcon}>&#x1F4C5;</Text><Text style={styles.infoText}>{formatDate(event.date)}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoIcon}>&#x1F4CD;</Text><Text style={styles.infoText}>{event.venueName || event.location || event.city || 'TBD'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoIcon}>&#x1F465;</Text><Text style={styles.infoText}>{event.participantCount || 0} people going</Text></View>
          {event.description ? <View style={styles.descriptionSection}><Text style={styles.sectionTitle}>About</Text><Text style={styles.description}>{event.description}</Text></View> : null}
        </View>
      </ScrollView>
      <View style={styles.bottomBar}>
        <View style={styles.priceSection}><Text style={styles.priceLabel}>Price</Text><Text style={styles.priceValue}>{event.price && event.price !== 'free' && event.price !== '0' ? '$' + event.price : 'Free'}</Text></View>
        <TouchableOpacity style={[styles.joinButton, joined && styles.joinedButton]} onPress={handleJoin} disabled={joining || joined}>
          {joining ? <ActivityIndicator color="#fff" /> : <Text style={styles.joinButtonText}>{joined ? 'Joined' : 'Join Event'}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  backButton: { paddingHorizontal: 20, paddingVertical: 12 },
  backText: { color: '#F97316', fontSize: 16, fontWeight: '600' },
  heroImage: { width: '100%', height: 220 },
  heroPlaceholder: { backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' },
  heroEmoji: { fontSize: 64 },
  content: { padding: 20 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#FFF7ED', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, marginBottom: 12 },
  categoryText: { fontSize: 13, color: '#F97316', fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 16, lineHeight: 30 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoIcon: { fontSize: 18, marginRight: 10, width: 24 },
  infoText: { fontSize: 15, color: '#4B5563', flex: 1 },
  descriptionSection: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 10 },
  description: { fontSize: 15, color: '#4B5563', lineHeight: 24 },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#FFFFFF' },
  priceSection: {},
  priceLabel: { fontSize: 12, color: '#9CA3AF' },
  priceValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  joinButton: { backgroundColor: '#F97316', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  joinedButton: { backgroundColor: '#059669' },
  joinButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
