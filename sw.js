const CACHE_NAME = 'rms-v4-cache';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

// 安裝並快取資源
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('V4 Caching assets');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 激活並清理舊版快取
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// 攔截請求
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
