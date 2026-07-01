const CACHE = "manqo-v1";
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["/", "/favicon.jpg"])));
});
self.addEventListener("activate", e => {
  e.waitUntil(clients.claim());
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
