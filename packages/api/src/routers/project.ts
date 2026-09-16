import { router, protectedProcedure } from "../trpc"

export const projectRouter = router({
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db.project.findMany({
      where: {
        ownerId: ctx.session.user.id,
      },
      select: {
        id: true,
        name: true,
      },
    })
  }),
})
