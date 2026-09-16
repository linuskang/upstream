import { TRPCError } from "@trpc/server"
import type { PrismaClient } from "@workspace/db"
import crypto from "node:crypto"
import { z } from "zod"
import { router, protectedProcedure } from "../trpc"

const apiKeyFields = {
  id: true,
  name: true,
  createdAt: true,
  lastUsed: true,
  active: true,
  addedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  },
} as const

export const apiKeyRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertProjectAccess(ctx.db, input.projectId, ctx.session.user.id)
      const keys = await ctx.db.apiKey.findMany({
        where: { projectId: input.projectId },
        select: apiKeyFields,
        orderBy: { createdAt: "desc" },
      })
      return keys.map(serializeApiKey)
    }),

  create: protectedProcedure
    .input(z.object({ projectId: z.string().uuid(), name: z.string().trim().min(1).max(80) }))
    .mutation(async ({ ctx, input }) => {
      await assertProjectAccess(ctx.db, input.projectId, ctx.session.user.id)
      const secret = `up_${crypto.randomUUID().replace(/-/g, "")}`
      const key = await ctx.db.apiKey.create({
        data: {
          name: input.name,
          key: crypto.createHash("sha256").update(secret).digest("hex"),
          addedById: ctx.session.user.id,
          projectId: input.projectId,
        },
        select: { id: true },
      })
      await ctx.db.auditLog.create({
        data: {
          projectId: input.projectId,
          userId: ctx.session.user.id,
          message: `Created API key ${input.name}`,
        },
      })
      return { id: key.id, secret }
    }),

  delete: protectedProcedure
    .input(z.object({ projectId: z.string().uuid(), keyId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await assertProjectAccess(ctx.db, input.projectId, ctx.session.user.id)
      const key = await ctx.db.apiKey.findFirst({
        where: { id: input.keyId, projectId: input.projectId },
        select: { name: true },
      })
      if (!key) throw new TRPCError({ code: "NOT_FOUND", message: "API key not found" })

      await ctx.db.apiKey.delete({ where: { id: input.keyId } })
      await ctx.db.auditLog.create({
        data: {
          projectId: input.projectId,
          userId: ctx.session.user.id,
          message: `Deleted API key ${key.name}`,
        },
      })
      return { id: input.keyId }
    }),
})

function serializeApiKey<T extends { createdAt: Date; lastUsed: Date | null }>(key: T) {
  return {
    ...key,
    createdAt: key.createdAt.toISOString(),
    lastUsed: key.lastUsed?.toISOString() ?? null,
  }
}

async function assertProjectAccess(db: PrismaClient, projectId: string, userId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, ownerId: userId },
    select: { id: true },
  })
  if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" })
}
