const ICON = "/icon.png"

self.addEventListener("push", function (event) {
  console.log("[SW] Push event received:", event)

  const showFallback = () =>
    self.registration.showNotification("Notification", {
      body: "You have a new notification.",
      badge: ICON,
      vibrate: [100, 50, 100],
      data: {
        url: "/",
      },
    })

  if (!event.data) {
    event.waitUntil(showFallback())
    return
  }

  event.waitUntil(
    (async () => {
      try {
        const data = event.data.json()

        const options = {
          body: data.body,
          badge: data.badge || ICON,
          vibrate: [100, 50, 100],
          data: {
            url: data.url || "/",
            dateOfArrival: Date.now(),
            primaryKey: "2",
          },
        }

        await self.registration.showNotification(data.title, options)

        console.log("[SW] Notification shown")
      } catch (error) {
        console.error("[SW] Failed to show notification:", error)
        await showFallback()
      }
    })()
  )
})

self.addEventListener("notificationclick", function (event) {
  console.log("[SW] Notification click received.")

  event.notification.close()

  event.waitUntil(
    (async () => {
      try {
        const notificationUrl = event.notification.data?.url || "/"

        const url = new URL(notificationUrl, self.location.origin)

        const windowClients = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        })

        const existing = windowClients.find((client) => {
          try {
            return new URL(client.url).origin === url.origin
          } catch {
            return false
          }
        })

        if (existing) {
          await existing.navigate(url.href)
          await existing.focus()
          return
        }

        await self.clients.openWindow(url.href)
      } catch (error) {
        console.error("[SW] Failed to open notification URL:", error)

        await self.clients.openWindow("/")
      }
    })()
  )
})
