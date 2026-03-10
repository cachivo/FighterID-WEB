// Fighter ID Service Worker v10
const CACHE_VERSION = 'fighter-id-v10';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const MAX_IMAGE_CACHE = 50;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => n.startsWith('fighter-id-') && n !== STATIC_CACHE && n !== DYNAMIC_CACHE && n !== IMAGE_CACHE)
          .map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/~oauth') || url.pathname.startsWith('/auth/callback') || url.pathname.startsWith('/license/callback')) return;

  // Images — cache-first with FIFO eviction
  if (request.destination === 'image') {
    event.respondWith(imageStrategy(request));
    return;
  }

  // Static assets (JS, CSS, fonts) — cache-first
  if (request.destination === 'style' || request.destination === 'script' || request.destination === 'font') {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML pages — network-first
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // API-like requests — stale-while-revalidate
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/rest/')) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    return;
  }

  // Everything else — cache-first
  event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

async function imageStrategy(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      // FIFO eviction
      const keys = await cache.keys();
      if (keys.length >= MAX_IMAGE_CACHE) {
        await cache.delete(keys[0]);
      }
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // SVG placeholder fallback
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="#1a1a2e" width="100" height="100"/><text x="50" y="54" text-anchor="middle" fill="#666" font-size="10">Sin imagen</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
