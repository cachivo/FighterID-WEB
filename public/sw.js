// Fighter ID Service Worker — kill switch (v12)
// Replaces previous app-shell SWs (v1..v11). On next visit it cleans
// Fighter ID caches and unregisters itself so future requests go
// straight to the network. This eliminates stale caches that were
// interfering with Supabase auth requests.

function isFighterIdCache(name) {
  return typeof name === 'string' && name.startsWith('fighter-id-');
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const names = await caches.keys();
        await Promise.allSettled(
          names.filter(isFighterIdCache).map((n) => caches.delete(n))
        );
        await self.clients.claim();
        const clients = await self.clients.matchAll({ type: 'window' });
        await Promise.allSettled(clients.map((c) => c.navigate(c.url)));
      } finally {
        await self.registration.unregister();
      }
    })()
  );
});

// Pass-through fetch: never intercept anything.
self.addEventListener('fetch', () => {});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
