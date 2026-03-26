import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Helper function to get API base URL for wrapped app compatibility
// Use relative URLs (same-origin) by default so requests go to the current host
export const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  // Always use relative URLs - requests go to the same origin
  // This works for localhost, Replit, Render, and any other host
  return '';
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

let refreshInterval: ReturnType<typeof setInterval> | null = null;

// Keep-alive ping — prevents Render cold starts by hitting a lightweight
// endpoint every 5 min. No DB, no auth — just keeps the server warm.
let keepAliveInterval: ReturnType<typeof setInterval> | null = null;
function startKeepAlive() {
  if (keepAliveInterval) return;
  keepAliveInterval = setInterval(() => {
    fetch(`${getApiBaseUrl()}/api/ping`).catch(() => {});
  }, 5 * 60 * 1000);
}
function stopKeepAlive() {
  if (keepAliveInterval) { clearInterval(keepAliveInterval); keepAliveInterval = null; }
}

export function startSessionRefresh() {
  if (refreshInterval) return;
  tryRefreshSession();
  refreshInterval = setInterval(() => {
    tryRefreshSession();
  }, 30 * 60 * 1000);
  startKeepAlive();
}

export function stopSessionRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
  stopKeepAlive();
}

function hasVerifiedSession(): boolean {
  try {
    return sessionStorage.getItem("nt_session_verified") === "1";
  } catch {
    return false;
  }
}

// Cache user data to avoid localStorage parsing on every request
// CRITICAL: Check all auth storage keys - iOS/Expo may store in authUser/currentUser
// nt_cached_session is the primary key used by App.tsx (SESSION_CACHE_KEY)
const USER_STORAGE_KEYS = ['nt_cached_session', 'user', 'authUser', 'currentUser', 'travelconnect_user'];
let cachedUser: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds

function getCachedUser() {
  // Security hardening: never treat localStorage as auth unless the server session
  // has been verified in this tab. This prevents incognito/no-cookie sessions from
  // sending x-user-id headers and appearing "logged in".
  if (!hasVerifiedSession()) {
    cachedUser = null;
    cacheTimestamp = 0;
    return null;
  }

  const now = Date.now();
  if (!cachedUser || now - cacheTimestamp > CACHE_DURATION) {
    for (const key of USER_STORAGE_KEYS) {
      const stored = localStorage.getItem(key);
      if (stored && stored !== 'undefined' && stored !== 'null') {
        try {
          const user = JSON.parse(stored);
          if (user && user.id) {
            cachedUser = user;
            cacheTimestamp = now;
            return cachedUser;
          }
        } catch { /* skip invalid JSON */ }
      }
    }
    cachedUser = null;
    cacheTimestamp = now;
  }
  return cachedUser;
}

// Function to invalidate user cache (call this after login/logout)
export function invalidateUserCache() {
  cachedUser = null;
  cacheTimestamp = 0;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Only log in development
  if (import.meta.env.DEV) {
    console.log('apiRequest called:', { method, url, hasData: !!data });
  }
  
  // Use cached user data for better performance
  const user = getCachedUser();
  
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  if (user) {
    // Send only essential user data to avoid schema conflicts
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name
    };
    headers["x-user-data"] = JSON.stringify(userData);
    // Add specific headers for business subscription endpoints
    headers["x-user-id"] = user.id.toString();
    headers["x-user-type"] = user.userType || 'local';
  }
  
  // Only log in development
  if (import.meta.env.DEV) {
    console.log('Request headers:', headers);
    console.log('Request body length:', data ? JSON.stringify(data).length : 0);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    // Apply API base URL for wrapped app compatibility
    const fullUrl = url.startsWith('/') ? `${getApiBaseUrl()}${url}` : url;
    
    const doFetch = () => fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : null,
      credentials: 'include', // Include cookies for session authentication
      signal: controller.signal,
    });
    
    let res = await doFetch();
    
    clearTimeout(timeoutId);
    
    // Only log in development
    if (import.meta.env.DEV) {
      console.log('Response received:', { status: res.status, statusText: res.statusText, ok: res.ok });
    }
    
    if (res.status === 401) {
      // Try to silently refresh the session and retry the original request.
      // This restores the seamless behavior for mutations (Available Now, etc.)
      // without hard-redirecting the user on failure.
      const refreshed = await tryRefreshSession();
      if (refreshed) {
        const retryController = new AbortController();
        const retryTimeout = setTimeout(() => retryController.abort(), 30000);
        try {
          const retryRes = await fetch(fullUrl, {
            method,
            headers,
            body: data ? JSON.stringify(data) : null,
            credentials: 'include',
            signal: retryController.signal,
          });
          clearTimeout(retryTimeout);
          if (retryRes.status === 401) {
            throw new Error('401: Unauthorized');
          }
          await throwIfResNotOk(retryRes);
          return retryRes;
        } catch (retryErr) {
          clearTimeout(retryTimeout);
          if ((retryErr as Error).name === 'AbortError') {
            throw new Error('Request timed out after 30 seconds');
          }
          throw retryErr;
        }
      }
      throw new Error('401: Unauthorized');
    }
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Only log in development
    if (import.meta.env.DEV) {
      console.error('Fetch error:', error);
    }
    if ((error as Error).name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    if ((error as Error).message === 'Failed to fetch') {
      throw new Error('Unable to connect to the server. Please check your internet connection.');
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let url = queryKey[0] as string;
    
    // Handle query parameters if they exist
    if (queryKey.length > 1 && queryKey[1]) {
      const params = new URLSearchParams();
      const queryParams = queryKey[1] as Record<string, string>;
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }
    
    // Apply API base URL for wrapped app compatibility
    const fullUrl = url.startsWith('/') ? `${getApiBaseUrl()}${url}` : url;

    // Use cached user data for better performance
    const user = getCachedUser();
    
    const headers: Record<string, string> = {};
    if (user) {
      headers["x-user-id"] = user.id.toString();
      headers["x-user-type"] = user.userType || 'local';
      // Send full user data for authorization
      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name
      };
      headers["x-user-data"] = JSON.stringify(userData);
    }

    let res = await fetch(fullUrl, {
      credentials: "include",
      headers,
    });

    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw new Error('401: Unauthorized');
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: (failureCount, error: any) => {
        // Don't retry on client errors (4xx) except 429 (rate limit)
        const msg = error?.message || '';
        if (/^4\d\d/.test(msg) && !msg.startsWith('429')) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      onError: (error: any) => {
        // Global mutation error handler — log for debugging.
        // IMPORTANT: Do NOT redirect to /auth on 401. Mobile PWA users get transient
        // 401s when resuming from background (cookie not yet re-attached). The
        // apiRequest() function already retries via tryRefreshSession(). A hard redirect
        // here causes the "signed out when switching apps" bug. The auth sync in App.tsx
        // handles real session expiry gracefully without logout.
        const msg = error?.message || 'Something went wrong';
        console.error('[Mutation Error]', msg);
      },
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('NetworkError') || error?.message?.includes('Failed to fetch') || error?.message?.includes('timeout')) {
          return failureCount < 2;
        }
        return false;
      },
    },
  },
});
