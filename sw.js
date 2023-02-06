/** Имя кеша (менять при обновлении файлов из списка assetsUrls) */
const cacheName = 'cache-v1'

/** Список файлов для кеширования добавил только иконки что бы быть уверенным что сайт не сломается */
const assetUrls = [
  "/img/icons/android/android-launchericon-144-144.png",
	"/img/icons/android/android-launchericon-192-192.png",
	"/img/icons/android/android-launchericon-48-48.png",
	"/img/icons/android/android-launchericon-512-512.png",
	"/img/icons/android/android-launchericon-72-72.png",
	"/img/icons/android/android-launchericon-96-96.png"
]

/** Закешировать файлы */
self.addEventListener('install', async event => {
	self.skipWaiting();
  const cache = await caches.open(cacheName)
  await cache.addAll(assetUrls)
})

/** Удалить кеш не соответствующий casheName */
self.addEventListener('activate', async event => {
  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames
      .filter(name => name !== cacheName)
      .map(name => caches.delete(name))
  )
})

/** Отслеживание каждого запроса и загрузка файлов из кеша */
self.addEventListener('fetch', event => {
  const {request} = event
  event.respondWith(cacheFirst(request))
})

/** Если файл есть в кеше грузить его из кеша если нет то из сети */
async function cacheFirst(request) {
  const cached = await caches.match(request)
  return cached ?? await fetch(request)
}
