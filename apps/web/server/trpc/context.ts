import type { ApiContext } from "@workspace/api/context"
import { auth } from "@workspace/auth/server"
import { prisma } from "@workspace/db"
import { Email } from "@workspace/email"
import { headers } from "next/headers"

export async function createTRPCContext(): Promise<ApiContext> {
  const session = await auth.api.getSession({ headers: await headers() })

  return {
    db: prisma,
    session: session
      ? {
          user: {
            id: session.user.id,
            emailVerified: session.user.emailVerified,
          },
        }
      : null,
    sendEmail: Email.send.bind(Email),
  }
}
