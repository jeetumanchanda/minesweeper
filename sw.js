// Minimal service worker for offline support - caches shell files
const CACHE = 'minesweeper-v1';
const FILES = ['.','index.html','styles.css','app.js','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install', evt=>{
  evt.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', evt=>{ evt.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', evt=>{
  evt.respondWith(caches.match(evt.request).then(resp=>resp || fetch(evt.request)));
});
