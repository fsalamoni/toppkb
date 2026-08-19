// Service Worker do Top Pickleball 50+
// Estratégia: network-first, fallback cache
// - API calls: sempre network
// - Assets estáticos: cache-first
// - HTML (rotas SPA): network-first, fallback index.html

const CACHE_NAME = 'toppkb-v1';
const STATIC_ASSETS = ['/favicon.svg', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignore failures (some assets may not exist in dev)
      });
    }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== 'GET') return;

  // Skip Firebase/Google APIs — sempre network
  if (
    url.host.includes('firebaseio.com') ||
    url.host.includes('googleapis.com') ||
    url.host.includes('firebaseapp.com') ||
    url.host.includes('gstatic.com') ||
    url.host.includes('cloudfunctions.net') ||
    url.host.includes('firebaseinstallations') ||
    url.host.includes('identitytoolkit') ||
    url.host.includes('google.com')
  ) {
    return;
  }

  // Navegação (HTML / SPA): network-first
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a versão atual
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/'))),
    );
    return;
  }

  // Assets estáticos (JS, CSS, imagens): cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Cache para próxima vez
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Fallback: nada
        return new Response('Offline', { status: 503 });
      });
    }),
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();

  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'toppkb',
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    data: data.data || {},
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Top Pickleball', options),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/app/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    }),
  );
});
