// Bütçe Takip servis çalışanı. Sürümü her yayında artır.
const V = 'butce-react-v1'
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/icon-180.png', '/logo.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((k) => Promise.all(k.filter((x) => x !== V).map((x) => caches.delete(x))))
      .then(() => self.clients.claim()),
  )
})
self.addEventListener('fetch', (e) => {
  const r = e.request
  const u = new URL(r.url)
  if (r.method !== 'GET' || u.origin !== location.origin) return
  // eski sürüm ve yapılandırma her zaman ağdan
  if (u.pathname.startsWith('/eski/') || u.pathname === '/config.js' || u.pathname === '/sw.js') return
  // derlenmiş, adı içeriğe bağlı dosyalar: önce önbellek
  if (u.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(r).then(
        (hit) =>
          hit ||
          fetch(r).then((res) => {
            const copy = res.clone()
            caches.open(V).then((c) => c.put(r, copy))
            return res
          }),
      ),
    )
    return
  }
  // sayfa ve diğerleri: önce ağ, çevrimdışıysa önbellek
  e.respondWith(
    fetch(r)
      .then((res) => {
        const copy = res.clone()
        caches.open(V).then((c) => c.put(r.mode === 'navigate' ? '/' : r, copy))
        return res
      })
      .catch(() => caches.match(r).then((hit) => hit || caches.match('/'))),
  )
})
