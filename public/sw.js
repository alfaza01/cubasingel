const CACHE_NAME = 'kasir-cuba-cache-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/logo-c.svg'
];

// Proses Install Service Worker
self.addEventListener('install', event => {
  self.skipWaiting(); // Make sure new SW takes over immediately

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Membuka cache KASIR CUBA');
        return cache.addAll(urlsToCache).catch(err => {
          console.warn('Gagal memproses beberapa cache, melanjutkan instalasi PWA:', err);
        });
      })
  );
});

// Proses Aktivasi & Pembersihan Cache Lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Listener untuk pesan pembaruan (Skip Waiting)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Proses Fetch agar aplikasi bisa berjalan offline dan memenuhi syarat install PWA
self.addEventListener('fetch', event => {
  // Hanya proses methode GET, lupakan yang lain
  if (event.request.method !== 'GET') return;
  // Lewati request ke extention atau api diluar origin utama
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return if it's cached
        if (response) {
          return response;
        }

        // Try to fetch from network
        return fetch(event.request)
          .then(networkResponse => {
            // Optional: Clone and cache the new response if it's a valid 200 response
            return networkResponse;
          })
          .catch(err => {
            // IF fetch fails (e.g., offline) and the request is a navigation to a page, fallback to index.html
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            throw err;
          });
      })
  );
});
