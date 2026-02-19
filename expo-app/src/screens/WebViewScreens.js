import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Linking, Platform, useColorScheme, useWindowDimensions, ScrollView, RefreshControl, Image, BackHandler, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

function getSpeechModule() {
  return null;
}
import { useAuth } from '../services/AuthContext';
import { BASE_URL, HOST } from '../config';
const HEADER_HEIGHT = 56;

const DARK = {
  bg: '#1c1c1e',
  bgSecondary: '#2c2c2e',
  border: '#38383a',
  text: '#ffffff',
  textMuted: '#8e8e93',
};

const EXTERNAL_HOSTNAMES = ['lu.ma', 'www.lu.ma', 'partiful.com', 'www.partiful.com', 'eventbrite.com', 'www.eventbrite.com', 'wa.me', 'twitter.com', 'x.com', 'facebook.com', 'www.facebook.com', 'instagram.com', 'www.instagram.com'];

const NATIVE_INJECT_JS = `
  window.NearbyTravelerNative = true;
  window.__NEARBY_NATIVE_IOS__ = true;
  window.isNativeApp = true;
  window.__nativeIOSDetected = true;
  try { sessionStorage.setItem('native_ios', 'true'); } catch(e) {}
  (function() {
    var p = (window.location.pathname || '/').replace(/\\/$/, '') || '/';
    if (p === '/' || p === '/landing' || p.indexOf('/landing') === 0) {
      window.location.replace(window.location.origin + '/home?native=ios');
      return;
    }
    var s = document.createElement('style');
    s.id = 'native-ios-css';
    s.textContent = ':root { --native-tabbar-height: 88px; --native-bottom-inset: 88px; } .mobile-top-nav, .mobile-bottom-nav, .desktop-navbar, [data-testid="button-mobile-menu"], .ios-nav-bar { display: none !important; visibility: hidden !important; height: 0 !important; overflow: hidden !important; } body[data-native-ios] .mobile-top-nav, body[data-native-ios] .mobile-bottom-nav, body[data-native-ios] .desktop-navbar { display: none !important; }';
    if (document.head) document.head.appendChild(s);
    else document.addEventListener('DOMContentLoaded', function() { document.head.appendChild(s); });
    function setBodyAttr() {
      if (document.body) {
        document.body.setAttribute('data-native-ios', 'true');
        document.body.classList.add('native-ios-app');
      }
    }
    setBodyAttr();
    document.addEventListener('DOMContentLoaded', setBodyAttr);
    var mo = new MutationObserver(function() { if (document.body) { setBodyAttr(); mo.disconnect(); } });
    mo.observe(document.documentElement, { childList: true });
  })();
  true;
`;

function pathWithNativeIOS(path) {
  const hasQuery = path.indexOf('?') !== -1;
  return `${path}${hasQuery ? '&' : '?'}native=ios`;
}

function webViewSource(path) {
  const uri = `${BASE_URL}${pathWithNativeIOS(path)}`;
  const cookie = api.getSessionCookie();
  if (cookie) {
    return { uri, headers: { Cookie: cookie } };
  }
  return { uri };
}

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

function isExternalUrl(url) {
  try {
    const parsed = new URL(url);
    return EXTERNAL_HOSTNAMES.some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host));
  } catch {
    return false;
  }
}

function addNativeParam(url) {
  const separator = url.includes('?') ? '&' : '?';
  return url + separator + 'native=ios';
}

function WebViewWithChrome({ path, navigation }) {
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const { logout } = useAuth();
  const { height: windowHeight } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [canGoBackWeb, setCanGoBackWeb] = useState(false);
  const webViewRef = useRef(null);
  const source = webViewSource(path);

  const loadUser = useCallback(() => {
    api.getUser().then((u) => {
      if (u && u.id) {
        setUser(u);
        const profileImg = u.profileImage || u.profilePhoto;
        if (!profileImg) {
          api.getUserProfile(u.id).then((profile) => {
            const img = profile?.profileImage || profile?.profilePhoto;
            if (img) {
              setUser((prev) => (prev ? { ...prev, profileImage: img } : prev));
            }
          }).catch(() => {});
        }
      }
    }).catch(() => {});
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);
  useFocusEffect(useCallback(() => { loadUser(); }, [loadUser]));

  const onAvatarPress = useCallback(() => {
    const profilePath = user?.id ? `/profile/${user.id}` : '/profile';
    const fullPath = pathWithNativeIOS(profilePath);
    webViewRef.current?.injectJavaScript(
      `window.location.href='${BASE_URL}${fullPath}';true;`
    );
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return undefined;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (canGoBackWeb && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        if (navigation.canGoBack()) {
          navigation.goBack();
          return true;
        }
        return true;
      });
      return () => sub.remove();
    }, [navigation, canGoBackWeb])
  );

  const onLoadStart = useCallback(() => { setLoading(true); setError(null); }, []);
  const onLoadEnd = useCallback(() => { setLoading(false); setRefreshing(false); }, []);
  const onError = useCallback((e) => {
    setLoading(false); setRefreshing(false);
    const desc = (e.nativeEvent?.description || '').toLowerCase();
    const isConnectionError = desc.includes('connect') || desc.includes('network') || desc.includes('offline') || desc.includes('internet') || desc.includes('err_connection') || desc.includes('nsurlerrordomain');
    setError(isConnectionError ? 'Can\'t connect to server. Please check your internet connection and try again.' : (e.nativeEvent?.description || 'Failed to load page'));
  }, []);
  const onHttpError = useCallback((e) => { setError(e.nativeEvent?.statusCode ? `Error ${e.nativeEvent.statusCode}` : 'Request failed'); }, []);
  const onRetry = useCallback(() => { setError(null); setLoading(true); webViewRef.current?.reload(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); setError(null); webViewRef.current?.reload(); }, []);
  const onShouldStartLoadWithRequest = useCallback((req) => {
    if (isExternalUrl(req?.url)) {
      Linking.openURL(req.url).catch(() => {});
      return false;
    }
    // iOS: never load landing page - redirect to home
    const url = req?.url || '';
    if (url.includes(HOST)) {
      try {
        const pathname = (new URL(url).pathname || '/').replace(/\/$/, '') || '/';
        if (pathname === '/' || pathname === '/landing' || pathname.indexOf('/landing') === 0) {
          webViewRef.current?.injectJavaScript(
            `window.location.replace('${BASE_URL}${pathWithNativeIOS('/home')}');true;`
          );
          return false;
        }
      } catch (e) {}
    }
    return shouldLoadInWebView(req?.url);
  }, []);

  const onMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent?.data || '{}');
      if (data.type === 'START_SPEECH_RECOGNITION') {
        const sendError = (err) => {
          try {
            const escaped = JSON.stringify(err || 'Voice unavailable');
            webViewRef.current?.injectJavaScript(
              `(function(){var cb=window.__onNativeSpeechError__;if(cb)cb(${escaped});})();true;`
            );
          } catch (_) {}
        };
        const sendResult = (text) => {
          try {
            const escaped = JSON.stringify(text || '');
            webViewRef.current?.injectJavaScript(
              `(function(){var cb=window.__onNativeSpeechResult__;if(cb)cb(${escaped});})();true;`
            );
          } catch (_) {}
        };
        const sendEnd = () => {
          try {
            webViewRef.current?.injectJavaScript(
              `(function(){var cb=window.__onNativeSpeechEnd__;if(cb)cb();})();true;`
            );
          } catch (_) {}
        };
        const voiceUnavailableMsg = 'Voice input requires a development build. Use the keyboard to type.';
        let ExpoSpeechRecognitionModule;
        try {
          ExpoSpeechRecognitionModule = getSpeechModule();
        } catch (e) {
          sendError(voiceUnavailableMsg);
          return;
        }
        if (!ExpoSpeechRecognitionModule) {
          sendError(voiceUnavailableMsg);
          return;
        }
        try {
          ExpoSpeechRecognitionModule.requestPermissionsAsync()
            .then((result) => {
              if (!result.granted) {
                sendError('Microphone access was denied. Enable it in Settings.');
                return;
              }
              let lastTranscript = '';
              const resultSub = ExpoSpeechRecognitionModule.addListener('result', (ev) => {
                const t = ev.results?.[0]?.transcript;
                if (t && ev.isFinal) {
                  lastTranscript = t;
                  sendResult(t);
                }
              });
              const errorSub = ExpoSpeechRecognitionModule.addListener('error', (ev) => {
                resultSub.remove();
                errorSub.remove();
                endSub.remove();
                try { ExpoSpeechRecognitionModule.stop(); } catch (_) {}
                sendError(ev.message || ev.error || 'Voice unavailable');
                sendEnd();
              });
              const endSub = ExpoSpeechRecognitionModule.addListener('end', () => {
                resultSub.remove();
                errorSub.remove();
                endSub.remove();
                sendEnd();
              });
              ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: true, continuous: true });
            })
            .catch((e) => sendError(e?.message || voiceUnavailableMsg));
        } catch (nativeErr) {
          sendError(nativeErr?.message || voiceUnavailableMsg);
        }
      } else if (data.type === 'STOP_SPEECH_RECOGNITION') {
        try {
          const mod = getSpeechModule();
          if (mod) try { mod.stop(); } catch (_) {}
        } catch (_) {}
      } else if (data.type === 'LOGOUT') {
        logout().catch(() => {});
      }
    } catch (e) {
      console.warn('WebView speech message error:', e);
    }
  }, [logout]);

  const containerBg = dark ? DARK.bg : '#FFFFFF';
  const headerBg = dark ? DARK.bg : '#FFFFFF';
  const headerBorder = dark ? DARK.border : '#F3F4F6';
  const profileImg = user?.profileImage || user?.profilePhoto;
  const initials = (user?.name || user?.fullName || user?.displayName || user?.username || 'U').charAt(0).toUpperCase();

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: containerBg }]}>
        <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
          <View style={styles.logoContainer}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: dark ? DARK.text : '#111827' }}>NearbyTraveler</Text>
          </View>
        </View>
        <View style={[styles.errorContainer, { backgroundColor: containerBg }]}>
          <Text style={[styles.errorText, dark && { color: DARK.textMuted }]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: containerBg }]}>
      <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          if (canGoBackWeb && webViewRef.current) {
            webViewRef.current.goBack();
          } else if (navigation.canGoBack()) {
            navigation.goBack();
          }
        }}>
          <Text style={styles.backChevron}>‹</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: dark ? DARK.text : '#111827' }}>NearbyTraveler</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.avatarButton} onPress={onAvatarPress}>
            {profileImg ? (
              <Image source={{ uri: profileImg }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarFallback, dark && styles.avatarFallbackDark]}>
                <Text style={styles.avatarFallbackText}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      {loading && (
        <View style={[styles.loadingOverlay, dark && { backgroundColor: 'rgba(28,28,30,0.9)' }]}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={source}
        style={[styles.webview, dark && { backgroundColor: DARK.bg }]}
        injectedJavaScriptBeforeContentLoaded={NATIVE_INJECT_JS}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
        onError={onError}
        onHttpError={onHttpError}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onNavigationStateChange={(navState) => {
          setCanGoBackWeb(navState.canGoBack);
          const url = navState?.url || '';
          if (!url.includes(HOST)) return;
          const pathname = (url.replace(BASE_URL, '').split('?')[0] || '/').replace(/\/$/, '') || '/';
          if (pathname === '/' || pathname === '/landing' || pathname.indexOf('/landing') === 0) {
            webViewRef.current?.injectJavaScript(
              `window.location.replace('${BASE_URL}${pathWithNativeIOS('/home')}');true;`
            );
          }
        }}
        allowsBackForwardNavigationGestures={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        pullToRefreshEnabled={true}
        sharedCookiesEnabled={true}
      />
    </SafeAreaView>
  );
}

function NTWebView({ uri }) {
  return (
    <WebView
      source={{ uri: addNativeParam(uri) }}
      style={styles.webview}
      injectedJavaScriptBeforeContentLoaded={NATIVE_INJECT_JS}
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

// iOS app never shows landing - use home instead of / or /landing
function ensureNoLandingPath(path) {
  const p = (path || '/').replace(/\/$/, '') || '/';
  if (p === '/' || p === '/landing' || p.indexOf('/landing') === 0) return '/home';
  return path || '/home';
}

export function GenericWebViewScreen({ route, navigation }) {
  const path = ensureNoLandingPath(route?.params?.path);
  return <WebViewWithChrome path={path} navigation={navigation} />;
}

/**
 * Join/Sign-up WebView - loads /join which has the correct 3-step flow:
 * Step 1: Choose user type (Local/Traveler/Business)
 * Step 2: Create account (SignupAccount)
 * Step 3: Complete profile (SignupLocal or SignupTraveling)
 * Replaces the old single-form RegisterScreen.
 * Uses incognito. sharedCookiesEnabled=true so after signup the session is available to the app and checkAuth() can succeed.
 */
export function JoinWebViewScreen({ navigation }) {
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const { checkAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const webViewRef = useRef(null);
  const signupCompletedRef = useRef(false);
  const joinUri = `${BASE_URL}${pathWithNativeIOS('/join')}`;
  const source = { uri: joinUri };

  const onLoadStart = useCallback(() => { setLoading(true); setError(null); }, []);
  const onLoadEnd = useCallback(() => setLoading(false), []);
  const onError = useCallback((e) => {
    setLoading(false);
    const desc = (e.nativeEvent?.description || '').toLowerCase();
    const isConnectionError = desc.includes('connect') || desc.includes('network') || desc.includes('offline') || desc.includes('internet') || desc.includes('err_connection') || desc.includes('nsurlerrordomain');
    setError(isConnectionError ? 'Can\'t connect to server. Please check your internet connection and try again.' : (e.nativeEvent?.description || 'Failed to load page'));
  }, []);
  const onShouldStartLoadWithRequest = useCallback((request) => {
    const url = request?.url || '';
    if (!url.includes(BASE_URL)) return true;
    const pathname = (url.replace(BASE_URL, '').split('?')[0] || '/').replace(/\/$/, '') || '/';

    // FIRST: Check if signup completed (pathname === '/home') - allow before any redirect logic
    if (pathname === '/home' || pathname === '/account-success' || pathname === '/finishing-setup') {
      signupCompletedRef.current = true;
      return true;  // ALLOW the load
    }

    // THEN: Block landing/join loop only if signup NOT completed
    if (!signupCompletedRef.current && (pathname === '/' || pathname === '/landing' || pathname.indexOf('/landing') === 0)) {
      webViewRef.current?.injectJavaScript(`window.location.href='${joinUri}';true;`);
      return false;
    }

    return true;
  }, [joinUri]);

  const onNavigationStateChange = useCallback((navState) => {
    const url = navState?.url || '';
    if (!url.includes(BASE_URL)) return;

    // Mark signup complete on ANY successful navigation away from /join
    if (!url.includes('/join')) {
      signupCompletedRef.current = true;
      checkAuth?.();
      // Navigate to Home screen immediately
      navigation.navigate('Home');
    }
  }, [checkAuth, navigation]);

  const containerBg = dark ? DARK.bg : '#FFFFFF';
  const headerBg = dark ? DARK.bg : '#FFFFFF';
  const headerBorder = dark ? DARK.border : '#F3F4F6';

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: containerBg }]}>
        <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backChevron, { marginRight: 4 }]}>‹</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.errorContainer, { backgroundColor: containerBg }]}>
          <Text style={[styles.errorText, dark && { color: DARK.textMuted }]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => { setError(null); setLoading(true); webViewRef.current?.reload(); }}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: containerBg }]}>
      <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backChevron, { marginRight: 4 }]}>‹</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: dark ? DARK.text : '#111827' }}>Create Account</Text>
        </View>
      </View>
      {loading && (
        <View style={[styles.loadingOverlay, dark && { backgroundColor: 'rgba(28,28,30,0.9)' }]}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={source}
        style={[styles.webview, dark && { backgroundColor: DARK.bg }]}
        injectedJavaScriptBeforeContentLoaded={NATIVE_INJECT_JS}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
        onError={onError}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onNavigationStateChange={onNavigationStateChange}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        incognito={true}
        sharedCookiesEnabled={true}
      />
    </SafeAreaView>
  );
}

export function EditProfileScreen({ navigation }) {
  return <WebViewWithChrome path="/profile/edit" navigation={navigation} />;
}

export function ConnectionsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backText}>Back</Text></TouchableOpacity>
      <NTWebView uri={`${BASE_URL}/connections?native=ios`} />
    </SafeAreaView>
  );
}

export function SettingsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backText}>Back</Text></TouchableOpacity>
      <NTWebView uri={`${BASE_URL}/settings?native=ios`} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', height: HEADER_HEIGHT },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, minWidth: 72, flexShrink: 0 },
  logoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, minWidth: 0 },
  logoImage: { height: 108, width: 480, maxWidth: '90%' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signOutButton: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8 },
  signOutText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  avatarButton: { width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' },
  avatarFallbackDark: { backgroundColor: '#EA580C' },
  avatarFallbackText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
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
