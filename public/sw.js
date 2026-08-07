// Service worker — offline support WITHOUT ever pinning users to old code.
//
// The previous version cached index.html and served it back on later visits.
// Because index.html names the hashed JS bundle, anyone who had loaded the site
// once kept booting the OLD bundle forever, even after a deploy. Navigations are
// now network-only, so a deploy always reaches returning visitors and installed
// PWAs on their next load.

const CACHE = 'allcanlearn-v2';

self.addEventListener('install', () => {
  // Nothing is pre-cached: index.html must always come from the network.
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Never intercept API, SSE, WS or audio.
  if (url.pathname.startsWith('/api') ||
      url.pathname.startsWith('/generate') ||
      url.pathname.startsWith('/tts_output') ||
      url.pathname.startsWith('/ws')) return;

  // Navigations (the HTML shell) always go to the network, bypassing the HTTP
  // cache too — `cache: 'no-store'` matters, since a heuristically-cached
  // index.html will happily hand back a deleted bundle name. The copy we keep
  // is only ever served when the network is actually unreachable.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put('/', clone));
          return res;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Everything else is a content-hashed asset (/static/js/main.<hash>.js) —
  // its URL changes whenever its contents change, so caching it is safe.
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
