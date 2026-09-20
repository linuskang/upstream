import type { ApiContext } from "@workspace/api/context"
import { prisma } from "@workspace/db"
import { getSession } from "@/server/auth"
import { Email } from "@/server/email"

export async function createTRPCContext(): Promise<ApiContext> {
  const session = await getSession()

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
