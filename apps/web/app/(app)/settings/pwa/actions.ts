'use server'

import { PushSubscription } from 'web-push'
import { getSession } from '@/server/auth'
import { prisma } from '@workspace/db'
import { sendPushNotification } from '@/server/notification'

export async function subscribeUser(sub: PushSubscription) {
  const session = await getSession()
  if (!session?.user?.id) {
    throw new Error('Not authenticated')
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: { userId: session.user.id },
    create: {
      userId: session.user.id,
      endpoint: sub.endpoint,
      auth: sub.keys.auth,
      p256dh: sub.keys.p256dh,
    },
  })

  return { success: true }
}

export async function unsubscribeUser(endpoint: string) {
  const session = await getSession()
  if (!session?.user?.id) {
    throw new Error('Not authenticated')
  }

  await prisma.pushSubscription.deleteMany({
    where: {
      endpoint,
      userId: session.user.id,
    },
  })

  return { success: true }
}

export async function sendNotificationToMe(message: string) {
  const session = await getSession()
  if (!session?.user?.id) {
    throw new Error('Not authenticated')
  }

  return sendPushNotification(session.user.id, {
    title: 'Test notification',
    body: message,
  })
}
