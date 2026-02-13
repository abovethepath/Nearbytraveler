import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import { WebView } from 'react-native-webview';

const EXTERNAL_HOSTNAMES = ['lu.ma', 'www.lu.ma', 'partiful.com', 'www.partiful.com', 'eventbrite.com', 'www.eventbrite.com', 'wa.me', 'twitter.com', 'x.com', 'facebook.com', 'www.facebook.com', 'instagram.com', 'www.instagram.com'];

function isExternalUrl(url) {
  try {
    const parsed = new URL(url);
    return EXTERNAL_HOSTNAMES.some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host));
  } catch {
    return false;
  }
}

function NTWebView({ uri }) {
  return (
    <WebView
      source={{ uri }}
      style={styles.webview}
      onShouldStartLoadWithRequest={(request) => {
        if (isExternalUrl(request.url)) {
          Linking.openURL(request.url).catch(() => {});
          return false;
        }
        return true;
      }}
    />
  );
}

export function EditProfileScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backText}>Back</Text></TouchableOpacity>
      <NTWebView uri="https://nearbytraveler.org/profile/edit" />
    </SafeAreaView>
  );
}

export function ConnectionsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backText}>Back</Text></TouchableOpacity>
      <NTWebView uri="https://nearbytraveler.org/connections" />
    </SafeAreaView>
  );
}

export function SettingsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backText}>Back</Text></TouchableOpacity>
      <NTWebView uri="https://nearbytraveler.org/settings" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  backButton: { paddingHorizontal: 20, paddingVertical: 12 },
  backText: { color: '#F97316', fontSize: 16, fontWeight: '600' },
  webview: { flex: 1 },
});
