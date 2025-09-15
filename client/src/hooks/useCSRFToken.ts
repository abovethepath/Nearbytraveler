import { useState, useEffect } from 'react';

interface CSRFTokenResponse {
  success: boolean;
  csrfToken: string;
}

interface CSRFTokenHook {
  token: string | null;
  loading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
}

// Hook to manage CSRF tokens for secure admin operations
export function useCSRFToken(): CSRFTokenHook {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }
      
      const data: CSRFTokenResponse = await response.json();
      
      if (data.success && data.csrfToken) {
        setToken(data.csrfToken);
      } else {
        throw new Error('Invalid CSRF token response');
      }
    } catch (err: any) {
      console.error('🔒 Failed to fetch CSRF token:', err);
      setError(err.message);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch token on mount
  useEffect(() => {
    fetchToken();
  }, []);

  return {
    token,
    loading,
    error,
    refreshToken: fetchToken
  };
}

// Helper function to make CSRF-protected requests
export async function makeCSRFRequest(url: string, options: RequestInit = {}, csrfToken: string): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('X-CSRF-Token', csrfToken);
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });
}