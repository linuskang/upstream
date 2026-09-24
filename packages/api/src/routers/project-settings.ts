import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { requireProjectAccess } from "../permissions"

export const projectSettingsRouter = router({
  auditLogs: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await requireProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
        "VIEW"
      )
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
      return logs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      }))
    }),

  auditLogsPage: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(50).default(10),
        search: z.string().trim().default(""),
      })
    )
    .query(async ({ ctx, input }) => {
      await requireProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
        "VIEW"
      )

      const search = input.search || undefined
      const where = {
        projectId: input.projectId,
        ...(search
          ? {
              OR: [
                { message: { contains: search, mode: "insensitive" as const } },
                {
                  user: {
                    name: { contains: search, mode: "insensitive" as const },
                  },
                },
              ],
            }
          : {}),
      }

      const [total, logs] = await Promise.all([
        ctx.db.auditLog.count({ where }),
        ctx.db.auditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          select: {
            message: true,
            createdAt: true,
            user: { select: { name: true, image: true } },
          },
        }),
      ])

      return {
        items: logs.map((log) => ({
          ...log,
          createdAt: log.createdAt.toISOString(),
        })),
        page: input.page,
        pageSize: input.pageSize,
        total,
        totalPages: Math.ceil(total / input.pageSize),
      }
    }),

  requestLogs: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await requireProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
        "VIEW"
      )
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
