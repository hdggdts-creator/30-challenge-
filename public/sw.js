/**
 * Service Worker for "تحدي الثلاثين" PWA
 * Version: tahaddi-v5
 */

const CACHE_NAME = 'tahaddi-v5';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './questions-1.js',
  './questions-2.js',
  './questions.js',
  './questions-extra.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // استراتيجية Network-First لطلبات صفحات التنقل HTML لضمان وصول التحديثات فوراً
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return networkResponse;
        })
        .catch(() => {
          return caches.match('./') || caches.match('./index.html');
        })
    );
    return;
  }

  // استراتيجية Stale-While-Revalidate لخطوط Google Fonts
  if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cachedResponse);
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // استراتيجية Cache-First مع العودة للشبكة للملفات الثابتة
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
