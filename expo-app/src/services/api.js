import AsyncStorage from '@react-native-async-storage/async-storage';
import offlineStorage from './offlineStorage';
import { BASE_URL } from '../config';

const SESSION_KEY = 'nt_session_id';
const SIGNED_SESSION_KEY = 'nt_signed_session_cookie';

const CONNECTION_ERROR_MSG = 'Can\'t connect to server. Please check your internet connection and try again.';

function isNetworkError(e) {
  if (!e) return false;
  const msg = (e.message || String(e)).toLowerCase();
  return e.name === 'TypeError' || msg.includes('network') || msg.includes('failed to fetch') || msg.includes('fetch') || msg.includes('connection');
}

/** Wrap fetch and turn network failures into a clear user-facing message. */
async function fetchWithConnectionMessage(url, options) {
  try {
    return await fetch(url, options);
  } catch (e) {
    if (isNetworkError(e)) throw new Error(CONNECTION_ERROR_MSG);
    throw e;
  }
}

let sessionCookie = null;

/** Restore session id from storage (call on app load so subsequent requests send Cookie). */
const restoreSession = async () => {
  try {
    // Prefer the signed cookie value (works for WebView auth via Cookie header).
    // Fallback to raw sessionId for older app installs that pre-date Alt E.
    const signed = await AsyncStorage.getItem(SIGNED_SESSION_KEY);
    if (signed) {
      sessionCookie = `nt.sid=${signed}`;
      console.log('🔐 [RESTORE] signedFromStorage:', !!signed);
      console.log('🔐 [RESTORE] sessionCookie set to:', sessionCookie ? sessionCookie.substring(0, 30) + '...' : 'NULL');
      return;
    }
    const sid = await AsyncStorage.getItem(SESSION_KEY);
    if (sid) sessionCookie = `nt.sid=${sid}`;
    else sessionCookie = null;
    console.log('🔐 [RESTORE] signedFromStorage:', !!signed);
    console.log('🔐 [RESTORE] sessionCookie set to:', sessionCookie ? sessionCookie.substring(0, 30) + '...' : 'NULL');
  } catch (e) {
    sessionCookie = null;
    console.log('🔐 [RESTORE] error:', e?.message || String(e));
  }
};

const getHeaders = () => {
  const h = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Client': 'ReactNative',
  };
  if (sessionCookie) h['Cookie'] = sessionCookie;
  return h;
};

const extractCookie = (r) => {
  const s = r.headers.get && r.headers.get('set-cookie');
  if (s) sessionCookie = s.split(';')[0].trim();
};

// Helper to check network and use cache if offline
const fetchWithOffline = async (url, options, cacheKey, cacheGetter) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error('Network response not ok');

    const data = await response.json();

    // Cache the successful response
    if (cacheKey && data) {
      await offlineStorage.cacheData(cacheKey, data);
    }

    return data;
  } catch (error) {
    console.log('Network error, trying cache:', error.message);

    // If network fails, try to get cached data
    if (cacheGetter) {
      const cachedData = await cacheGetter();
      if (cachedData) {
        console.log('Returning cached data');
        return cachedData;
      }
    }

    throw error;
  }
};

const api = {
  // Supports:
  // 1) login(email, password)  (backward compatible)
  // 2) login({ email, password }) or login({ username, password })
  async login(arg1, arg2) {
    let payload;

    if (typeof arg1 === 'object' && arg1 !== null) {
      payload = {
        email: arg1.email,
        username: arg1.username,
        password: arg1.password,
      };
    } else {
      payload = { email: arg1, password: arg2 };
    }

    // clean up strings
    if (payload.email) payload.email = String(payload.email).trim();
    if (payload.username) payload.username = String(payload.username).trim();
    if (payload.password) payload.password = String(payload.password).trim();

    const r = await fetchWithConnectionMessage(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    extractCookie(r);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.message || 'Login failed');

    console.log('🔐 [LOGIN] Response keys:', Object.keys(d));
    console.log('🔐 [LOGIN] Has signedSessionCookie:', !!d.signedSessionCookie);
    console.log('🔐 [LOGIN] Has sessionId:', !!d.sessionId);

    // React Native: server returns sessionId (raw) AND signedSessionCookie
    // (s:RAW.SIGNATURE) in body. Prefer the signed value — express-session
    // validates the signature, which is required for WebView Cookie-header
    // auth (httpOnly blocks JS document.cookie writes).
    if (d.signedSessionCookie) {
      sessionCookie = `nt.sid=${d.signedSessionCookie}`;
      try {
        await AsyncStorage.setItem(SIGNED_SESSION_KEY, d.signedSessionCookie);
        if (d.sessionId) await AsyncStorage.setItem(SESSION_KEY, d.sessionId);
      } catch (e) {}
    } else if (d.sessionId) {
      // Fallback for older server builds — native fetches still work, but
      // WebView pages will get 401 (server rejects unsigned cookie).
      sessionCookie = `nt.sid=${d.sessionId}`;
      try {
        await AsyncStorage.setItem(SESSION_KEY, d.sessionId);
      } catch (e) {}
    }

    console.log('🔐 [LOGIN] sessionCookie set to:', sessionCookie ? sessionCookie.substring(0, 30) + '...' : 'NULL');

    if (d.user) {
      await offlineStorage.cacheProfile(d.user);
    }

    return d;
  },

  async getUser() {
    try {
      const r = await fetchWithConnectionMessage(`${BASE_URL}/api/auth/user`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!r.ok) {
        // 401 = no session - never use cached profile (could be wrong user)
        if (r.status === 401) {
          sessionCookie = null;
          try { await AsyncStorage.removeItem(SESSION_KEY); } catch (e) {}
          try { await AsyncStorage.removeItem(SIGNED_SESSION_KEY); } catch (e) {}
          await offlineStorage.clearProfileCache();
          return null;
        }
        // Other errors: try cache only for offline
        return await offlineStorage.getCachedProfile();
      }
      const data = await r.json();
      await offlineStorage.cacheProfile(data);
      return data;
    } catch (error) {
      return await offlineStorage.getCachedProfile();
    }
  },

  async logout() {
    await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
    });
    sessionCookie = null;
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
      await AsyncStorage.removeItem(SIGNED_SESSION_KEY);
    } catch (e) {}
    await offlineStorage.clearCache();
  },

  restoreSession,
  /** Ensure session is loaded from storage (call before WebView load so cookie is available). */
  async ensureSessionReady() {
    await restoreSession();
  },
  /** Store session from WebView signup so Messages/API work in native tabs.
   *  Accepts an optional signedSessionCookie (preferred for WebView auth).
   *  Until the WebView signup flow exposes the signed value via postMessage,
   *  callers may still pass only sessionId (works for native API fetches). */
  async setSessionFromSignup(sessionId, signedSessionCookie) {
    if (!sessionId && !signedSessionCookie) return;
    try {
      if (signedSessionCookie) {
        await AsyncStorage.setItem(SIGNED_SESSION_KEY, signedSessionCookie);
        sessionCookie = `nt.sid=${signedSessionCookie}`;
        if (sessionId) await AsyncStorage.setItem(SESSION_KEY, sessionId);
      } else if (sessionId) {
        await AsyncStorage.setItem(SESSION_KEY, sessionId);
        sessionCookie = `nt.sid=${sessionId}`;
      }
    } catch (e) {}
  },
  /** For WebView: pass this as Cookie header so the site sees the user as logged in. */
  getSessionCookie: () => sessionCookie,

  async register(userData) {
    const r = await fetchWithConnectionMessage(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    extractCookie(r);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.message || 'Registration failed');
    if (d.signedSessionCookie) {
      sessionCookie = `nt.sid=${d.signedSessionCookie}`;
      try {
        await AsyncStorage.setItem(SIGNED_SESSION_KEY, d.signedSessionCookie);
        if (d.sessionId) await AsyncStorage.setItem(SESSION_KEY, d.sessionId);
      } catch (e) {}
    } else if (d.sessionId) {
      sessionCookie = `nt.sid=${d.sessionId}`;
      try {
        await AsyncStorage.setItem(SESSION_KEY, d.sessionId);
      } catch (e) {}
    }
    if (d.user) {
      await offlineStorage.cacheProfile(d.user);
    }
    return d;
  },

  /** Sign in with Apple: send identity token to backend; returns { ok, user } or { needsOnboarding, pendingApple }. */
  async appleLogin({ identityToken, email, fullName }) {
    const r = await fetchWithConnectionMessage(`${BASE_URL}/api/auth/apple`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        identityToken,
        email: email || undefined,
        fullName: fullName || undefined,
      }),
    });
    extractCookie(r);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.message || 'Apple sign-in failed');
    if (d.signedSessionCookie) {
      sessionCookie = `nt.sid=${d.signedSessionCookie}`;
      try {
        await AsyncStorage.setItem(SIGNED_SESSION_KEY, d.signedSessionCookie);
        if (d.sessionId) await AsyncStorage.setItem(SESSION_KEY, d.sessionId);
      } catch (e) {}
    } else if (d.sessionId) {
      sessionCookie = `nt.sid=${d.sessionId}`;
      try {
        await AsyncStorage.setItem(SESSION_KEY, d.sessionId);
      } catch (e) {}
    }
    if (d.user) await offlineStorage.cacheProfile(d.user);
    return d;
  },

  /** Run post-registration bootstrap (chatroom auto-join, etc.). Call after register(). */
  async bootstrapAfterRegister() {
    const r = await fetch(`${BASE_URL}/api/bootstrap/after-register`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({}),
    });
    if (!r.ok) return { ok: false };
    return r.json().catch(() => ({ ok: false }));
  },

  async getEvents(city = 'Los Angeles') {
    return await fetchWithOffline(
      `${BASE_URL}/api/events?city=${encodeURIComponent(city)}`,
      { headers: getHeaders(), credentials: 'include' },
      `cached_events_${city}`,
      () => offlineStorage.getCachedEvents(city)
    );
  },

  async getTravelPlans(userId) {
    if (!userId) return [];
    try {
      const r = await fetch(`${BASE_URL}/api/travel-plans/${userId}`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!r.ok) return [];
      return await r.json();
    } catch (e) {
      return [];
    }
  },

  async getEvent(id) {
    const r = await fetch(`${BASE_URL}/api/events/${id}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!r.ok) return null;
    return r.json();
  },

  async joinEvent(eventId) {
    const r = await fetch(`${BASE_URL}/api/events/${eventId}/join`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
    });
    return r.json();
  },

  async getUsersByLocation(city, userType = 'all') {
    return await fetchWithOffline(
      `${BASE_URL}/api/users-by-location/${encodeURIComponent(city)}/${userType}`,
      { headers: getHeaders(), credentials: 'include' },
      `cached_users_${city}_${userType}`,
      () => offlineStorage.getCachedUsers(city)
    );
  },

  async getUserProfile(userId) {
    const r = await fetch(`${BASE_URL}/api/users/${userId}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!r.ok) return null;
    return r.json();
  },

  async updateProfile(userId, updates) {
    const r = await fetch(`${BASE_URL}/api/users/${userId}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    return r.json();
  },

  async getConnections(userId) {
    const r = await fetch(`${BASE_URL}/api/connections/${userId}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!r.ok) return [];
    return r.json();
  },

  async sendConnection(targetUserId) {
    const r = await fetch(`${BASE_URL}/api/connections`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ targetUserId }),
    });
    return r.json();
  },

  async getConversations(userId) {
    const r = await fetch(`${BASE_URL}/api/conversations/${userId}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!r.ok) return [];
    return r.json();
  },

  async getMessages(userId) {
    const r = await fetch(`${BASE_URL}/api/messages/${userId}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!r.ok) return [];
    return r.json();
  },

  async sendMessage(senderId, receiverId, content) {
    const r = await fetch(`${BASE_URL}/api/messages`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ senderId, receiverId, content }),
    });
    return r.json();
  },

  async getNotifications(userId) {
    const r = await fetch(`${BASE_URL}/api/notifications/${userId}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!r.ok) return [];
    return r.json();
  },

  /** Discover People feed for the Home tab. Server already sorts seeded users
   *  (aura=99) to the bottom. Optional `location` query param filters by city. */
  async getDiscoverPeople(opts = {}) {
    const params = new URLSearchParams();
    if (opts.location) params.set('location', opts.location);
    const qs = params.toString();
    const r = await fetch(`${BASE_URL}/api/users${qs ? '?' + qs : ''}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!r.ok) return [];
    return r.json();
  },

  /** "New to Nearby Traveler" horizontal scroll. Returns recently-joined users
   *  (currently filtered server-side to seeded users for social proof). */
  async getRecentlyJoined(limit = 10) {
    const r = await fetch(
      `${BASE_URL}/api/users/recently-joined?limit=${limit}&days=14`,
      { headers: getHeaders(), credentials: 'include' },
    );
    if (!r.ok) return [];
    return r.json();
  },

  /** IDs of users currently marked Available Now (used for green-dot badges). */
  async getAvailableNowIds() {
    const r = await fetch(`${BASE_URL}/api/available-now/active-ids`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!r.ok) return [];
    return r.json();
  },

  /** Full Available Now list for a city — returns array of entries with
   *  { user, isAvailable, expiresAt, activities? }. Powers AvailableNowScreen. */
  async getAvailableNowList(city) {
    if (!city) return [];
    const r = await fetch(
      `${BASE_URL}/api/available-now?city=${encodeURIComponent(city)}`,
      { headers: getHeaders(), credentials: 'include' },
    );
    if (!r.ok) return [];
    return r.json();
  },

  /** Current user's own Available Now status. */
  async getMyAvailableNowStatus() {
    const r = await fetch(`${BASE_URL}/api/available-now/my-status`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!r.ok) return { isAvailable: false };
    return r.json();
  },

  /** Mark current user as Available Now. Optional fields mirror the web POST
   *  body (city, activities, expiresInMinutes, etc.). */
  async setAvailableNow(opts = {}) {
    const r = await fetch(`${BASE_URL}/api/available-now`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(opts),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      throw new Error(text || `Could not set available (status ${r.status})`);
    }
    return r.json().catch(() => ({}));
  },

  /** Clear current user's Available Now status. */
  async clearAvailableNow() {
    const r = await fetch(`${BASE_URL}/api/available-now`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      throw new Error(text || `Could not clear available (status ${r.status})`);
    }
    return r.json().catch(() => ({}));
  },

  // Register Expo push token with the backend
  async registerPushToken(expoPushToken) {
    try {
      const r = await fetchWithConnectionMessage(`${BASE_URL}/api/users/push-token`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ expoPushToken }),
      });
      if (!r.ok) console.log('Push token registration failed:', r.status);
      else console.log('✅ Push token registered with backend');
      return r.ok;
    } catch (e) {
      console.log('Push token registration error:', e);
      return false;
    }
  },

  // Check if app is online
  async checkOnlineStatus() {
    return await offlineStorage.isOnline();
  },
};

export default api;