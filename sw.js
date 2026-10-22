/* Installable-app service worker.
 * Caches only this wrapper's own shell (page, manifest, icons) so the app
 * window opens instantly and shows a friendly message when offline. The HR
 * system itself always loads live from Google inside the frame; nothing from
 * it is cached here. */
const SHELL_CACHE = 'mithaly-hr-shell-v1';
const SHELL_FILES = ['./', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './favicon-48.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== SHELL_CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Network first so wrapper updates show up; fall back to the cached shell.
  event.respondWith(fetch(event.request)
    .then(response => {
      const copy = response.clone();
      caches.open(SHELL_CACHE).then(cache => cache.put(event.request, copy));
      return response;
    })
    .catch(() => caches.match(event.request).then(hit => hit || caches.match('./index.html'))));
});
