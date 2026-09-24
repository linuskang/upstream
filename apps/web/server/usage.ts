import { prisma } from "@workspace/db"

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
}
