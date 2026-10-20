// 오프라인 동작: 앱 파일 전부를 처음 한 번 받아 두고, 이후엔 인터넷 없이 연다.
// 버전을 올리면 새 파일을 받는다 (tools/stamp-sw.mjs가 빌드 때 목록·버전을 채운다).
const VERSION = 'v1.0.0-73e110381d';
const CACHE = 'chaekgalpi-' + VERSION;
const COVERS = 'chaekgalpi-covers';
const PRECACHE = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/app.js', 'js/util.js', 'js/db.js', 'js/media.js', 'js/native.js', 'js/ocr.js', 'js/barcode.js', 'js/bookapi.js', 'js/store.js', 'js/export.js',
  'js/views/library.js', 'js/views/addbook.js', 'js/views/book.js', 'js/views/capture.js', 'js/views/common.js', 'js/views/quotes.js',
  'js/views/search.js', 'js/views/stats.js', 'js/views/settings.js', 'js/views/cardimg.js',
  'fonts/GowunBatang-Regular.woff2', 'fonts/GowunBatang-Bold.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
  'vendor/capacitor/capacitor.js', 'vendor/xlsx/xlsx.mini.min.js',
  'vendor/zxing/zxing-reader.js', 'vendor/zxing/zxing_reader.wasm',
  'vendor/tesseract/tesseract.min.js', 'vendor/tesseract/worker.min.js',
  'vendor/tesseract-core/tesseract-core-lstm.wasm.js', 'vendor/tesseract-core/tesseract-core-simd-lstm.wasm.js',
  'vendor/tesseract-core/tesseract-core-relaxedsimd-lstm.wasm.js',
  'vendor/tessdata/kor.traineddata.gz', 'vendor/tessdata/eng.traineddata.gz',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE && k !== COVERS) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 앱 파일: 캐시 먼저
  if (url.origin === location.origin) {
    e.respondWith((async () => {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
        return res;
      } catch {
        if (req.mode === 'navigate') return caches.match('index.html');
        throw new Error('offline');
      }
    })());
    return;
  }
  // 책 표지 이미지(카카오·국립중앙도서관·Open Library·Google): 한 번 본 표지는 오프라인에서도 보이게
  if (req.destination === 'image') {
    e.respondWith((async () => {
      const c = await caches.open(COVERS);
      const hit = await c.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok || res.type === 'opaque') c.put(req, res.clone());
        return res;
      } catch { return hit || Response.error(); }
    })());
  }
});
