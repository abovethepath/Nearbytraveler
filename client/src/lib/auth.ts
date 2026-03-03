import type { User } from "@shared/schema";

// Auth is cookie/session-based.
// Do NOT persist auth identity in localStorage (can leak into incognito and outlive cookies).
// We keep the key list only to support cleanup on explicit logout.
const USER_STORAGE_KEYS = ["user", "authUser", "currentUser", "current_user", "travelconnect_user"];

export const authStorage = {
  getUser(): User | null {
    // Intentionally disabled: session cookie is the only source of truth.
    return null;
  },

  setUser(user: User | null): void {
    // Intentionally disabled: never persist auth identity in localStorage.
    if (!user) this.clearUser();
  },

  clearUser(): void {
    for (const key of USER_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  },

  // Emergency user recovery - force get user from API if none found
  async forceRefreshUser(): Promise<User | null> {
    try {
      const response = await fetch("/api/auth/user", { credentials: "include" });
      if (response.ok) {
        const user = await response.json();
        if (user && user.id) {
          return user;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }
};