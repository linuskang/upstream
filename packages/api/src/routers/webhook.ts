import { TRPCError } from "@trpc/server"
import type { PrismaClient } from "@workspace/db"
import { z } from "zod"
import { router, protectedProcedure } from "../trpc"

const webhookInput = z.object({
  name: z.string().trim().min(1).max(80),
  subscription: z.string().trim().min(1).max(120),
  url: z.url(),
})

export const webhookRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertProjectAccess(ctx.db, input.projectId, ctx.session.user.id)
      const webhooks = await ctx.db.webhook.findMany({
        where: { projectId: input.projectId },
        orderBy: { createdAt: "desc" },
      })
      return webhooks.map(serializeWebhook)
    }),

  create: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }).and(webhookInput))
    .mutation(async ({ ctx, input }) => {
      await assertProjectAccess(ctx.db, input.projectId, ctx.session.user.id)
      const webhook = await ctx.db.webhook.create({
        data: {
          projectId: input.projectId,
          name: input.name,
          subscription: input.subscription,
          url: input.url,
        },
      })
      await log(ctx.db, input.projectId, ctx.session.user.id, `Created webhook ${input.name}`)
      return serializeWebhook(webhook)
    }),

  update: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        webhookId: z.string().uuid(),
        ...webhookInput.shape,
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertProjectAccess(ctx.db, input.projectId, ctx.session.user.id)
      const webhook = await ctx.db.webhook.findFirst({
        where: { id: input.webhookId, projectId: input.projectId },
      })
      if (!webhook) throw new TRPCError({ code: "NOT_FOUND", message: "Webhook not found" })

      const updated = await ctx.db.webhook.update({
        where: { id: input.webhookId },
        data: {
          name: input.name,
          subscription: input.subscription,
          url: input.url,
          enabled: input.enabled,
        },
      })
      await log(ctx.db, input.projectId, ctx.session.user.id, `Updated webhook ${input.name}`)
      return serializeWebhook(updated)
    }),

  delete: protectedProcedure
    .input(z.object({ projectId: z.string().uuid(), webhookId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await assertProjectAccess(ctx.db, input.projectId, ctx.session.user.id)
      const webhook = await ctx.db.webhook.findFirst({
        where: { id: input.webhookId, projectId: input.projectId },
        select: { name: true },
      })
      if (!webhook) throw new TRPCError({ code: "NOT_FOUND", message: "Webhook not found" })

      await ctx.db.webhook.delete({ where: { id: input.webhookId } })
      await log(ctx.db, input.projectId, ctx.session.user.id, `Deleted webhook ${webhook.name}`)
      return { id: input.webhookId }
    }),
})

function serializeWebhook(webhook: {
  id: string
  projectId: string
  name: string
  subscription: string
  url: string
  enabled: boolean
  lastTriggered: Date | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...webhook,
    lastTriggered: webhook.lastTriggered?.toISOString() ?? null,
    createdAt: webhook.createdAt.toISOString(),
    updatedAt: webhook.updatedAt.toISOString(),
  }
}

async function assertProjectAccess(db: PrismaClient, projectId: string, userId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, ownerId: userId },
    select: { id: true },
  })
  if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" })
}

async function log(db: PrismaClient, projectId: string, userId: string, message: string) {
  await db.auditLog.create({ data: { projectId, userId, message } })
}
