/* GADGET HUB - Hand-rolled PWA Service Worker
   Cache-first for static assets, network-first for navigations & API. */
const VERSION = "gadgethub-v1.0.3";
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const PRECACHE = [
  "/",
  "/manifest.json",
  "/images/logo.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  if (url.origin === location.origin && url.pathname.startsWith("/api/")) {
    return; // never cache API calls offline
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match("/").then((r) => r || caches.match(request)))
    );
    return;
  }

  if (url.pathname.match(/\.(png|svg|jpg|jpeg|gif|webp|ico)$/)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
            return res;
          })
      )
    );
    return;
  }

  // Network-first for code chunks, CSS and everything else so dev recompiles
  // are never served from a stale cache; falls back to cache when offline.
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && !res.redirected) {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
