import { NextRequest } from "next/server"
import { prisma } from "@workspace/db"
import { env } from "@/env"
import { plans } from "@/subscription-types"
import { Plan } from "@workspace/db"
import { ApiResponse } from "@/app/api/responses"

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("x-api-key")
  const expected = env.CRON_SECRET ? `${env.CRON_SECRET}` : null

  if (!expected) {
    return ApiResponse.InternalServerError("Cron secret not configured")
  }

  if (authHeader !== expected) {
    return ApiResponse.Unauthorized()
  }

  let totalDeleted = 0
  const details: Record<
    string,
    { events: number; auditLogs: number; requestLogs: number }
  > = {}

  for (const [planKey, planConfig] of Object.entries(plans)) {
    const cutoff = new Date(
      Date.now() - planConfig.retentionDays * 24 * 60 * 60 * 1000
    )

    const eventResult = await prisma.event.deleteMany({
      where: {
        project: {
          members: {
            some: {
              role: "OWNER",
              user: {
                plan: planKey.toUpperCase() as Plan,
              },
            },
          },
        },
        createdAt: {
          lt: cutoff,
        },
      },
    })

    const auditLogResult = await prisma.auditLog.deleteMany({
      where: {
        project: {
          members: {
            some: {
              role: "OWNER",
              user: {
                plan: planKey.toUpperCase() as Plan,
              },
            },
          },
        },
        createdAt: {
          lt: cutoff,
        },
      },
    })

    const requestLogResult = await prisma.requestLog.deleteMany({
      where: {
        project: {
          members: {
            some: {
              role: "OWNER",
              user: {
                plan: planKey.toUpperCase() as Plan,
              },
            },
          },
        },
        createdAt: {
          lt: cutoff,
        },
      },
    })

    details[planKey] = {
      events: eventResult.count,
      auditLogs: auditLogResult.count,
      requestLogs: requestLogResult.count,
    }
    totalDeleted +=
      eventResult.count + auditLogResult.count + requestLogResult.count
  }

  return ApiResponse.Success("Retention cleanup completed", {
    deleted: totalDeleted,
    details,
  })
}
