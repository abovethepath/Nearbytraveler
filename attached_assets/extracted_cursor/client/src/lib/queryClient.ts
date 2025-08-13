import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log('apiRequest called:', { method, url, hasData: !!data });
  
  // Get current user from localStorage for authorization
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  console.log('User for auth header:', user ? { id: user.id, username: user.username } : 'No user');
  
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
  
  console.log('Request headers:', headers);
  console.log('Request body length:', data ? JSON.stringify(data).length : 0);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include', // Include cookies for session authentication
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    console.log('Response received:', { status: res.status, statusText: res.statusText, ok: res.ok });
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error('Fetch error:', error);
    if (error.name === 'AbortError') {
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

    // Get current user from localStorage for authorization
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    
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
      staleTime: 5 * 60 * 1000, // 5 minutes instead of Infinity to allow fresh data
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
