import { z } from "zod"
import { TRPCError } from "@trpc/server"
import type { PrismaClient } from "@workspace/db"
import { getPlan } from "../subscription-types"
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

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(80),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const [projectCount, user] = await Promise.all([
        ctx.db.project.count({ where: { ownerId: userId } }),
        ctx.db.user.findUnique({
          where: { id: userId },
          select: { plan: true },
        }),
      ])

      if (!user) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
      }

      if (projectCount >= getPlan(user.plan).maxProjects) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Project limit reached. Upgrade your plan to create more projects.",
        })
      }

      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          ownerId: userId,
        },
        select: {
          id: true,
          name: true,
        },
      })

      await ctx.db.auditLog.create({
        data: {
          projectId: project.id,
          userId,
          message: `Created project ${input.name}`,
        },
      })

      return project
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.id,
          ownerId: ctx.session.user.id,
        },
        select: {
          id: true,
          name: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          apiKeys: {
            select: {
              id: true,
              name: true,
              createdAt: true,
              active: true,
              lastUsed: true,
              addedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      })

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" })
      }

      return {
        ...project,
        apiKeys: project.apiKeys.map((apiKey) => ({
          ...apiKey,
          createdAt: apiKey.createdAt.toISOString(),
          lastUsed: apiKey.lastUsed?.toISOString() ?? null,
        })),
      }
    }),

  rename: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().trim().min(1).max(80),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.id, ownerId: ctx.session.user.id },
        select: { name: true },
      })

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" })
      }

      await ctx.db.project.update({
        where: { id: input.id },
        data: { name: input.name },
      })
      await ctx.db.auditLog.create({
        data: {
          projectId: input.id,
          userId: ctx.session.user.id,
          message: `Renamed project to ${input.name}`,
        },
      })

      return { id: input.id, name: input.name }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.id, ownerId: ctx.session.user.id },
        select: { id: true },
      })

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" })
      }

      await ctx.db.project.delete({ where: { id: input.id } })
      return { id: input.id }
    }),
})
