// Prefetched user data from card clicks — used by profile page to render hero instantly
// without waiting for the API bundle response (eliminates avatar flash during navigation).
export const prefetchedNav: {
  userId: number | null;
  profileImage?: string | null;
  username?: string;
  avatarGradient?: string | null;
  avatarColor?: string | null;
} = { userId: null };

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