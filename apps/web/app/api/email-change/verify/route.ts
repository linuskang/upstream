import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@workspace/db"
import { env } from "@workspace/env"
import { Email } from "@workspace/email"

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")

  function redirect(status: string) {
    return NextResponse.redirect(
      new URL(`/settings/account?emailChange=${status}`, env.BASE_URL)
    )
  }

  if (!token) return redirect("invalid")

  // Stage 1: approval link sent to the current (old) email address
  const byOldToken = await prisma.emailChangeRequest.findUnique({
    where: { oldToken: token },
  })
  if (byOldToken) {
    if (byOldToken.expiresAt < new Date()) {
      await prisma.emailChangeRequest.delete({ where: { id: byOldToken.id } })
      return redirect("expired")
    }
    if (!byOldToken.oldVerified) {
      await prisma.emailChangeRequest.update({
        where: { id: byOldToken.id },
        data: { oldVerified: true },
      })
      await Email.sendEmailChangeVerification(
        byOldToken.newEmail,
        byOldToken.newToken
      )
    }
    return redirect("old-verified")
  }

  // Stage 2: verification link sent to the new email address
  const byNewToken = await prisma.emailChangeRequest.findUnique({
    where: { newToken: token },
  })
  if (byNewToken) {
    if (byNewToken.expiresAt < new Date()) {
      await prisma.emailChangeRequest.delete({ where: { id: byNewToken.id } })
      return redirect("expired")
    }
    if (!byNewToken.oldVerified) {
      return redirect("pending-old")
    }
    await prisma.user.update({
      where: { id: byNewToken.userId },
      data: { email: byNewToken.newEmail, emailVerified: true },
    })
    await prisma.emailChangeRequest.delete({ where: { id: byNewToken.id } })
    return redirect("done")
  }

  return redirect("invalid")
}
