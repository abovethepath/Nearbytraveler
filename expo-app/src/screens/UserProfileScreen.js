import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';
import UserAvatar from '../components/UserAvatar';

export default function UserProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProfile(); }, [userId]);
  const loadProfile = async () => {
    try { setProfile(await api.getUserProfile(userId)); } catch (e) { console.log('Failed:', e); }
    finally { setLoading(false); }
  };
  const handleConnect = async () => {
    try { await api.sendConnection(userId); Alert.alert('Request Sent', 'Connection request sent!'); } catch (e) { Alert.alert('Error', 'Could not send request.'); }
  };
  const handleMessage = () => { navigation.navigate('Chat', { userId: profile.id, userName: profile.fullName || profile.username }); };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.centered}><ActivityIndicator size={36} color="#F97316" /></View></SafeAreaView>;
  if (!profile) return <SafeAreaView style={styles.container}><TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backText}>Back</Text></TouchableOpacity><View style={styles.centered}><Text>User not found</Text></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backText}>Back</Text></TouchableOpacity>
        <View style={styles.profileHeader}>
          <UserAvatar user={profile} size={100} navigation={navigation} style={styles.profileImage} />
          <Text style={styles.displayName}>{profile.fullName || profile.username}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
          {profile.city && <Text style={styles.location}>&#x1F4CD; {profile.city}</Text>}
          <View style={styles.tagRow}>
            <View style={styles.typeTag}><Text style={styles.typeTagText}>{profile.userType === 'traveler' ? 'Traveler' : 'Local'}</Text></View>
            {profile.availableToMeet && <View style={[styles.typeTag, styles.availableTag]}><Text style={styles.typeTagText}>Available</Text></View>}
          </View>
        </View>
        {currentUser?.id !== profile.id && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.connectButton} onPress={handleConnect}><Text style={styles.connectButtonText}>Connect</Text></TouchableOpacity>
            <TouchableOpacity style={styles.messageButton} onPress={handleMessage}><Text style={styles.messageButtonText}>Message</Text></TouchableOpacity>
          </View>
        )}
        {profile.bio ? <View style={styles.section}><Text style={styles.sectionTitle}>About</Text><Text style={styles.bioText}>{profile.bio}</Text></View> : null}
        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.section}><Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.tagsRow}>{(Array.isArray(profile.interests) ? profile.interests : []).map((interest, i) => <View key={i} style={styles.interestTag}><Text style={styles.interestText}>{interest}</Text></View>)}</View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backButton: { paddingHorizontal: 20, paddingVertical: 12 },
  backText: { color: '#F97316', fontSize: 16, fontWeight: '600' },
  profileHeader: { alignItems: 'center', paddingBottom: 20 },
  profileImage: { marginBottom: 14 },
  displayName: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 2 },
  username: { fontSize: 15, color: '#9CA3AF', marginBottom: 8 },
  location: { fontSize: 15, color: '#6B7280' },
  tagRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  typeTag: { backgroundColor: '#EFF6FF', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
  availableTag: { backgroundColor: '#F0FDF4' },
  typeTagText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  connectButton: { flex: 1, backgroundColor: '#F97316', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  connectButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  messageButton: { flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  messageButtonText: { color: '#374151', fontSize: 16, fontWeight: '700' },
  section: { paddingHorizontal: 20, paddingVertical: 18, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  bioText: { fontSize: 15, color: '#4B5563', lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestTag: { backgroundColor: '#FFF7ED', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16 },
  interestText: { fontSize: 13, color: '#F97316', fontWeight: '600' },
});
