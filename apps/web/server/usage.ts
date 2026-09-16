import { prisma } from "@workspace/db"
import { plans } from "@/subscription-types"

export interface UsageStats {
  plan: string
  projects: {
    current: number
    limit: number
  }
  eventsToday: {
    current: number
  }
  eventsMonth: {
    current: number
    limit: number
  }
}

export class Usage {
  static async increment(userId: string) {
    const month = new Date().toISOString().slice(0, 7)

    const usage = await prisma.userUsage.upsert({
      where: {
        userId_month: {
          userId,
          month,
        },
      },
      update: {
        eventCount: {
          increment: 1,
        },
      },
      create: {
        userId,
        month,
        eventCount: 1,
      },
    })

    return usage
  }

  static async decrement(userId: string) {
    const month = new Date().toISOString().slice(0, 7)

    await prisma.userUsage.update({
      where: {
        userId_month: {
          userId,
          month,
        },
      },
      data: {
        eventCount: {
          decrement: 1,
        },
      },
    })
  }

  static async getStats(userId: string): Promise<UsageStats> {
    // Count total projects
    const projectCount = await prisma.project.count({
      where: {
        ownerId: userId,
      },
    })

    // Count events today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const eventsToday = await prisma.event.count({
      where: {
        project: {
          ownerId: userId,
        },
        createdAt: {
          gte: today,
        },
      },
    })

    // Get monthly usage
    const month = new Date().toISOString().slice(0, 7)
    const monthlyUsage = await prisma.userUsage.findUnique({
      where: {
        userId_month: {
          userId,
          month,
        },
      },
    })

    // Get user plan
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        plan: true,
      },
    })

    if (!user)
      return {
        plan: "Free",
        projects: {
          current: projectCount,
          limit: plans["FREE"].maxProjects,
        },
        eventsToday: {
          current: eventsToday,
        },
        eventsMonth: {
          current: monthlyUsage?.eventCount ?? 0,
          limit: plans["FREE"].maxEventsPerMonth,
        },
      }

    const plan = user.plan as keyof typeof plans
    const planConfig = plans[plan]

    const planDisplay = (user?.plan ?? "FREE")
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase())

    return {
      plan: planDisplay,
      projects: {
        current: projectCount,
        limit: planConfig.maxProjects,
      },
      eventsToday: {
        current: eventsToday,
      },
      eventsMonth: {
        current: monthlyUsage?.eventCount ?? 0,
        limit: planConfig.maxEventsPerMonth,
      },
    }
  }
}
