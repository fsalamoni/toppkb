// Service Worker do Top Pickleball 50+
// Estratégia (prioriza SEMPRE ter a versão certa, nunca ficar preso no velho):
// - Navegação (HTML) e scripts/estilos: network-first. Só cai no cache se offline.
// - Imagens / ícones / fontes: cache-first (são versionados/estáticos).
// - Nunca devolve um 503 falso para JS/CSS (isso quebraria o import() dos chunks).

const CACHE_NAME = 'toppkb-v3';
const STATIC_ASSETS = ['/favicon.svg', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {})),
  );
  // Ativa a nova versão imediatamente, sem esperar as abas fecharem.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

// Permite que a página force a atualização do SW.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isStaticAsset(url) {
  return /\.(png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot)$/i.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Terceiros (Firebase / Google / etc.): não intercepta, deixa a rede cuidar.
  if (url.origin !== self.location.origin) return;

  // Imagens, ícones e fontes: cache-first (estáticos).
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res && res.ok) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // HTML, JS, CSS e o resto do mesmo domínio: network-first.
  // Isso garante que um deploy novo SEMPRE vença o cache. Só usa o cache
  // como fallback quando a rede realmente falha (offline). Importante:
  // deixamos o erro de rede propagar para JS/CSS (nada de 503 falso), para
  // que o import() dos chunks rejeite e o app possa se recuperar/recarregar.
  // Navegação (HTML): busca sempre da rede sem passar pelo cache HTTP,
  // para garantir um index.html novo (com os hashes de chunk atuais).
  const fetchOpts = request.mode === 'navigate' ? { cache: 'no-store' } : undefined;

  event.respondWith(
    fetch(request, fetchOpts)
      .then((res) => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Navegação offline sem cache específico → tenta o app shell.
        if (request.mode === 'navigate') {
          const shell = await caches.match('/index.html') || await caches.match('/');
          if (shell) return shell;
        }
        throw new Error('offline');
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
