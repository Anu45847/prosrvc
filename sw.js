// PROSRVC Service Worker v4 — auto-update enabled
const CACHE_NAME = 'prosrvc-v4';
const URLS_TO_CACHE = [
  '/prosrvc/',
  '/prosrvc/index.html',
  '/prosrvc/manifest.json',
  '/prosrvc/icon-192.png',
  '/prosrvc/icon-512.png',
  '/prosrvc/icon-180.png'
];

// Install — cache all files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .catch(err => console.log('Cache failed:', err))
  );
  // Do NOT skipWaiting here — wait for SKIP_WAITING message
});

// Message from page — skip waiting and activate immediately
self.addEventListener('message', event => {
  if(event.data && event.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});

// Activate — clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('Deleting old cache:', key);
          return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch — network first, cache fallback
self.addEventListener('fetch', event => {
  // Skip non-GET and cross-origin requests
  if(event.request.method !== 'GET') return;
  if(!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(res => {
        // Cache fresh response
        if(res && res.status === 200){
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(event.request)
          .then(cached => cached || caches.match('/prosrvc/index.html'));
      })
  );
});
