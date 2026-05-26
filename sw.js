// PROSRVC Service Worker v5 — full offline support
const CACHE = 'prosrvc-v7';
const SHELL = [
  '/prosrvc/',
  '/prosrvc/index.html',
  '/prosrvc/manifest.json',
  '/prosrvc/icon-192.png',
  '/prosrvc/icon-512.png',
  '/prosrvc/icon-180.png',
  '/prosrvc/icon-152.png',
  '/prosrvc/icon-120.png',
];

// Install — cache app shell immediately, skipWaiting to activate fast
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting(); // activate immediately on install
});

// Message — skip waiting if requested by page
self.addEventListener('message', e => {
  if(e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// Activate — clear old caches, claim all clients immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // take control of all open tabs immediately
});

// Fetch — CACHE FIRST for app shell, network first for external
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Only handle GET requests from our origin
  if(e.request.method !== 'GET') return;
  if(!url.href.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) {
        // Serve from cache immediately — then update cache in background
        const fetchUpdate = fetch(e.request).then(res => {
          if(res && res.status === 200) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        }).catch(() => {});
        return cached; // return cached version instantly
      }
      // Not in cache — try network, cache result
      return fetch(e.request).then(res => {
        if(res && res.status === 200) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => caches.match('/prosrvc/index.html'));
    })
  );
});
