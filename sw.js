const staticCacheName = "s-app-v3";
const dynamicCacheName = "d-app-v3";

const assetUrls = [
  "/icons/android/android-launchericon-144-144.png",
  "/icons/android/android-launchericon-192-192.png",
  "/icons/android/android-launchericon-48-48.png",
  "/icons/android/android-launchericon-512-512.png",
  "/icons/android/android-launchericon-72-72.png",
  "/icons/android/android-launchericon-96-96.png",
];

self.addEventListener("install", async (event) => {
  const cache = await caches.open(staticCacheName);
  await cache.addAll(assetUrls);
	self.skipWaiting();
});

self.addEventListener("activate", async (event) => {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((name) => name !== staticCacheName)
      .filter((name) => name !== dynamicCacheName)
      .map((name) => caches.delete(name))
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  const url = new URL(request.url);
  if (url.origin === location.origin) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  return cached ?? (await fetch(request));
}

async function networkFirst(request) {
  const cache = await caches.open(dynamicCacheName);
  try {
    const response = await fetch(request);
    await cache.put(request, response.clone());
    return response;
  } catch (e) {
    const cached = await cache.match(request);
    return cached;
  }
}
