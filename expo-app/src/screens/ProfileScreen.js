import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, Alert } from 'react-native';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    if (user?.id) { api.getConnections(user.id).then(data => setConnections(Array.isArray(data) ? data : [])).catch(() => {}); }
  }, [user?.id]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <Image source={user.profileImage ? { uri: user.profileImage } : require('../../assets/icon.png')} style={styles.profileImage} />
          <Text style={styles.displayName}>{user.fullName || user.username}</Text>
          {user.fullName && <Text style={styles.username}>@{user.username}</Text>}
          {user.city && <Text style={styles.location}>&#x1F4CD; {user.city}</Text>}
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}><Text style={styles.statNumber}>{connections.length}</Text><Text style={styles.statLabel}>Connections</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><Text style={styles.statNumber}>{user.aura || 0}</Text><Text style={styles.statLabel}>Aura Points</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><Text style={styles.statNumber}>{user.userType === 'traveler' ? 'Traveler' : 'Local'}</Text><Text style={styles.statLabel}>Type</Text></View>
        </View>
        {user.bio ? <View style={styles.section}><Text style={styles.sectionTitle}>About</Text><Text style={styles.bioText}>{user.bio}</Text></View> : null}
        {user.interests && user.interests.length > 0 && (
          <View style={styles.section}><Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.tagsRow}>{(Array.isArray(user.interests) ? user.interests : []).map((interest, i) => <View key={i} style={styles.interestTag}><Text style={styles.interestText}>{interest}</Text></View>)}</View>
          </View>
        )}
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditProfile')}><Text style={styles.menuIcon}>&#x270F;&#xFE0F;</Text><Text style={styles.menuText}>Edit Profile</Text><Text style={styles.menuArrow}>></Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Connections')}><Text style={styles.menuIcon}>&#x1F465;</Text><Text style={styles.menuText}>My Connections</Text><Text style={styles.menuArrow}>></Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}><Text style={styles.menuIcon}>&#x2699;&#xFE0F;</Text><Text style={styles.menuText}>Settings</Text><Text style={styles.menuArrow}>></Text></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}><Text style={styles.logoutText}>Sign Out</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { paddingBottom: 40 },
  profileHeader: { alignItems: 'center', paddingTop: 24, paddingBottom: 20, backgroundColor: '#FFFFFF' },
  profileImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F3F4F6', marginBottom: 14 },
  displayName: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 2 },
  username: { fontSize: 15, color: '#9CA3AF', marginBottom: 6 },
  location: { fontSize: 15, color: '#6B7280', marginTop: 4 },
  statsRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingVertical: 18, marginTop: 1, justifyContent: 'center', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  statDivider: { width: 1, height: 30, backgroundColor: '#F3F4F6' },
  section: { backgroundColor: '#FFFFFF', marginTop: 12, paddingHorizontal: 20, paddingVertical: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  bioText: { fontSize: 15, color: '#4B5563', lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestTag: { backgroundColor: '#FFF7ED', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16 },
  interestText: { fontSize: 13, color: '#F97316', fontWeight: '600' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  menuIcon: { fontSize: 20, marginRight: 14, width: 28 },
  menuText: { flex: 1, fontSize: 16, color: '#374151', fontWeight: '500' },
  menuArrow: { fontSize: 22, color: '#D1D5DB' },
  logoutButton: { marginHorizontal: 20, marginTop: 24, paddingVertical: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#FCA5A5', alignItems: 'center' },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#DC2626' },
});
