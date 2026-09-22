/**
 * Service Worker · TopPKB PWA
 *
 * Cache-first para assets estáticos (incluindo TODOS os 229 fotos KB + 84 vídeos KB);
 * network-first para HTML. v20.0.0 — 2026-09-22 — Badges clicáveis + preview visual em Meu Programa — + Badges clicáveis em Treinamento, preview visual do primeiro exercício
 * (82 exercícios autocompletos, self-contained em /kettlebell/).
 */

const CACHE_NAME = 'toppkb-v20';
const RUNTIME = 'toppkb-runtime-v19';

// Build da PRECACHE_URLS dinamicamente: na inicialização, faz fetch de /kettlebell-index.json
// que lista TODOS os assets.
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',

  // Páginas principais (já navegamos para elas)
  '/app/exercicios',
  '/app/periodizacao',
  '/app/preparacao',
  '/app/preparacao/nova',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        await cache.addAll(PRECACHE_URLS);
      } catch (e) {
        // Não falha o install se algum asset não existir ainda
        console.warn('[SW] precache parcial:', e);
      }
      // Tenta carregar índice de assets KB e pré-cachear
      try {
        const resp = await fetch('/kettlebell-index.json');
        if (resp.ok) {
          const urls = await resp.json();
          // Cache em chunks para não bloquear
          const CHUNK = 20;
          for (let i = 0; i < urls.length; i += CHUNK) {
            const slice = urls.slice(i, i + CHUNK);
            await cache.addAll(slice).catch((err) => {
              console.warn('[SW] chunk cache falhou:', err);
            });
          }
          console.log(`[SW] pré-cacheados ${urls.length} assets KB`);
        }
      } catch (e) {
        console.warn('[SW] sem índice de assets:', e);
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const currentCaches = [CACHE_NAME, RUNTIME];
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => !currentCaches.includes(cacheName))
          .map((cacheName) => caches.delete(cacheName)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignora outros domínios
  if (url.origin !== self.location.origin) return;

  // Ignora métodos não-GET
  if (event.request.method !== 'GET') return;

  // Network-first para HTML (sempre buscar fresh primeiro)
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(event.request);
          const cache = await caches.open(RUNTIME);
          cache.put(event.request, fresh.clone());
          return fresh;
        } catch (e) {
          const cached = await caches.match(event.request);
          return cached || caches.match('./index.html') || new Response('Offline', { status: 503 });
        }
      })(),
    );
    return;
  }

  // Cache-first para assets estáticos (incluindo /kettlebell/**)
  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;

      try {
        const fresh = await fetch(event.request);
        if (fresh.ok && (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/kettlebell/'))) {
          const cache = await caches.open(RUNTIME);
          cache.put(event.request, fresh.clone());
        }
        return fresh;
      } catch (e) {
        return new Response('Asset offline', { status: 503 });
      }
    })(),
  );
});

// Mensagens do cliente: SKIP_WAITING aplica a atualização imediatamente
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
