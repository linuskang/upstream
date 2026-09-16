import type { ApiContext } from "@workspace/api/context"
import { prisma } from "@workspace/db"
import { getSession } from "@/server/auth"

export async function createTRPCContext(): Promise<ApiContext> {
  const session = await getSession()

  return {
    db: prisma,
    session: session
      ? {
          user: {
            id: session.user.id,
          },
        }
      : null,
  }
}
