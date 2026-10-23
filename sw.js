// Service worker: makes the app work offline.
//
// Strategy: "stale-while-revalidate" for our own files — serve from cache
// instantly, then fetch a fresh copy in the background for next time.
// So after you deploy an update, users get it on their *second* visit.
// Bump CACHE when you add/rename files so the old cache is cleaned up.

const CACHE = "plant-app-v1";
const ASSETS = [
  "./",
  "index.html",
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
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
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

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      if (cached) {
        e.waitUntil(network); // keep the SW alive until the background refresh finishes
        return cached;
      }
      return (await network) || (req.mode === "navigate" ? cache.match("index.html") : Response.error());
    })
  );
});
