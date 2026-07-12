const CACHE_NAME = 'patch-sampler-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
  'https://cdn.jsdelivr.net/gh/fonts-archive/NanumGothic/NanumGothic.ttf',
  'https://cdn.jsdelivr.net/gh/fonts-archive/NanumGothic/NanumGothicBold.ttf'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const results = await Promise.allSettled(ASSETS.map((url) => cache.add(url)));
      results.forEach((r, i) => {
        if(r.status === 'rejected') console.warn('precache 실패:', ASSETS[i], r.reason);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 캐시 우선, 없으면 네트워크에서 가져온 뒤 캐시에 저장 (한글 폰트, jsPDF 등 CDN 리소스도 최초 1회 이후 오프라인 재사용 가능)
self.addEventListener('fetch', (event) => {
  if(event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if(cached) return cached;
      return fetch(event.request).then((response) => {
        if(response && response.status === 200){
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
