// Hors ligne + mises à jour : la page est prise sur le réseau quand il y en a, sinon dans le cache.
const VERSION = 'carnet-v33';
const FILES = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png', './avatar.jpg'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isPage = req.mode === 'navigate' || req.url.endsWith('/') || req.url.endsWith('.html');
  if (isPage) {
    // réseau d'abord : la dernière version s'affiche dès qu'il y a internet
    // petit paramètre unique pour passer outre le cache de GitHub (sinon jusqu'à 10 min de retard)
    const fresh = new URL('./index.html', self.registration.scope); fresh.searchParams.set('t', Date.now());
    e.respondWith(fetch(fresh, {cache: 'no-store'}).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  })));
});
