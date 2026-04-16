/* Maktree Field Hub — minimal app-shell worker for installability + offline bootstrap */
const CACHE = "maktree-shell-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.add(new Request("/index.html", { cache: "reload" })).catch(() => {
          /* precache is best-effort; install still proceeds */
        }),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.hostname.includes("supabase.co")) return;

  if (request.mode !== "navigate") return;

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        if (response && (response.ok || response.status === 0)) {
          const copy = response.clone();
          const cache = await caches.open(CACHE);
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
});
