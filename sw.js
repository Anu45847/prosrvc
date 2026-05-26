const CACHE_NAME = 'prosrvc-v3';
const URLS_TO_CACHE = [
  '/prosrvc/',
  '/prosrvc/index.html',
  '/prosrvc/manifest.json',
  '/prosrvc/icon-192.png',
  '/prosrvc/icon-512.png',
  '/prosrvc/icon-180.png'
];

self.addEventListener('install', event => {
  console.log('SW installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW caching files');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(err => console.log('Cache failed:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('SW activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        return fetch(event.request)
          .then(res => {
            if (!res || res.status !== 200 || res.type !== 'basic') return res;
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            return res;
          })
          .catch(() => caches.match('/prosrvc/index.html'));
      })
  );
});
