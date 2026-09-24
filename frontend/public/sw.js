/**
 * Service Worker · TopPKB PWA - CACHE ESTRATÉGICO
 *
 * v2 — Sprint 72
 * - Network-first pra páginas (app shell sempre fresco)
 * - Cache-first pra imagens/avatares/vídeos (assets grandes, mudam pouco)
 * - Cache-first pra SW/JS/CSS (precisam estar disponíveis)
 * - Offline fallback com página de offline
 */
const CACHE_VERSION = 'v2-20260924';
const RUNTIME_CACHE = `toppkb-runtime-${CACHE_VERSION}`;
const APP_SHELL_CACHE = `toppkb-shell-${CACHE_VERSION}`;
const IMAGE_CACHE = `toppkb-images-${CACHE_VERSION}`;
const VIDEO_CACHE = `toppkb-videos-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// === ASSETS PARA CACHE NA INSTALAÇÃO ===
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
];

// === HELPERS ===
function isImageAsset(url) {
  return /\.(png|jpg|jpeg|gif|webp|svg)$/.test(url.pathname);
}

function isVideoAsset(url) {
  return /\.(mp4|webm|mov)$/.test(url.pathname);
}

function isJSAsset(url) {
  return /\.(js|mjs|ts|tsx|jsx)$/.test(url.pathname);
}

function isCSSAsset(url) {
  return /\.css$/.test(url.pathname);
}

function isNavigation(url) {
  return url.mode === 'navigate' || (url.method === 'GET' && url.headers.get('accept')?.includes('text/html'));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      await cache.addAll(PRECACHE_URLS);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Limpar caches antigos
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) =>
            !cacheName.startsWith('toppkb-') ||
            ![APP_SHELL_CACHE, IMAGE_CACHE, VIDEO_CACHE, RUNTIME_CACHE].includes(cacheName),
          )
          .map((cacheName) => caches.delete(cacheName)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  // === NAVEGAÇÃO (HTML) → NETWORK-FIRST com fallback offline.html ===
  if (isNavigation(url)) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(event.request);
          // Cache em background
          const cache = await caches.open(APP_SHELL_CACHE);
          cache.put(event.request, fresh.clone());
          return fresh;
        } catch (e) {
          // Tenta cache, depois offline.html
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return caches.match(OFFLINE_URL) || new Response('Offline', { status: 503 });
        }
      })(),
    );
    return;
  }

  // === IMAGENS → CACHE-FIRST ===
  if (isImageAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        try {
          const fresh = await fetch(event.request);
          if (fresh.ok) {
            const cache = await caches.open(IMAGE_CACHE);
            cache.put(event.request, fresh.clone());
          }
          return fresh;
        } catch (e) {
          // Fallback: 1x1 transparent PNG
          return new Response(
            new Uint8Array([
              0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
              0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
              0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
              0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
              0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41,
              0x54, 0x08, 0x99, 0x63, 0x00, 0x01, 0x00, 0x00,
              0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
              0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
              0x42, 0x60, 0x82,
            ]),
            { status: 200, headers: { 'Content-Type': 'image/png' } },
          );
        }
      })(),
    );
    return;
  }

  // === VÍDEOS → CACHE-FIRST (range requests suportados) ===
  if (isVideoAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        try {
          const fresh = await fetch(event.request);
          if (fresh.ok) {
            const cache = await caches.open(VIDEO_CACHE);
            cache.put(event.request, fresh.clone());
          }
          return fresh;
        } catch (e) {
          return new Response('Offline', { status: 503 });
        }
      })(),
    );
    return;
  }

  // === JS/CSS → STALE-WHILE-REVALIDATE ===
  if (isJSAsset(url) || isCSSAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(event.request);
        const fetchPromise = fetch(event.request).then((fresh) => {
          if (fresh.ok) {
            const cache = caches.open(RUNTIME_CACHE);
            cache.then((c) => c.put(event.request, fresh.clone()));
          }
          return fresh;
        }).catch((e) => cached || new Response('Offline', { status: 503 }));
        return cached || fetchPromise;
      })(),
    );
    return;
  }

  // === OUTROS → NETWORK-FIRST ===
  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(event.request);
        return fresh;
      } catch (e) {
        const cached = await caches.match(event.request);
        return cached || new Response('Offline', { status: 503 });
      }
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Permite cliente pedir cache de URL específica (prefetch)
  if (event.data?.type === 'CACHE_URL') {
    const url = event.data.url;
    if (url) {
      caches.open(RUNTIME_CACHE).then((cache) => cache.add(url));
    }
  }
});
