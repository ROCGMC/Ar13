const CACHE_NAME = 'nfc-inventory-v1';
const urlsToCache = [
  './', // 快取根目錄，確保 index.html 被快取
  './index.html',
  './manifest.json',
  './sw.js',
  './icon.png' // 確保你的 icon.png 存在且路徑正確
];

// 安裝 Service Worker 並快取所有資源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Cache addAll failed', err))
  );
});

// 攔截網路請求，從快取中提供資源
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果在快取中找到，就直接返回
        if (response) {
          return response;
        }
        // 否則就去網路請求
        return fetch(event.request);
      })
  );
});

// 啟用 Service Worker 時，清理舊的快取
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
    })
  );
});
