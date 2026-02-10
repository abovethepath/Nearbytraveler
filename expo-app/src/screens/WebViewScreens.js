import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';

export function EditProfileScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backText}>Back</Text></TouchableOpacity>
      <WebView source={{ uri: 'https://nearbytraveler.org/profile/edit' }} style={styles.webview} />
    </SafeAreaView>
  );
}

export function ConnectionsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backText}>Back</Text></TouchableOpacity>
      <WebView source={{ uri: 'https://nearbytraveler.org/connections' }} style={styles.webview} />
    </SafeAreaView>
  );
}

export function SettingsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backText}>Back</Text></TouchableOpacity>
      <WebView source={{ uri: 'https://nearbytraveler.org/settings' }} style={styles.webview} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  backButton: { paddingHorizontal: 20, paddingVertical: 12 },
  backText: { color: '#F97316', fontSize: 16, fontWeight: '600' },
  webview: { flex: 1 },
});
