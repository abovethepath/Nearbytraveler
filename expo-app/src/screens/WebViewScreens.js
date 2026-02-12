import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import api from '../services/api';

const BASE_URL = 'https://nearbytraveler.org';

/** Build WebView source with session cookie so the site sees the user as logged in (hybrid native + WebView). */
function webViewSource(path) {
  const uri = `${BASE_URL}${path}`;
  const cookie = api.getSessionCookie();
  if (cookie) {
    return { uri, headers: { Cookie: cookie } };
  }
  return { uri };
}

export function EditProfileScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backText}>Back</Text></TouchableOpacity>
      <WebView source={webViewSource('/profile/edit')} style={styles.webview} sharedCookiesEnabled />
    </SafeAreaView>
  );
}

export function ConnectionsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backText}>Back</Text></TouchableOpacity>
      <WebView source={webViewSource('/connections')} style={styles.webview} sharedCookiesEnabled />
    </SafeAreaView>
  );
}

export function SettingsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backText}>Back</Text></TouchableOpacity>
      <WebView source={webViewSource('/settings')} style={styles.webview} sharedCookiesEnabled />
    </SafeAreaView>
  );
}

/**
 * Generic WebView screen for hybrid app: pass path (e.g. path: '/discover' or path: '/cities/Paris').
 * Use in navigator: <Stack.Screen name="WebView" component={GenericWebViewScreen} />
 * Navigate with: navigation.navigate('WebView', { path: '/discover', title: 'Discover' })
 */
export function GenericWebViewScreen({ navigation, route }) {
  let path = route.params?.path || '/';
  if (!path.startsWith('/')) path = '/' + path;
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      <WebView source={webViewSource(path)} style={styles.webview} sharedCookiesEnabled />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  backButton: { paddingHorizontal: 20, paddingVertical: 12 },
  backText: { color: '#F97316', fontSize: 16, fontWeight: '600' },
  webview: { flex: 1 },
});
