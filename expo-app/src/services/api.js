import AsyncStorage from '@react-native-async-storage/async-storage';
import offlineStorage from './offlineStorage';
import { BASE_URL } from '../config';

const SESSION_KEY = 'nt_session_id';

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
    const sid = await AsyncStorage.getItem(SESSION_KEY);
    if (sid) sessionCookie = `nt.sid=${sid}`;
    else sessionCookie = null;
  } catch (e) {
    sessionCookie = null;
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

    // React Native: server returns sessionId in body; persist and send as Cookie on future requests
    if (d.sessionId) {
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
    } catch (e) {}
    await offlineStorage.clearCache();
  },

  restoreSession,
  /** Store session from WebView signup so Messages/API work in native tabs. */
  async setSessionFromSignup(sessionId) {
    if (!sessionId) return;
    try {
      await AsyncStorage.setItem(SESSION_KEY, sessionId);
      sessionCookie = `nt.sid=${sessionId}`;
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
    if (d.sessionId) {
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
    if (d.sessionId) {
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

  async sendMessage(receiverId, content) {
    const r = await fetch(`${BASE_URL}/api/messages`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ receiverId, content }),
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

  // Check if app is online
  async checkOnlineStatus() {
    return await offlineStorage.isOnline();
  },
};

export default api;