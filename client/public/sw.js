// Nearby Traveler Service Worker - v10 (push-only; no fetch/cache handling)
// All fetch interception and app-shell caching were removed to stop serving a
// stale shell on iOS Safari. This worker now ONLY handles web push. Existing
// clients still running the old caching worker replace it on next load (version
// bumped below), and the activate handler purges every cache they left behind.
const SW_VERSION = 'nt-sw-v10';

// Install: take over immediately, no asset pre-caching
self.addEventListener('install', function(event) {
  console.log('SW: Installing ' + SW_VERSION + ' (push-only)');
  self.skipWaiting();
});

// Activate: delete ALL old caches (purges the stale app shell) and claim clients
self.addEventListener('activate', function(event) {
  console.log('SW: Activating ' + SW_VERSION);
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(n) { return caches.delete(n); }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// NOTE: intentionally NO 'fetch' listener. Without one, this worker never
// intercepts navigations or assets, so the network/HTTP cache serves pages
// normally and the stale app shell can no longer be served.

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
