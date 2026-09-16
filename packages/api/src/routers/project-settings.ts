import { TRPCError } from "@trpc/server"
import type { PrismaClient } from "@workspace/db"
import { z } from "zod"
import { router, protectedProcedure } from "../trpc"

export const projectSettingsRouter = router({
  auditLogs: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertProjectAccess(ctx.db, input.projectId, ctx.session.user.id)
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
      await assertProjectAccess(ctx.db, input.projectId, ctx.session.user.id)
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

async function assertProjectAccess(db: PrismaClient, projectId: string, userId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, ownerId: userId },
    select: { id: true },
  })
  if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" })
}
