/* Maktree Field Hub — app-shell + static asset caching for PWA installability & speed */
const SHELL_CACHE = "maktree-shell-v6";
const ASSET_CACHE = "maktree-assets-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        cache.add(new Request("/index.html", { cache: "reload" })).catch(() => {}),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL_CACHE, ASSET_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.hostname.includes("supabase.co")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response && (response.ok || response.status === 0)) {
            const copy = response.clone();
            const cache = await caches.open(SHELL_CACHE);
            await cache.put("/index.html", copy);
          }
          return response;
        } catch {
          const cached = await caches.match("/index.html");
          if (cached) return cached;
          return Response.error();
        }
      })(),
    );
    return;
  }

  const ext = url.pathname.split(".").pop() || "";
  const cacheable =
    ["js", "css", "woff2", "woff", "ttf", "png", "jpg", "jpeg", "svg", "webp", "ico"].includes(ext) ||
    url.pathname.startsWith("/assets/");

  if (cacheable) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response && response.ok) {
            const cache = await caches.open(ASSET_CACHE);
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          return Response.error();
        }
      })(),
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  const target = url.startsWith("/") ? url : `/${url}`;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client && typeof client.navigate === "function") {
            return client.navigate(`${self.registration.scope}#${target}`);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(`${self.registration.scope}#${target}`);
      }
    }),
  );
});
