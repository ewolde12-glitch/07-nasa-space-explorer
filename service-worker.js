const CACHE_NAME = "nasa-space-explorer-v1";
const API_CACHE = "nasa-api-cache-v1";

// Files that exist in the application and are needed to run it offline.
const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./js/dateRange.js",
  "./js/script.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter((name) => name !== CACHE_NAME && name !== API_CACHE)
        .map((name) => caches.delete(name))
    ))
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isNASARequest =
    url.hostname === "api.nasa.gov" ||
    url.hostname === "science.nasa.gov";

  if (isNASARequest) {
    event.respondWith((async () => {
      const cache = await caches.open(API_CACHE);

      try {
        const response = await fetch(request);
        if (response.ok) {
          try {
            await cache.put(request, response.clone());
          } catch (error) {
            // Return the network response even if this response cannot be cached.
          }
        }
        return response;
      } catch (error) {
        const savedResponse = await cache.match(request);
        if (savedResponse) return savedResponse;

        return new Response(
          JSON.stringify({ error: "Offline. No saved NASA data available." }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    })());

    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request);
      })
    );
  }
});
