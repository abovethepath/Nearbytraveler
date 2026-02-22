import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Linking, Platform, useColorScheme, useWindowDimensions, ScrollView, RefreshControl, Image, BackHandler, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
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
    s.textContent = ':root { --native-tabbar-height: 88px; --native-bottom-inset: 88px; --native-header-height: 56px; } .mobile-top-nav, .mobile-bottom-nav, .desktop-navbar, [data-testid="button-mobile-menu"], .ios-nav-bar { display: none !important; visibility: hidden !important; height: 0 !important; overflow: hidden !important; } body[data-native-ios] .mobile-top-nav, body[data-native-ios] .mobile-bottom-nav, body[data-native-ios] .desktop-navbar { display: none !important; }'
      + ' body.native-ios-app div.bg-gradient-to-r[style*="100vw"], body.native-ios-app div[style*="100vw"][style*="translateX(-50%)"] { width: 100% !important; max-width: 100% !important; left: 0 !important; transform: none !important; overflow-x: clip !important; box-sizing: border-box !important; min-height: 220px !important; }'
      + ' body.native-ios-app div.flex.items-start.gap-1\\.5.min-w-0 { flex-wrap: wrap !important; min-width: 0 !important; gap: 10px !important; row-gap: 8px !important; }'
      + ' body.native-ios-app div.flex.items-start.gap-1\\.5.min-w-0 > span.flex-shrink-0.self-start { flex-basis: 100% !important; margin-top: 8px !important; align-self: flex-start !important; }';
    if (document.head) document.head.appendChild(s);
    else document.addEventListener('DOMContentLoaded', function() { document.head.appendChild(s); });
    function setBodyAttr() {
      if (document.body) {
        document.body.setAttribute('data-native-ios', 'true');
        document.body.classList.add('native-ios-app');
        document.body.setAttribute('data-native-hero-patch', 'ok');
      }
    }
    setBodyAttr();
    document.addEventListener('DOMContentLoaded', setBodyAttr);
    var mo = new MutationObserver(function() { if (document.body) { setBodyAttr(); mo.disconnect(); } });
    mo.observe(document.documentElement, { childList: true });
    function hideNearbyTravelerWhenEmpty() {
      var spans = document.querySelectorAll('body.native-ios-app span');
      for (var i = 0; i < spans.length; i++) {
        var span = spans[i];
        if ((span.textContent || '').trim() !== 'Nearby Traveler') continue;
        var destSpan = span.nextElementSibling;
        if (!destSpan) continue;
        var dest = (destSpan.textContent || '').trim();
        if (dest === '' || dest === '—' || dest === '--' || dest.toLowerCase() === 'null') {
          span.style.display = 'none';
          destSpan.style.display = 'none';
        }
      }
    }
    function patchHeroHometownLine() {
      var spans = document.querySelectorAll('body.native-ios-app span');
      for (var i = 0; i < spans.length; i++) {
        if ((spans[i].textContent || '').trim() !== 'Nearby Local') continue;
        var hometownEl = spans[i].nextElementSibling;
        if (!hometownEl || !(hometownEl.textContent || '').trim()) continue;
        hometownEl.style.whiteSpace = 'normal';
        hometownEl.style.overflow = 'visible';
        hometownEl.style.textOverflow = 'clip';
        hometownEl.style.maxWidth = '100%';
        var t = hometownEl.textContent || '';
        if (t.indexOf('United States') !== -1) {
          hometownEl.textContent = t.replace(/\\bUnited States\\b/g, 'USA');
        }
        break;
      }
    }
    function runHeroPatch() {
      hideNearbyTravelerWhenEmpty();
      patchHeroHometownLine();
      if (document.body) document.body.setAttribute('data-native-hero-patch', 'ok');
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runHeroPatch);
    } else {
      runHeroPatch();
    }
    setTimeout(runHeroPatch, 800);
  })();
  true;
`;

// Messages page: prevent blank collapse + one-time reload if content missing (iOS WebView only).
const MESSAGES_PAGE_INJECT_JS = `
(function() {
  function applyStickyHeights() {
    try {
      if (document.documentElement) document.documentElement.style.height = '100%';
      if (document.body) {
        document.body.style.height = 'auto';
        document.body.style.minHeight = '120vh';
      }
    } catch(e) {}
  }
  var end = Date.now() + 10000;
  var mo = new MutationObserver(function() {
    if (Date.now() > end) { mo.disconnect(); return; }
    applyStickyHeights();
  });
  function run() {
    applyStickyHeights();
    try {
      if (document.body) mo.observe(document.body, { attributes: true, attributeFilter: ['style'], subtree: true });
    } catch(e) {}
    setTimeout(function() { mo.disconnect(); }, 10000);
    setTimeout(function() {
      try {
        var hasContent = document.querySelector('[data-testid="messages-list"], [data-testid="message-list"], .messages, [class*="MessagesList"], [class*="message-list"], [class*="message-thread"]') || (document.body && document.body.innerText && document.body.innerText.length > 200);
        if (hasContent) return;
        if (sessionStorage.getItem('__reloaded_messages_once')) return;
        sessionStorage.setItem('__reloaded_messages_once', '1');
        location.reload();
      } catch(e) {}
    }, 3000);
  }
  if (document.body) run(); else document.addEventListener('DOMContentLoaded', run);
})();
true;
`;

// Messages only: on-screen auth check badge (fetch with credentials) — proves whether WebView is authenticated.
const MESSAGES_AUTH_DEBUG_BADGE_JS = `
(function() {
  function badge(text) {
    try {
      var el = document.getElementById('native-msg-debug');
      if (!el) {
        el = document.createElement('div');
        el.id = 'native-msg-debug';
        el.style.cssText = 'position:fixed;top:8px;left:8px;z-index:999999;background:rgba(0,0,0,0.75);color:#fff;padding:6px 8px;font-size:12px;border-radius:8px;max-width:92vw;';
        if (document.body) document.body.appendChild(el);
      }
      el.textContent = text;
    } catch(e) {}
  }
  function checkAuth() {
    badge('Checking /api/auth/user...');
    fetch('/api/auth/user', { credentials: 'include' })
      .then(function(res) { badge('/api/auth/user: ' + res.status); })
      .catch(function() { badge('Auth check failed'); });
  }
  if (document.body) {
    setTimeout(checkAuth, 600);
    setTimeout(checkAuth, 2000);
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(checkAuth, 600);
      setTimeout(checkAuth, 2000);
    });
  }
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
  const { user: authUser, logout } = useAuth();
  const sessionCookie = api.getSessionCookie();
  const sessionId = sessionCookie ? sessionCookie.replace(/^nt\.sid=/, '') : null;
  const { height: windowHeight } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [headerProfileImage, setHeaderProfileImage] = useState(null);
  const [canGoBackWeb, setCanGoBackWeb] = useState(false);
  const webViewRef = useRef(null);
  const displayUser = authUser || user;
  const source = webViewSource(path);
  const [messagesBootstrapUri, setMessagesBootstrapUri] = useState(null);

  // Wait for auth on Messages and chat paths so the page never loads without user (avoids blank / "Please log in")
  const isMessagesPath = path === '/messages' || (path && path.startsWith('/messages'));
  const isChatroomPath = path && path.startsWith('/chatroom');
  const isEventChatPath = path && path.startsWith('/event-chat');
  const wantsAuth = isMessagesPath || isChatroomPath || isEventChatPath;
  const shouldWaitForAuth = wantsAuth && !displayUser;
  const [authWaitExpired, setAuthWaitExpired] = useState(false);
  const authWaitMs = isMessagesPath ? 6000 : 2500;
  useEffect(() => {
    if (!wantsAuth || displayUser) return;
    const t = setTimeout(() => setAuthWaitExpired(true), authWaitMs);
    return () => clearTimeout(t);
  }, [wantsAuth, displayUser, authWaitMs]);
  useEffect(() => {
    if (displayUser) setAuthWaitExpired(false);
  }, [displayUser]);

  useEffect(() => {
    if (!isMessagesPath) {
      setMessagesBootstrapUri(null);
      return;
    }
    if (!displayUser) return;
    let cancelled = false;
    api.getWebViewToken().then((token) => {
      if (cancelled || !token) return;
      const uri = `${BASE_URL}/api/auth/webview-login?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent('/messages')}`;
      setMessagesBootstrapUri(uri);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [isMessagesPath, displayUser?.id]);

  const authReady = !!displayUser;
  const messagesBootstrapReady = isMessagesPath && authReady && !!messagesBootstrapUri;
  const effectiveSource = isMessagesPath && authReady
    ? (messagesBootstrapReady ? { uri: messagesBootstrapUri } : null)
    : ((shouldWaitForAuth && !authWaitExpired) ? null : source);
  const showAuthWaiting = shouldWaitForAuth && !authWaitExpired;
  const isMessagesWaiting = isMessagesPath && (!authReady || !messagesBootstrapUri);

  const loadUser = useCallback(() => {
    api.getUser().then((u) => {
      if (u && u.id) {
        setUser(u);
        const profileImg = u.profileImage || u.profilePhoto;
        if (!profileImg) {
          api.getUserProfile(u.id).then((profile) => {
            const img = profile?.profileImage || profile?.profilePhoto;
            if (img) {
              setHeaderProfileImage(img);
              setUser((prev) => (prev ? { ...prev, profileImage: img } : prev));
            }
          }).catch(() => {});
        } else {
          setHeaderProfileImage(profileImg);
        }
      }
    }).catch(() => {});
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);
  useFocusEffect(useCallback(() => { loadUser(); }, [loadUser]));

  // When authUser is set but has no profile image (e.g. from login), fetch profile for header avatar
  useEffect(() => {
    const who = authUser || user;
    if (!who?.id) return;
    const hasImg = who.profileImage || who.profilePhoto || headerProfileImage;
    if (hasImg) {
      if ((who.profileImage || who.profilePhoto) && !headerProfileImage) setHeaderProfileImage(who.profileImage || who.profilePhoto);
      return;
    }
    api.getUserProfile(who.id).then((profile) => {
      const img = profile?.profileImage || profile?.profilePhoto;
      if (img) {
        setHeaderProfileImage(img);
        setUser((prev) => (prev && prev.id === who.id ? { ...prev, profileImage: img } : prev));
      }
    }).catch(() => {});
  }, [authUser?.id, user?.id, authUser?.profileImage, authUser?.profilePhoto, user?.profileImage, user?.profilePhoto]);

  const onAvatarPress = useCallback(() => {
    const tabNav = navigation.getParent?.();
    if (tabNav?.navigate) {
      tabNav.navigate('Profile');
      return;
    }
    const rootNav = navigation.getParent?.()?.getParent?.();
    if (rootNav?.navigate) {
      rootNav.navigate('MainTabs', { screen: 'Profile' });
      return;
    }
    try {
      navigation.dispatch(CommonActions.navigate('Profile'));
    } catch (_) {
      const u = authUser || user;
      const profilePath = u?.username ? `/profile/${u.username}` : '/profile';
      const fullPath = pathWithNativeIOS(profilePath);
      webViewRef.current?.injectJavaScript(
        `window.location.href='${BASE_URL}${fullPath}';true;`
      );
    }
  }, [navigation, authUser?.username, user?.username]);

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
  const profileImg = headerProfileImage || displayUser?.profileImage || displayUser?.profilePhoto || user?.profileImage || user?.profilePhoto;
  const initials = (displayUser?.name || displayUser?.fullName || displayUser?.displayName || displayUser?.username || 'U').charAt(0).toUpperCase();

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

  const loadingBg = dark ? DARK.bg : '#FFFFFF';

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
          {(authUser || user) && (
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => {
                try {
                  webViewRef.current?.injectJavaScript(
                    "window.dispatchEvent(new CustomEvent('openSearchWidget'));true;"
                  );
                } catch (e) {}
              }}
              accessibilityLabel="Search"
            >
              <Text style={[styles.searchButtonText, dark && { color: DARK.text }]}>🔍</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.avatarButton} onPress={onAvatarPress}>
            {profileImg ? (
              <Image
                source={{ uri: profileImg.startsWith('http') ? profileImg : `${BASE_URL}${profileImg.startsWith('/') ? '' : '/'}${profileImg}` }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={[styles.avatarFallback, dark && styles.avatarFallbackDark]}>
                <Text style={styles.avatarFallbackText}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      {isMessagesWaiting ? (
        <View style={[styles.webview, { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: loadingBg }]}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={[styles.loadingMessage, dark && { color: DARK.textMuted }]}>Preparing Messages…</Text>
        </View>
      ) : showAuthWaiting ? (
        <View style={[styles.webview, { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: loadingBg }]}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : (
      <WebView
        key={isMessagesPath ? `${path}|${authReady ? 1 : 0}` : undefined}
        ref={webViewRef}
        source={effectiveSource}
        style={[styles.webview, dark && { backgroundColor: DARK.bg }]}
        injectedJavaScriptBeforeContentLoaded={
          NATIVE_INJECT_JS +
          (sessionCookie ? `
(function() {
  try {
    document.cookie = ${JSON.stringify(sessionCookie + '; path=/; max-age=86400')};
  } catch(e) {}
})();
` : '') +
          (displayUser ? `
(function() {
  try {
    var u = ${JSON.stringify(displayUser)};
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('userData', JSON.stringify(u));
    localStorage.setItem('travelconnect_user', JSON.stringify(u));
    ${sessionId ? `localStorage.setItem('auth_token', ${JSON.stringify(sessionId)});` : ''}
    console.log('[NearbyTraveler Native] Auth injection fired - user and token set');
  } catch(e) {}
})();
` : '') +
          (isMessagesPath ? MESSAGES_PAGE_INJECT_JS : '') +
          (isMessagesPath ? MESSAGES_AUTH_DEBUG_BADGE_JS : '') + '\ntrue;'
        }
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
        cacheEnabled={true}
        startInLoadingState={true}
        pullToRefreshEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        {...(isMessagesPath && Platform.OS === 'ios' ? { useSharedProcessPool: true, incognito: false } : {})}
        fadeDuration={0}
        renderLoading={() => (
          <View style={{ flex: 1, backgroundColor: loadingBg, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#F97316" />
          </View>
        )}
      />
      )}
    </SafeAreaView>
  );
}

function NTWebView({ uri }) {
  return (
    <WebView
      source={{ uri: addNativeParam(uri) }}
      style={styles.webview}
      sharedCookiesEnabled={true}
      thirdPartyCookiesEnabled={true}
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
 * No incognito - sharedCookiesEnabled + thirdPartyCookiesEnabled so session cookie flows through.
 * On signup-complete path, calls checkAuth() then navigates to Home so AuthContext has user before MainTabs.
 */
export function JoinWebViewScreen({ navigation }) {
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const { checkAuth, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const webViewRef = useRef(null);
  const signupCompletedRef = useRef(false);
  const joinUri = `${BASE_URL}${pathWithNativeIOS('/join')}`;
  const source = { uri: joinUri };

  const handleMessage = useCallback(async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SIGNUP_COMPLETE' && data.user) {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        signupCompletedRef.current = true;
      }
    } catch (e) {}
  }, [setUser, navigation]);

  const onLoadStart = useCallback(() => { setLoading(true); setError(null); }, []);
  const onLoadEnd = useCallback(() => setLoading(false), []);
  const onError = useCallback((e) => {
    setLoading(false);
    const desc = (e.nativeEvent?.description || '').toLowerCase();
    const isConnectionError = desc.includes('connect') || desc.includes('network') || desc.includes('offline') || desc.includes('internet') || desc.includes('err_connection') || desc.includes('nsurlerrordomain');
    setError(isConnectionError ? 'Can\'t connect to server. Please check your internet connection and try again.' : (e.nativeEvent?.description || 'Failed to load page'));
  }, []);
  // Paths that indicate signup is complete - Local/Traveler go to /profile or /profile/:id, Business to /business-dashboard
  const isSignupCompletePath = (pathname) => {
    if (!pathname) return false;
    return pathname === '/home' || pathname === '/welcome' || pathname === '/welcome-business' ||
      pathname === '/account-success' || pathname === '/finishing-setup' ||
      pathname === '/profile' || pathname === '/business-dashboard' ||
      (pathname.startsWith('/profile/') && pathname.split('/').length >= 3);
  };

  const onShouldStartLoadWithRequest = useCallback((request) => {
    const url = request?.url || '';
    if (!url.includes(BASE_URL)) return true;
    const pathname = (url.replace(BASE_URL, '').split('?')[0] || '/').replace(/\/$/, '') || '/';

    // FIRST: Check if signup completed - allow before any redirect logic
    if (isSignupCompletePath(pathname)) {
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

  const onNavigationStateChange = useCallback(async (navState) => {
    const url = navState?.url || '';
    if (!url.includes(BASE_URL)) return;

    const pathname = (url.replace(BASE_URL, '').split('?')[0] || '/').replace(/\/$/, '') || '/';

    // Signup complete: call checkAuth so session is in AuthContext, then navigate to native Home
    // Local/Traveler redirect to /profile/:id or /home; Business to /business-dashboard
    if (pathname === '/welcome' || pathname === '/welcome-business' || pathname === '/home' ||
        pathname === '/profile' || pathname === '/business-dashboard' ||
        (pathname.startsWith('/profile/') && pathname.split('/').length >= 3)) {
      signupCompletedRef.current = true;
      await checkAuth();
    }
  }, [navigation, checkAuth]);

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
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
      />
    </SafeAreaView>
  );
}

/**
 * Business signup WebView - loads web /signup/business which has SmartLocationInput (same dropdowns as rest of site).
 * Injects accountData from native SignupStep2 into sessionStorage before page loads.
 */
export function BusinessSignupWebViewScreen({ navigation }) {
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const { checkAuth, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signupData, setSignupData] = useState(null);
  const [injectScript, setInjectScript] = useState('');
  const webViewRef = useRef(null);

  const handleMessage = useCallback(async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SIGNUP_COMPLETE' && data.user) {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        await AsyncStorage.removeItem('signup_data');
        setUser(data.user);
      }
    } catch (e) {}
  }, [setUser, navigation]);

  useEffect(() => {
    const load = async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const stored = await AsyncStorage.getItem('signup_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          setSignupData(parsed);
          const accountData = {
            name: parsed.name || '',
            username: parsed.username || '',
            email: (parsed.email || '').toLowerCase().trim(),
            confirmEmail: (parsed.email || '').toLowerCase().trim(),
            phoneNumber: parsed.phoneNumber || '',
            password: parsed.password || '',
            userType: 'business',
            isNewToTown: false,
            keepLoggedIn: true,
          };
          setInjectScript(
            `(function(){try{var d=${JSON.stringify(accountData)};sessionStorage.setItem('accountData',JSON.stringify(d));}catch(e){}})();true;`
          );
        } else {
          navigation.replace('SignupStep1');
        }
      } catch {
        navigation.replace('SignupStep1');
      }
    };
    load();
  }, [navigation]);

  const businessUri = `${BASE_URL}${pathWithNativeIOS('/signup/business')}`;
  const source = { uri: businessUri };

  const onLoadStart = useCallback(() => { setLoading(true); setError(null); }, []);
  const onLoadEnd = useCallback(() => setLoading(false), []);
  const onError = useCallback((e) => {
    setLoading(false);
    const desc = (e.nativeEvent?.description || '').toLowerCase();
    const isConnectionError = desc.includes('connect') || desc.includes('network') || desc.includes('offline') || desc.includes('internet') || desc.includes('err_connection') || desc.includes('nsurlerrordomain');
    setError(isConnectionError ? 'Can\'t connect to server. Please check your internet connection and try again.' : (e.nativeEvent?.description || 'Failed to load page'));
  }, []);

  const onNavigationStateChange = useCallback(async (navState) => {
    const url = navState?.url || '';
    if (!url.includes(BASE_URL)) return;
    const pathname = (url.replace(BASE_URL, '').split('?')[0] || '/').replace(/\/$/, '') || '/';
    if (pathname === '/business-dashboard' || pathname === '/home' || pathname.startsWith('/profile/')) {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem('signup_data');
      } catch (_) {}
      await checkAuth();
      // AppNavigator switches to MainTabs when user is set
    }
  }, [navigation, checkAuth]);

  const containerBg = dark ? DARK.bg : '#FFFFFF';
  const headerBg = dark ? DARK.bg : '#FFFFFF';
  const headerBorder = dark ? DARK.border : '#F3F4F6';

  if (!signupData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: containerBg }]}>
        <View style={[styles.loadingOverlay, dark && { backgroundColor: 'rgba(28,28,30,0.9)' }]}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      </SafeAreaView>
    );
  }

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

  const injectedBeforeLoad = injectScript
    ? `${NATIVE_INJECT_JS}\n${injectScript}`
    : NATIVE_INJECT_JS;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: containerBg }]}>
      <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backChevron, { marginRight: 4 }]}>‹</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: dark ? DARK.text : '#111827' }}>Register Business</Text>
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
        injectedJavaScriptBeforeContentLoaded={injectedBeforeLoad}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
        onError={onError}
        onNavigationStateChange={onNavigationStateChange}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
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

/**
 * In-app Terms (or any single URL) screen for Auth flow.
 * Opens the given URL in a WebView with a Back button so the user stays in the app
 * and returns to sign-in/signup when they tap Back (instead of leaving the app).
 */
export function TermsWebViewScreen({ route, navigation }) {
  const { url, title = 'Terms and Conditions' } = route?.params || {};
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const [loading, setLoading] = useState(true);
  const effectiveUrl = url || `${BASE_URL}/terms`;
  const source = { uri: effectiveUrl };

  const onShouldStartLoadWithRequest = useCallback((req) => {
    if (isExternalUrl(req?.url)) {
      Linking.openURL(req.url).catch(() => {});
      return false;
    }
    // When the terms page "Back" / "Back to Sign In" navigates to /auth, /, or /landing,
    // stay in the app: pop the Terms screen and return to sign-up/sign-in instead of loading the site.
    const reqUrl = (req?.url || '').trim();
    if (reqUrl && reqUrl.includes(HOST)) {
      try {
        const pathname = (new URL(reqUrl).pathname || '/').replace(/\/$/, '') || '/';
        if (pathname === '/' || pathname === '/auth' || pathname === '/landing' || pathname.indexOf('/landing') === 0) {
          navigation.goBack();
          return false;
        }
      } catch (_) {}
    }
    return true;
  }, [navigation]);

  const headerBg = dark ? DARK.bg : '#FFFFFF';
  const headerBorder = dark ? DARK.border : '#F3F4F6';
  const titleColor = dark ? DARK.text : '#111827';
  const backColor = '#F97316';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: headerBg }]}>
      <View style={[styles.termsHeader, { borderBottomColor: headerBorder }]}>
        <TouchableOpacity
          style={styles.termsBackButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back to sign up"
        >
          <Text style={[styles.backChevron, { color: backColor }]}>&lsaquo;</Text>
          <Text style={[styles.backText, { color: backColor }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.termsTitle, { color: titleColor }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.termsBackButton} />
      </View>
      <WebView
        source={source}
        style={[styles.webview, dark && { backgroundColor: DARK.bg }]}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
      />
      {loading && (
        <View style={[styles.loadingOverlay, { top: HEADER_HEIGHT, backgroundColor: dark ? 'rgba(28,28,30,0.9)' : 'rgba(255,255,255,0.8)' }]}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      )}
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
  searchButton: { width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  searchButtonText: { fontSize: 22, color: '#111827' },
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
  loadingMessage: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  termsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, paddingHorizontal: 8, borderBottomWidth: 1, height: HEADER_HEIGHT },
  termsBackButton: { minWidth: 72, flexShrink: 0, flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8 },
  termsTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', paddingHorizontal: 8 },
});
