const CACHE_NAME = 'aryan-portfolio-v4';

// Assets to cache on install
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/style-switcher.css',
  '/css/skins/color-1.css',
  '/css/skins/color-2.css',
  '/css/skins/color-3.css',
  '/css/skins/color-4.css',
  '/css/skins/color-5.css',
  '/js/script.js',
  '/js/style-switcher.js',
  '/js/articles.json',
  '/images/favicon (24).ico',
  '/images/aryan-tux-image.jpg',
  '/images/icon-180.png',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/images/screenshot-wide.svg',
  '/images/screenshot-mobile.svg',
  '/images/projects/p1.PNG',
  '/images/projects/p2.PNG',
  '/images/projects/p3.PNG',
  '/images/projects/p4.PNG',
  '/images/projects/p5.PNG',
  '/images/projects/p6.PNG',
  '/images/projects/p7.PNG',
  '/images/projects/p8.png',
  '/images/projects/p9.PNG',
  '/images/projects/p10.PNG',
  '/images/projects/p11.png',
  '/images/projects/p12.png',
  '/manifest.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fall back to network
// Use network-first for articles.json to always get fresh content
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Network-first strategy for articles.json
  if (url.pathname.endsWith('articles.json')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Fall back to cache if offline
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first strategy for other assets
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response as it can only be consumed once
            const responseToCache = response.clone();

            // Cache the fetched resource
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If both cache and network fail, return offline fallback for HTML pages
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
          });
      })
  );
});
