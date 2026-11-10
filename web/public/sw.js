// Bütçe Takip servis çalışanı. Sürümü her yayında artır.
const V = 'butce-react-v3'
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/icon-180.png', '/logo.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys()
      const hadOld = keys.some((k) => k !== V)
      await Promise.all(keys.filter((k) => k !== V).map((k) => caches.delete(k)))
      await self.clients.claim()
      // Güncelleme geldiyse açık sayfaları yeni sürümle yeniden yükle (eski paket ekranda kalmasın)
      if (hadOld) {
        const cs = await self.clients.matchAll({ type: 'window' })
        cs.forEach((c) => c.navigate(c.url).catch(() => {}))
      }
    })(),
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
  // sayfa ve diğerleri: önce ağ (HTTP önbelleğini atlayarak), ağ yoksa önbellek
  e.respondWith(
    fetch(r, r.mode === 'navigate' ? { cache: 'no-store' } : undefined)
      .then((res) => {
        const copy = res.clone()
        caches.open(V).then((c) => c.put(r.mode === 'navigate' ? '/' : r, copy))
        return res
      })
      .catch(() => caches.match(r).then((hit) => hit || caches.match('/'))),
  )
})
