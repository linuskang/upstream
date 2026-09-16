import { router, protectedProcedure } from "../trpc"

export const accountRouter = router({
  activity: protectedProcedure.query(async ({ ctx }) => {
    const activities = await ctx.db.auditLog.findMany({
      where: {
        project: {
          ownerId: ctx.session.user.id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        message: true,
        createdAt: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    })

    return activities.map((activity) => ({
      ...activity,
      createdAt: activity.createdAt.toISOString(),
    }))
  }),
})
