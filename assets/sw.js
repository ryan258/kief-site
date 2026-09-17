/* Lightweight offline service worker for Kief companion tabletop use */
const CACHE_PREFIX = 'kief-site-';
// Rendered by Hugo (resources.ExecuteAsTemplate): each build's fingerprinted assets name a new cache, so old ones are dropped on activate.
const CACHE_NAME = CACHE_PREFIX + '{{ .version }}';

const PRECACHE_URLS = JSON.parse('{{ .assets | jsonify }}');

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      // Only clean up older caches belonging strictly to this app's namespace
      return Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // HTML navigation requests: Network first, fall back to cached page
  if (request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = (await caches.match(PRECACHE_URLS[0])) || (await caches.match('./')) || (await caches.match('/'));
          if (fallback) return fallback;
          return new Response('Offline - companion dashboard not yet cached', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
    return;
  }

  // Static assets: Cache first, update in background (stale-while-revalidate)
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => null);

      return cached || networkFetch;
    })
  );
});
