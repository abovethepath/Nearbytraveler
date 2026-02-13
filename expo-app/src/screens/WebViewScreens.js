import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  useWindowDimensions,
  useColorScheme,
  Linking,
  Platform,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

// Set to your local client URL (e.g. 'http://192.168.1.x:5000') to test client/ fixes in Expo without deploying.
const DEV_WEB_URL = null; // e.g. 'http://192.168.1.100:5000'
const BASE_URL = (typeof __DEV__ !== 'undefined' && __DEV__ && DEV_WEB_URL) ? DEV_WEB_URL.replace(/\/$/, '') : 'https://nearbytraveler.org';
const HOST = (BASE_URL || '').replace(/^https?:\/\//, '').split('/')[0] || 'nearbytraveler.org';
const HEADER_HEIGHT = 56;

const DARK = {
  bg: '#1c1c1e',
  bgSecondary: '#2c2c2e',
  border: '#38383a',
  text: '#ffffff',
  textMuted: '#8e8e93',
};

/** Append ?native=ios (or &native=ios if path has query) so the website hides its bottom navbar. */
function pathWithNativeIOS(path) {
  const hasQuery = path.indexOf('?') !== -1;
  return `${path}${hasQuery ? '&' : '?'}native=ios`;
}

/** Build WebView source with session cookie and ?native=ios so the site hides its bottom nav. */
function webViewSource(path) {
  const uri = `${BASE_URL}${pathWithNativeIOS(path)}`;
  const cookie = api.getSessionCookie();
  if (cookie) {
    return { uri, headers: { Cookie: cookie } };
  }
  return { uri };
}

/** Return true to load in WebView, false to block (and we open in browser). Links to nearbytraveler.org stay in-app; others open in Safari. */
function shouldLoadInWebView(requestUrl) {
  try {
    const url = (requestUrl || '').trim();
    if (!url || url === 'about:blank') return true;
    if (url.startsWith('http') && !url.includes(HOST)) {
      Linking.openURL(url);
      return false;
    }
    return true;
  } catch (e) {
    return true;
  }
}

/** Shared WebView with back button, loading, error, refresh, and external-link handling. Used by GenericWebViewScreen and fixed-path screens. */
function WebViewWithChrome({ path, navigation }) {
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const { height: windowHeight } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const webViewRef = useRef(null);
  const source = webViewSource(path);
  const webViewHeight = Math.max(400, windowHeight - HEADER_HEIGHT - (Platform.OS === 'ios' ? 44 : 24));

  // Android hardware back: only let GO_BACK run when we can go back, to avoid "GO_BACK was not handled"
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return undefined;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
          return true;
        }
        return true; // at root: consume event so no unhandled GO_BACK
      });
      return () => sub.remove();
    }, [navigation])
  );

  const onLoadStart = useCallback(() => { setLoading(true); setError(null); }, []);
  const onLoadEnd = useCallback(() => { setLoading(false); setRefreshing(false); }, []);
  const onError = useCallback((e) => {
    setLoading(false); setRefreshing(false);
    setError(e.nativeEvent?.description || 'Failed to load page');
  }, []);
  const onHttpError = useCallback((e) => { setError(e.nativeEvent?.statusCode ? `Error ${e.nativeEvent.statusCode}` : 'Request failed'); }, []);
  const onRetry = useCallback(() => { setError(null); setLoading(true); webViewRef.current?.reload(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); setError(null); webViewRef.current?.reload(); }, []);
  const onShouldStartLoadWithRequest = useCallback((req) => shouldLoadInWebView(req?.url), []);

  const containerStyle = dark ? [styles.container, { backgroundColor: DARK.bg }] : styles.container;
  const headerStyle = dark ? [styles.header, { backgroundColor: DARK.bg, borderBottomColor: DARK.border }] : styles.header;
  const loadingOverlayStyle = dark ? [styles.loadingOverlay, { backgroundColor: 'rgba(28,28,30,0.9)' }] : styles.loadingOverlay;
  const errorContainerStyle = dark ? [styles.errorContainer, { backgroundColor: DARK.bg }] : styles.errorContainer;
  const errorTextStyle = dark ? [styles.errorText, { color: DARK.textMuted }] : styles.errorText;
  const scrollViewStyle = dark ? [styles.scrollView, { backgroundColor: DARK.bg }] : styles.scrollView;
  const webviewStyle = dark ? [styles.webview, { height: webViewHeight, backgroundColor: DARK.bg }] : [styles.webview, { height: webViewHeight }];

  return (
    <SafeAreaView style={containerStyle}>
      {/* Native bar sits above the WebView; pull-to-refresh in the scroll area reloads the page. */}
      <View style={[headerStyle, { minHeight: HEADER_HEIGHT }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.backChevron}>&#x2039;</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
          accessibilityLabel="Reload page"
        >
          <Text style={styles.refreshText}>{refreshing ? '…' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>
      {error ? (
        <View style={errorContainerStyle}>
          <Text style={errorTextStyle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      ) : (
        <>
          {loading && <View style={loadingOverlayStyle} pointerEvents="none"><ActivityIndicator size="large" color="#F97316" /></View>}
          <ScrollView style={scrollViewStyle} contentContainerStyle={[styles.scrollContent, { minHeight: webViewHeight }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}>
            <WebView
              ref={webViewRef}
              source={source}
              style={webviewStyle}
              sharedCookiesEnabled
              onLoadStart={onLoadStart}
              onLoadEnd={onLoadEnd}
              onError={onError}
              onHttpError={onHttpError}
              onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
              setSupportMultipleWindows={false}
              originWhitelist={['https://*', 'http://*']}
              injectedJavaScriptBeforeDOMContentLoaded="window.__NEARBY_NATIVE_IOS__=true;window.NearbyTravelerNative=true;"
            />
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

export function EditProfileScreen({ navigation }) {
  return <WebViewWithChrome path="/profile/edit" navigation={navigation} />;
}

export function ConnectionsScreen({ navigation }) {
  return <WebViewWithChrome path="/connections" navigation={navigation} />;
}

export function SettingsScreen({ navigation }) {
  return <WebViewWithChrome path="/settings" navigation={navigation} />;
}

/**
 * Generic WebView screen: pass path via route.params. Uses same chrome as WebViewWithChrome (back, loading, error, refresh, external links in Safari).
 */
export function GenericWebViewScreen({ navigation, route }) {
  let path = route.params?.path || '/';
  if (!path.startsWith('/')) path = '/' + path;
  return <WebViewWithChrome path={path} navigation={navigation} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12 },
  refreshButton: { paddingVertical: 8, paddingHorizontal: 12 },
  refreshText: { color: '#F97316', fontSize: 14, fontWeight: '600' },
  backChevron: { color: '#F97316', fontSize: 28, fontWeight: '600', marginRight: 2, lineHeight: 32 },
  backText: { color: '#F97316', fontSize: 16, fontWeight: '600' },
  loadingOverlay: { position: 'absolute', left: 0, right: 0, top: HEADER_HEIGHT, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 1 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#F97316', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  webview: { flex: 1, backgroundColor: '#FFFFFF' },
});
