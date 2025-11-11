// CRITICAL Mobile Cache Busting Service Worker - v7-20251111
const CACHE_NAME = 'whatsapp-chat-unified-v7-20251111';

self.addEventListener('install', function(event) {
  console.log('SW: Installing WHATSAPP CHAT v7-20251111');
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
  console.log('SW: Activating WHATSAPP CHAT v7-20251111');
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