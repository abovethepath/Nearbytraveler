// Service Worker for cache busting
const CACHE_NAME = 'nearby-traveler-v' + Date.now();

self.addEventListener('install', (event) => {
  console.log('SW: Installing new service worker, cache bust version:', CACHE_NAME);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('SW: Activating service worker, clearing old caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('SW: Taking control of all pages');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Force fresh fetch for main app files
  if (event.request.url.includes('App.tsx') || event.request.url.includes('main.tsx')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
    );
    return;
  }
  
  // Default fetch for other resources
  event.respondWith(fetch(event.request));
});