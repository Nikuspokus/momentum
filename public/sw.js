// Service worker Momentum : affiche les notifications Web Push et ouvre la bonne page au clic.
self.addEventListener('push', (event) => {
  let data = { title: 'Momentum', body: '', url: '/momentum/' }
  try { data = { ...data, ...event.data.json() } } catch { /* payload vide */ }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/momentum/icons/icon-192.png',
      badge: '/momentum/icons/icon-192.png',
      data: { url: data.url },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url || '/momentum/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes('/momentum/') && 'focus' in c) {
          c.navigate(target)
          return c.focus()
        }
      }
      return self.clients.openWindow(target)
    }),
  )
})
