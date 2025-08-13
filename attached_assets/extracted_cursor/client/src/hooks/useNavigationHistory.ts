import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

// Simple navigation history tracking for SPA
let navigationHistory: string[] = [];
let historyIndex = -1;

export function useNavigationHistory() {
  const [location] = useLocation();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Add current location to history if it's different from the last entry
    if (navigationHistory[historyIndex] !== location) {
      // Remove any entries after current index (for new navigation paths)
      navigationHistory = navigationHistory.slice(0, historyIndex + 1);
      navigationHistory.push(location);
      historyIndex = navigationHistory.length - 1;
    }
    
    setCanGoBack(historyIndex > 0);
  }, [location]);

  const goBack = (fallbackPath: string = '/') => {
    if (historyIndex > 0) {
      historyIndex--;
      const previousPath = navigationHistory[historyIndex];
      // Use browser's back() which should work correctly
      window.history.back();
      return true;
    } else {
      // No history available, use fallback
      window.location.href = fallbackPath;
      return false;
    }
  };

  const getCurrentPath = () => navigationHistory[historyIndex] || location;
  const getPreviousPath = () => navigationHistory[historyIndex - 1] || null;

  return {
    canGoBack,
    goBack,
    getCurrentPath,
    getPreviousPath,
    history: navigationHistory.slice(0, historyIndex + 1)
  };
}