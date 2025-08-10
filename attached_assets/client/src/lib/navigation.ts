// Force browser cache clear for navigation fixes
export const clearBrowserCache = () => {
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
  // Force page reload without cache
  window.location.reload();
};

// SIMPLE RELIABLE BACK NAVIGATION
export const goBackProperly = (setLocation: (path: string) => void) => {
  setLocation('/discover');
};