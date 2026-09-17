import webpush from "web-push"
import { prisma } from "@workspace/db"
import { Email } from "@/server/email"
import { env } from "@/env"
import { getVapidSubject, getVapidPublicKey } from "@/server/vapid"

function setupWebPush() {
  webpush.setVapidDetails(
    getVapidSubject(),
    getVapidPublicKey(),
    env.VAPID_PRIVATE_KEY
  )
}

export interface PushNotificationPayload {
  title?: string
  body: string
  icon?: string
}

export async function sendEmailNotification(
  userId: string,
  payload: {
    subject: string
    body: string
    html?: string
  }
) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  })

  if (!user) {
    return false
  }

  if (!user.emailNotificationsEnabled) {
    return false
  }

  try {
    await Email.send(user.email, payload.subject, payload.body, payload.html)
  } catch {
    return false
  }
}

export async function sendPushNotification(
  userId: string,
  payload: {
    title: string
    body: string
    url?: string
  }
) {
  setupWebPush()
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  })

  if (!user) {
    return false
  }

  if (!user.pushNotificationsEnabled) {
    return false
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  })

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: "/icon.png",
    badge: "/badge.png",
    url: payload.url ?? "/",
  })

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            auth: sub.auth,
            p256dh: sub.p256dh,
          },
        },
        body
      )
    )
  )

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (!result) continue
    if (result.status === "rejected") {
      const subscription = subscriptions[i]
      if (!subscription) continue
      await prisma.pushSubscription.delete({
        where: { endpoint: subscription.endpoint },
      })
    }
  }

  return true
}
