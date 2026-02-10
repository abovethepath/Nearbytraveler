const BASE_URL = 'https://nearbytraveler.org';

let sessionCookie = null;

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (sessionCookie) {
    headers['Cookie'] = sessionCookie;
  }
  return headers;
};

const extractCookie = (response) => {
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    sessionCookie = setCookie.split(';')[0];
  }
};

const api = {
  async login(email, password) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    extractCookie(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
  },

  async getUser() {
    const res = await fetch(`${BASE_URL}/api/auth/user`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) return null;
    return res.json();
  },

  async logout() {
    await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
    });
    sessionCookie = null;
  },

  async register(userData) {
    const res = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    extractCookie(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    return data;
  },

  async getEvents(city = 'Los Angeles') {
    const res = await fetch(`${BASE_URL}/api/events?city=${encodeURIComponent(city)}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) return [];
    return res.json();
  },

  async getEvent(id) {
    const res = await fetch(`${BASE_URL}/api/events/${id}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) return null;
    return res.json();
  },

  async joinEvent(eventId) {
    const res = await fetch(`${BASE_URL}/api/events/${eventId}/join`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
    });
    return res.json();
  },

  async getUsersByLocation(city, userType = 'all') {
    const res = await fetch(`${BASE_URL}/api/users-by-location/${encodeURIComponent(city)}/${userType}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) return [];
    return res.json();
  },

  async getUserProfile(userId) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) return null;
    return res.json();
  },

  async updateProfile(userId, updates) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async getConnections(userId) {
    const res = await fetch(`${BASE_URL}/api/connections/${userId}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) return [];
    return res.json();
  },

  async sendConnection(targetUserId) {
    const res = await fetch(`${BASE_URL}/api/connections`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ targetUserId }),
    });
    return res.json();
  },

  async getConversations(userId) {
    const res = await fetch(`${BASE_URL}/api/conversations/${userId}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) return [];
    return res.json();
  },

  async getMessages(userId) {


@'
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const fullUser = await api.getUser();
        if (fullUser && fullUser.id) {
          setUser(fullUser);
        } else {
          await AsyncStorage.removeItem('user');
          setUser(null);
        }
      }
    } catch (e) {
      console.log('Auth check failed:', e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const result = await api.login(email, password);
    if (result.ok) {
      const fullUser = await api.getUser();
      if (fullUser) {
        setUser(fullUser);
        await AsyncStorage.setItem('user', JSON.stringify(fullUser));
      }
    }
    return result;
  };

  const logout = async () => {
    await api.logout();
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
