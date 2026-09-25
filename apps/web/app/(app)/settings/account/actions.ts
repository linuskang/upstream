"use server"

import crypto from "node:crypto"
import { headers } from "next/headers"

import { auth } from "@workspace/auth/server"
import { prisma } from "@workspace/db"
import { Email } from "@workspace/email"

const EXPIRY_MS = 60 * 60 * 1000 // 1 hour

type ActionResult = { success: true } | { error: string }

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) return null
  return session
}

export async function requestEmailChange(
  newEmailInput: string
): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return { error: "Not authenticated" }

  const newEmail = newEmailInput.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return { error: "Enter a valid email address" }
  }
  if (newEmail === session.user.email.toLowerCase()) {
    return { error: "That's already your current email" }
  }

  const existing = await prisma.user.findUnique({
    where: { email: newEmail },
    select: { id: true },
  })
  if (existing) {
    return { error: "That email address is already in use" }
  }

  const oldToken = crypto.randomBytes(32).toString("hex")
  const newToken = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + EXPIRY_MS)

  await prisma.emailChangeRequest.upsert({
    where: { userId: session.user.id },
    update: {
      newEmail,
      oldToken,
      newToken,
      oldVerified: false,
      expiresAt,
    },
    create: {
      userId: session.user.id,
      newEmail,
      oldToken,
      newToken,
      expiresAt,
    },
  })

  await Email.sendEmailChangeApproval(session.user.email, newEmail, oldToken)

  return { success: true }
}

export async function getEmailChangeRequest() {
  const session = await getSession()
  if (!session) return null

  const request = await prisma.emailChangeRequest.findUnique({
    where: { userId: session.user.id },
  })
  if (!request) return null

  if (request.expiresAt < new Date()) {
    await prisma.emailChangeRequest.delete({ where: { id: request.id } })
    return null
  }

  return {
    newEmail: request.newEmail,
    oldVerified: request.oldVerified,
  }
}

export async function cancelEmailChange(): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return { error: "Not authenticated" }

  await prisma.emailChangeRequest.deleteMany({
    where: { userId: session.user.id },
  })

  return { success: true }
}

export async function resendEmailChangeEmail(): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return { error: "Not authenticated" }

  const request = await prisma.emailChangeRequest.findUnique({
    where: { userId: session.user.id },
  })
  if (!request || request.expiresAt < new Date()) {
    return { error: "No pending email change" }
  }

  if (request.oldVerified) {
    await Email.sendEmailChangeVerification(request.newEmail, request.newToken)
  } else {
    await Email.sendEmailChangeApproval(
      session.user.email,
      request.newEmail,
      request.oldToken
    )
  }

  return { success: true }
}
