import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      await api.restoreSession();
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
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

  // Accept username OR email in the first param (identifier)
  const login = async (identifier, password) => {
    const cleanedIdentifier = (identifier || '').trim();
    const cleanedPassword = (password || '').trim();

    if (!cleanedIdentifier || !cleanedPassword) {
      throw new Error('Missing credentials');
    }

    // Server expects "email" in body and looks up by email first, then by username.
    // So we always send the identifier (email or username) as "email".
    const payload = { email: cleanedIdentifier, password: cleanedPassword };

    // api.login throws on failure; if we get here, login succeeded
    const result = await api.login(payload);

    let fullUser = await api.getUser();
    // If session cookie didn't persist (e.g. React Native), use user from login response
    if (!fullUser?.id && result?.user) {
      fullUser = result.user;
    }
    if (fullUser) {
      setUser(fullUser);
      await AsyncStorage.setItem('user', JSON.stringify(fullUser));
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