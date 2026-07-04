const CACHE_NAME = 'munir-tools-cache-v3';
const PRECACHE_ASSETS = [
  './',
  'index.html',
  'dangerous-writer.html',
  'metadata-eraser.html',
  'md-reader.html',
  'ambient-timer.html',
  'base64-coder.html',
  'slide-overlay.html',
  'LICENSE',
  'manifest.json',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/css/space-grotesk.css',
  'assets/css/vt323.css',
  'assets/js/marked.min.js',
  'assets/js/jszip.min.js',
  
  // Fonts
  'assets/fonts/space-grotesk/space-grotesk-latin-300-normal.woff',
  'assets/fonts/space-grotesk/space-grotesk-latin-300-normal.woff2',
  'assets/fonts/space-grotesk/space-grotesk-latin-400-normal.woff',
  'assets/fonts/space-grotesk/space-grotesk-latin-400-normal.woff2',
  'assets/fonts/space-grotesk/space-grotesk-latin-500-normal.woff',
  'assets/fonts/space-grotesk/space-grotesk-latin-500-normal.woff2',
  'assets/fonts/space-grotesk/space-grotesk-latin-600-normal.woff',
  'assets/fonts/space-grotesk/space-grotesk-latin-600-normal.woff2',
  'assets/fonts/space-grotesk/space-grotesk-latin-700-normal.woff',
  'assets/fonts/space-grotesk/space-grotesk-latin-700-normal.woff2',
  
  'assets/fonts/space-grotesk/space-grotesk-latin-ext-300-normal.woff',
  'assets/fonts/space-grotesk/space-grotesk-latin-ext-300-normal.woff2',
  'assets/fonts/space-grotesk/space-grotesk-latin-ext-400-normal.woff',
  'assets/fonts/space-grotesk/space-grotesk-latin-ext-400-normal.woff2',
  'assets/fonts/space-grotesk/space-grotesk-latin-ext-500-normal.woff',
  'assets/fonts/space-grotesk/space-grotesk-latin-ext-500-normal.woff2',
  'assets/fonts/space-grotesk/space-grotesk-latin-ext-600-normal.woff',
  'assets/fonts/space-grotesk/space-grotesk-latin-ext-600-normal.woff2',
  'assets/fonts/space-grotesk/space-grotesk-latin-ext-700-normal.woff',
  'assets/fonts/space-grotesk/space-grotesk-latin-ext-700-normal.woff2',
  
  'assets/fonts/space-grotesk/space-grotesk-vietnamese-300-normal.woff',
  'assets/fonts/space-grotesk/space-grotesk-vietnamese-300-normal.woff2',
  'assets/fonts/space-grotesk/space-grotesk-vietnamese-400-normal.woff',
  'assets/fonts/space-grotesk/space-grotesk-vietnamese-400-normal.woff2',
  'assets/fonts/space-grotesk/space-grotesk-vietnamese-500-normal.woff',
  'assets/fonts/space-grotesk/space-grotesk-vietnamese-500-normal.woff2',
  'assets/fonts/space-grotesk/space-grotesk-vietnamese-600-normal.woff',
  'assets/fonts/space-grotesk/space-grotesk-vietnamese-600-normal.woff2',
  'assets/fonts/space-grotesk/space-grotesk-vietnamese-700-normal.woff',
  'assets/fonts/space-grotesk/space-grotesk-vietnamese-700-normal.woff2',
  
  'assets/fonts/vt323/vt323-latin-400-normal.woff',
  'assets/fonts/vt323/vt323-latin-400-normal.woff2',
  'assets/fonts/vt323/vt323-latin-ext-400-normal.woff',
  'assets/fonts/vt323/vt323-latin-ext-400-normal.woff2',
  'assets/fonts/vt323/vt323-vietnamese-400-normal.woff',
  'assets/fonts/vt323/vt323-vietnamese-400-normal.woff2',

  // Music
  'assets/music/audio1.mp3',
  'assets/music/audio2.mp3',
  'assets/music/audio3.mp3',
  'assets/music/audio4.mp3'
];

// Install Event - Pre-caches assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching application assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Intercept requests and serve cached content first
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Handle range requests for media files (audio/video)
          if (event.request.headers.has('range')) {
            return handleRangeRequest(event.request, cachedResponse);
          }
          return cachedResponse;
        }

        // Fallback to network
        return fetch(event.request).then(networkResponse => {
          // If a resource is fetched dynamically and isn't pre-cached, cache it for future offline use
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(err => {
          console.error('[Service Worker] Fetch failed offline:', err);
          // Return offline state error if both fail
        });
      })
  );
});

// Helper to construct a 206 Partial Content response for media files
function handleRangeRequest(request, cachedResponse) {
  const rangeHeader = request.headers.get('range');
  if (!rangeHeader) {
    return cachedResponse;
  }

  return cachedResponse.arrayBuffer().then(arrayBuffer => {
    const bytes = /^bytes=(\d+)-(\d+)?$/g.exec(rangeHeader);
    if (bytes) {
      const start = parseInt(bytes[1], 10);
      const end = bytes[2] ? parseInt(bytes[2], 10) : arrayBuffer.byteLength - 1;

      // Slice the buffer according to the range
      const slicedBuffer = arrayBuffer.slice(start, end + 1);
      const responseHeaders = new Headers(cachedResponse.headers);
      
      responseHeaders.set('Content-Range', `bytes ${start}-${end}/${arrayBuffer.byteLength}`);
      responseHeaders.set('Content-Length', slicedBuffer.byteLength);

      return new Response(slicedBuffer, {
        status: 206,
        statusText: 'Partial Content',
        headers: responseHeaders
      });
    }

    return cachedResponse;
  });
}
