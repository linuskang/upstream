import { getPlan } from "../subscription-types"
import { router, protectedProcedure } from "../trpc"

export const usageRouter = router({
  stats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const [projectCount, ownedProjectCount, eventsToday, monthlyUsage, user] =
      await Promise.all([
        ctx.db.project.count({
          where: {
            members: {
              some: {
                userId,
              },
            },
          },
        }),
        ctx.db.project.count({
          where: {
            members: {
              some: {
                userId,
                role: "OWNER",
              },
            },
          },
        }),
        ctx.db.event.count({
          where: {
            project: {
              members: {
                some: {
                  userId,
                },
              },
            },
            createdAt: { gte: startOfToday() },
          },
        }),
        ctx.db.userUsage.findUnique({
          where: {
            userId_month: {
              userId,
              month: new Date().toISOString().slice(0, 7),
            },
          },
        }),
        ctx.db.user.findUnique({
          where: { id: userId },
          select: { plan: true },
        }),
      ])

    const plan = getPlan(user?.plan)

    return {
      plan: plan.displayName,
      projects: {
        current: projectCount,
        limit: plan.maxProjects,
      },
      ownedProjects: {
        current: ownedProjectCount,
        limit: plan.maxProjects,
      },
      eventsToday: {
        current: eventsToday,
      },
      eventsMonth: {
        current: monthlyUsage?.eventCount ?? 0,
        limit: plan.maxEventsPerMonth,
      },
      membersPerProject: {
        limit: plan.maxMembersPerProject,
      },
    }
  }),
})

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}
