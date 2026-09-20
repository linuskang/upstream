import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { requireProjectAccess } from "../permissions"

export const projectSettingsRouter = router({
  auditLogs: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await requireProjectAccess(ctx.db, input.projectId, ctx.session.user.id, "VIEW")
      const logs = await ctx.db.auditLog.findMany({
        where: { projectId: input.projectId },
        orderBy: { createdAt: "desc" },
        take: 15,
        select: {
          message: true,
          createdAt: true,
          user: { select: { name: true, image: true } },
        },
      })
      return logs.map((log) => ({ ...log, createdAt: log.createdAt.toISOString() }))
    }),

  requestLogs: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await requireProjectAccess(ctx.db, input.projectId, ctx.session.user.id, "VIEW")
      const logs = await ctx.db.requestLog.findMany({
        where: { projectId: input.projectId },
        orderBy: { createdAt: "desc" },
      })
      return logs.map((log) => ({
        ...log,
        requestBody: stringifyBody(log.requestBody),
        responseBody: stringifyBody(log.responseBody),
        createdAt: log.createdAt.toISOString(),
      }))
    }),
})

function stringifyBody(body: unknown) {
  if (body === null || body === undefined) return null
  return typeof body === "string" ? body : JSON.stringify(body)
}
