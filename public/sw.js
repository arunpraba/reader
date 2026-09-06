/* Margin PWA service worker — network-first, cache fallback for same-origin GETs. */
const CACHE = "margin-v2";
const BASE = self.location.pathname.replace(/\/sw\.js$/, "");

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll(
          [
            `${BASE}/`,
            `${BASE}/manifest.webmanifest`,
            `${BASE}/favicon.svg`,
            `${BASE}/now-playing.png`,
            `${BASE}/icon-192.png`,
            `${BASE}/icon-512.png`,
            `${BASE}/apple-touch-icon.png`,
          ].filter(Boolean),
        ),
      ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (BASE && !url.pathname.startsWith(`${BASE}/`) && url.pathname !== BASE) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const shell = await caches.match(`${BASE}/`);
          if (shell) return shell;
        }
        return Response.error();
      }),
  );
});
