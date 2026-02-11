import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedCookie = await AsyncStorage.getItem('sessionCookie');
      if (storedCookie) {
        api.setSessionCookie(storedCookie);
      }
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        const fullUser = await api.getUser();
        if (fullUser && fullUser.id) {
          setUser(fullUser);
          await AsyncStorage.setItem('user', JSON.stringify(fullUser));
        } else {
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('sessionCookie');
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
      const cookie = api.getSessionCookie();
      if (cookie) {
        await AsyncStorage.setItem('sessionCookie', cookie);
      }
      const fullUser = await api.getUser();
      if (fullUser) {
        setUser(fullUser);
        await AsyncStorage.setItem('user', JSON.stringify(fullUser));
      }
    }
    return result;
  };

  const register = async (userData) => {
    const result = await api.register(userData);
    if (result.user || result.ok) {
      const cookie = api.getSessionCookie();
      if (cookie) {
        await AsyncStorage.setItem('sessionCookie', cookie);
      }
      const fullUser = result.user || await api.getUser();
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
    await AsyncStorage.removeItem('sessionCookie');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, setUser, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
