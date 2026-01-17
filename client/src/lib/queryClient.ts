import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
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
    cachedUser = storedUser ? JSON.parse(storedUser) : null;
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
    
    const res = await fetch(url, {
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

    const res = await fetch(url, {
      credentials: "include",
      headers,
    });

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
