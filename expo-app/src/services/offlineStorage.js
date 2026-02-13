import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = {
  USERS: 'cached_users',
  EVENTS: 'cached_events',
  MESSAGES: 'cached_messages',
  PROFILE: 'cached_profile',
  LAST_SYNC: 'last_sync_time',
};

const offlineStorage = {
  // Save data to cache
  async cacheData(key, data) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
      return true;
    } catch (error) {
      console.error('Cache save error:', error);
      return false;
    }
  },

  // Get cached data
  async getCachedData(key) {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  },

  // Cache users
  async cacheUsers(users, city) {
    const key = `${CACHE_KEYS.USERS}_${city}`;
    return await this.cacheData(key, users);
  },

  // Get cached users
  async getCachedUsers(city) {
    const key = `${CACHE_KEYS.USERS}_${city}`;
    return await this.getCachedData(key);
  },

  // Cache events
  async cacheEvents(events, city) {
    const key = `${CACHE_KEYS.EVENTS}_${city}`;
    return await this.cacheData(key, events);
  },

  // Get cached events
  async getCachedEvents(city) {
    const key = `${CACHE_KEYS.EVENTS}_${city}`;
    return await this.getCachedData(key);
  },

  // Cache user profile
  async cacheProfile(profile) {
    return await this.cacheData(CACHE_KEYS.PROFILE, profile);
  },

  // Get cached profile
  async getCachedProfile() {
    return await this.getCachedData(CACHE_KEYS.PROFILE);
  },

  // Check if online
  async isOnline() {
    try {
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        timeout: 5000 
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  // Get last sync time
  async getLastSyncTime() {
    return await this.getCachedData(CACHE_KEYS.LAST_SYNC);
  },

  // Clear all cache
  async clearCache() {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  },
};

export default offlineStorage;