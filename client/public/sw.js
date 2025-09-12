// CRITICAL Mobile Cache Busting Service Worker - v4-20250705
const CACHE_NAME = 'mobile-layout-v4-20250705-CRITICAL-CHANGES';

self.addEventListener('install', function(event) {
  console.log('SW: Installing cache-busting v3');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  console.log('SW: Activating cache-busting v3');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
  // CRITICAL: Never intercept API calls - let them go directly to server
  if (event.request.url.includes('/api/')) {
    return; // Don't intercept API calls at all
  }
  
  event.respondWith(
    fetch(event.request, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  );
});