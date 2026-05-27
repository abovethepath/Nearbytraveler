// Nearby Traveler PWA Service Worker - v8
const CACHE_NAME = 'nt-pwa-v9';
const CORE_ASSETS = [
  '/',
  '/manifest.json',
];

// Install: cache core assets, clear old caches
self.addEventListener('install', function(event) {
  console.log('SW: Installing v8');
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; }).map(function(n) { return caches.delete(n); })
      );
    }).then(function() {
      return caches.open(CACHE_NAME).then(function(cache) {
        return cache.addAll(CORE_ASSETS).catch(function() {});
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate: claim all clients
self.addEventListener('activate', function(event) {
  console.log('SW: Activating v8');
  event.waitUntil(self.clients.claim());
});

// Fetch: network-first with cache fallback for navigations and static assets
self.addEventListener('fetch', function(event) {
  var request = event.request;

  // Skip non-GET, API calls, and WebSocket upgrades
  if (request.method !== 'GET') return;
  var url = request.url;
  if (url.includes('/api/') || url.includes('/ws') || url.includes('socket')) return;

  // For navigation requests (HTML pages): network first, fall back to cached /
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(function(response) {
        // Cache the latest HTML
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(request, clone); });
        return response;
      }).catch(function() {
        return caches.match(request).then(function(cached) {
          return cached || caches.match('/');
        });
      })
    );
    return;
  }

  // For static assets (JS, CSS, images): network first, cache fallback
  if (url.match(/\.(js|css|png|jpg|jpeg|svg|woff2?|ttf|ico)(\?|$)/)) {
    event.respondWith(
      fetch(request).then(function(response) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(request, clone); });
        return response;
      }).catch(function() {
        return caches.match(request);
      })
    );
    return;
  }
});

// Push: show notification when a push message is received
self.addEventListener('push', function(event) {
  var data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Nearby Traveler', body: event.data ? event.data.text() : 'You have a new notification' };
  }

  var title = data.title || 'Nearby Traveler';
  var options = {
    body: data.body || data.message || 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    tag: data.tag || 'nt-notification',
    data: {
      url: data.url || data.link || '/',
    },
    actions: data.actions || [],
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click: open the app to the relevant URL
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  var url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // If app is already open, focus it and navigate
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Otherwise open a new window
      return clients.openWindow(url);
    })
  );
});
