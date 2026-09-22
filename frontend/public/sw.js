/**
 * Service Worker · TopPKB PWA - EMERGÊNCIA
 *
 * Network-first pra TUDO. Sem cache persistente. Apenas HTML para offline.
 * v2024.EMERGENCY - 2026-09-22 - Remove TODOS caches anteriores
 */
const CACHE_NAME = 'toppkb-emergency';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  // Limpar TODOS caches anteriores
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  // Network-first pra TUDO (sem cache de assets)
  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(event.request);
        return fresh;
      } catch (e) {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html') || new Response('Offline', { status: 503 });
        }
        return new Response('Offline', { status: 503 });
      }
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
