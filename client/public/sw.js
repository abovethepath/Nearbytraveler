// CRITICAL Mobile Cache Busting Service Worker - v6-20251026
const CACHE_NAME = 'mobile-layout-v6-20251026-LANDING-STANDARDIZE';

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
  event.respondWith(
    fetch(event.request, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  );
});