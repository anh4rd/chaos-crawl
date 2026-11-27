const cacheName = "chaos-crawl-offline-v1";
const offlineUrl = new URL("offline.html", self.registration.scope).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => cache.add(offlineUrl)),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(offlineUrl);
      if (!cached) throw new Error("Offline page is unavailable.");
      return cached;
    }),
  );
});
