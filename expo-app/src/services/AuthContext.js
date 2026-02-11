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
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const fullUser = await api.getUser();
        if (fullUser && fullUser.id) { setUser(fullUser); }
        else { await AsyncStorage.removeItem('user'); setUser(null); }
      }
    } catch (e) { console.log('Auth check failed:', e); setUser(null); }
    finally { setLoading(false); }
  };

  const login = async (email, password) => {
    const result = await api.login(email, password);
    if (result.ok) {
      const fullUser = await api.getUser();
      if (fullUser) { setUser(fullUser); await AsyncStorage.setItem('user', JSON.stringify(fullUser)); }
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
