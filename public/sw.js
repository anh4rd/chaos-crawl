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

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let payload;
      try {
        payload = event.data?.json();
      } catch (error) {
        console.error("Invalid push notification payload.", error);
      }
      const title =
        typeof payload?.title === "string" ? payload.title : "Chaos Crawl";
      const body =
        typeof payload?.body === "string"
          ? payload.body
          : "Open Chaos Crawl for a game update.";
      const joinCode =
        typeof payload?.joinCode === "string" &&
        /^\d{6}$/.test(payload.joinCode)
          ? payload.joinCode
          : null;
      await self.registration.showNotification(title, {
        body,
        icon: new URL("pwa-192.png", self.registration.scope).href,
        data: { joinCode },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const url = new URL(self.registration.scope);
      const code = event.notification.data?.joinCode;
      if (typeof code === "string" && /^\d{6}$/.test(code))
        url.hash = `/play/${code}`;
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const existing = clients.find((client) => {
        const clientUrl = new URL(client.url);
        return (
          clientUrl.origin === url.origin &&
          clientUrl.pathname.startsWith(url.pathname) &&
          (!code ||
            clientUrl.hash === `#/play/${code}` ||
            clientUrl.hash.startsWith(`#/play/${code}/`))
        );
      });
      if (existing) {
        await existing.focus();
      } else {
        await self.clients.openWindow(url.href);
      }
    })(),
  );
});
