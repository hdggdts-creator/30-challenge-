/**
 * Service Worker for "تحدي الثلاثين" PWA
 * Version: tahaddi-v11
 */

const CACHE_NAME = 'tahaddi-v11';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './questions.js',
  './questions-extra.js',
  './questions-new.js',
  './questions-pack3.js',
  './questions-extra-5.js',
  './questions-extra-6.js',
  './assets/bg-intro-dark-wide.webp',
  './assets/bg-intro-dark-tall.webp',
  './assets/bg-intro-light-wide.webp',
  './assets/bg-intro-light-tall.webp',
  './tahadi-al-thalatheen.html'
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
            if (networkResponse.status === 200) {
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

  // استراتيجية Cache-First لباقي الموارد الثابتة مع الرجوع للشبكة
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // تخزين نسخة من الموارد المحلية الصالحة تلقائياً
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        // في حالة عدم توفر الشبكة
        if (event.request.destination === 'image') {
          return caches.match('./icon.svg');
        }
      });
    })
  );
});
