// Service worker: makes the app work offline.
//
// Strategy: "stale-while-revalidate" for our own files — serve from cache
// instantly, then check for a fresh copy in the background for next time.
// So after you deploy an update, users get it on their *second* visit.
// Bump CACHE when you add/rename files so the old cache is cleaned up.

const CACHE = "plant-app-v2";
const ASSETS = [
  "./",
  "styles.css",
  "config.js",
  "manifest.webmanifest",
  "js/app.js",
  "js/plants-data.js",
  "js/schedule.js",
  "js/storage.js",
  "js/image.js",
  "js/identify.js",
  "js/ics.js",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  // cache: "reload" skips the browser's HTTP cache so we never install stale files.
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  // Only handle our own GET requests. Pl@ntNet calls (POST, other origin) go straight to the network.
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  // index.html and "./" are the same page; store it once under "./".
  const key = req.mode === "navigate" ? "./" : req;

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(key, { ignoreSearch: true });
      // cache: "no-cache" revalidates with the server (a tiny 304 if unchanged)
      // instead of trusting GitHub Pages' 10-minute HTTP cache.
      const network = fetch(req, { cache: "no-cache" })
        .then((res) => {
          if (res.ok) cache.put(key, res.clone());
          return res;
        })
        .catch(() => null);
      if (cached) {
        e.waitUntil(network); // keep the SW alive until the background refresh finishes
        return cached;
      }
      return (await network) || Response.error();
    })
  );
});
