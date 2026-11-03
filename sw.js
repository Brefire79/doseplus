const CACHE = 'dosecheck-v2.6';
const ASSETS = ['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
// Hosts de CDN elegíveis a stale-while-revalidate (cache-first + revalidação em background)
const CDN_HOSTS = ['cdn.jsdelivr.net','cdnjs.cloudflare.com','fonts.googleapis.com','fonts.gstatic.com'];

self.addEventListener('install', e => {
  // Pré-cacheia apenas os essenciais — se falhar, continua
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .catch(err => console.warn('Cache install warning:', err))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .catch(err => console.warn('[SW] Activation warning:', err))
  );
});

// Recebe sinal do app para ativar a nova versão
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  const isCDN = CDN_HOSTS.indexOf(url.hostname) !== -1;
  const cacheable = (res) =>
    res && res.status === 200 && (res.type === 'basic' || (isCDN && (res.type === 'cors' || res.type === 'opaque')));

  e.respondWith(
    caches.match(req)
      .then(cached => {
        // stale-while-revalidate: serve do cache e revalida em background
        const fetcher = fetch(req)
          .then(res => {
            if (cacheable(res)) {
              const clone = res.clone();
              caches.open(CACHE).then(c => c.put(req, clone));
            }
            return res;
          })
          .catch(() => cached); // offline → cache

        return cached || fetcher;
      })
      .catch(() => new Response('Service Worker offline', { status: 503 }))
  );
});
