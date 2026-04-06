const CACHE_NAME = "image-cache-v1";

// Install Service Worker & Pre-cache Static Assets (Optional)
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting()); // Activate immediately
});

// Listen for Fetch Events
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Only cache images that match this path
  if (requestUrl.href.includes("https://gi.yatta.moe/assets/UI/")) {
    event.respondWith(
      caches.open("image-cache-v1").then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          return (
            cachedResponse ||
            fetch(event.request).then((networkResponse) => {
              cache.put(event.request, networkResponse.clone()); // Store it in cache
              return networkResponse;
            })
          );
        });
      })
    );
  }
});
