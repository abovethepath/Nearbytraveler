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

let sessionRecoveryInProgress: Promise<boolean> | null = null;

async function attemptSessionRecovery(): Promise<boolean> {
  if (sessionRecoveryInProgress) return sessionRecoveryInProgress;
  
  sessionRecoveryInProgress = (async () => {
    try {
      const storedUser = localStorage.getItem('user') || localStorage.getItem('travelconnect_user');
      if (!storedUser) return false;
      
      let user;
      try { user = JSON.parse(storedUser); } catch { return false; }
      if (!user?.id) return false;

      if (!user?.email && !user?.username) {
        console.log('❌ Session recovery skipped: no email or username for identity verification');
        return false;
      }

      console.log('🔄 Auto-recovering session for:', user.username);
      const response = await fetch('/api/auth/recover-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: user.id, email: user.email, username: user.username })
      });
      
      if (response.ok) {
        const recoveredUser = await response.json();
        if (recoveredUser?.id && String(recoveredUser.id) !== String(user.id)) {
          console.log('⚠️ Session recovery returned different user! Clearing stale data.');
          localStorage.removeItem('user');
          localStorage.removeItem('travelconnect_user');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('authUser');
          return false;
        }
        console.log('✅ Session auto-recovered successfully for:', recoveredUser?.username);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      sessionRecoveryInProgress = null;
    }
  })();
  
  return sessionRecoveryInProgress;
}

// Cache user data to avoid localStorage parsing on every request
let cachedUser: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds

function getCachedUser() {
  const now = Date.now();
  if (!cachedUser || now - cacheTimestamp > CACHE_DURATION) {
    // Check both localStorage keys for consistency - some components use 'user', others use 'travelconnect_user'
    const storedUser = localStorage.getItem('user') || localStorage.getItem('travelconnect_user');
    try { cachedUser = storedUser ? JSON.parse(storedUser) : null; } catch { cachedUser = null; }
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
    
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : null,
      credentials: 'include', // Include cookies for session authentication
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Only log in development
    if (import.meta.env.DEV) {
      console.log('Response received:', { status: res.status, statusText: res.statusText, ok: res.ok });
    }
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Only log in development
    if (import.meta.env.DEV) {
      console.error('Fetch error:', error);
    }
    if ((error as Error).name === 'AbortError') {
      throw new Error('Request timed out after 30 seconds');
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

    // If 401 and we have stored user data, try session recovery then retry
    if (res.status === 401 && user) {
      const recovered = await attemptSessionRecovery();
      if (recovered) {
        res = await fetch(fullUrl, {
          credentials: "include",
          headers,
        });
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
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
      staleTime: 30 * 1000, // 30 seconds - fast refresh for profile updates
      gcTime: 5 * 60 * 1000, // 5 minutes cache time
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 429 (rate limit)
        if (error?.message?.includes('4') && !error?.message?.includes('429')) {
          return false;
        }
        return failureCount < 2; // Retry up to 2 times for production
      },
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Retry mutations on network errors only
        if (error?.message?.includes('NetworkError') || error?.message?.includes('timeout')) {
          return failureCount < 2;
        }
        return false;
      },
    },
  },
});
