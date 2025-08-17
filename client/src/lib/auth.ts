import type { User } from "@shared/schema";

// Foolproof authentication storage - multiple redundant methods
const USER_STORAGE_KEYS = ['user', 'authUser', 'currentUser'];

export const authStorage = {
  getUser(): User | null {
    try {
      // Check all possible storage keys for user data
      for (const key of USER_STORAGE_KEYS) {
        const stored = localStorage.getItem(key);
        if (stored && stored !== 'undefined' && stored !== 'null') {
          const user = JSON.parse(stored);
          if (user && user.id) {
            console.log(`✅ Found user data in ${key}:`, { id: user.id, username: user.username });
            // Ensure all keys have the same data for consistency
            this.setUser(user);
            return user;
          }
        }
      }
      
      console.log('❌ No valid user data found in any storage key');
      return null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      this.clearUser();
      return null;
    }
  },

  setUser(user: User | null): void {
    console.log('🔧 Setting user in all storage keys:', user ? { id: user.id, username: user.username } : null);
    if (user) {
      // Store in all possible keys for maximum reliability
      for (const key of USER_STORAGE_KEYS) {
        localStorage.setItem(key, JSON.stringify(user));
      }
    } else {
      this.clearUser();
    }
  },

  clearUser(): void {
    console.log('🗑️ Clearing all user storage keys');
    for (const key of USER_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  },

  // Emergency user recovery - force get user from API if none found
  async forceRefreshUser(): Promise<User | null> {
    try {
      console.log('🚨 Emergency user refresh attempt');
      const response = await fetch('/api/user');
      if (response.ok) {
        const user = await response.json();
        if (user && user.id) {
          this.setUser(user);
          return user;
        }
      }
      console.log('❌ Emergency refresh failed');
      return null;
    } catch (error) {
      console.error('Emergency refresh error:', error);
      return null;
    }
  }
};