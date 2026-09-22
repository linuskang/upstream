import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { getPlan } from "../subscription-types"
import { router, protectedProcedure } from "../trpc"
import { requireProjectAccess } from "../permissions"

export const projectRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const projects = await ctx.db.project.findMany({
      where: {
        members: {
          some: {
            userId: ctx.session.user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        members: {
          select: {
            role: true,
            user: {
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

    return projects.map((project) => {
      const owner = project.members.find((member) => member.role === "OWNER")

      return {
        ...project,
        members: project.members.map((member) => ({
          ...member.user,
          role: member.role,
        })),
        owner: owner
          ? {
              id: owner.user.id,
              name: owner.user.name,
              email: owner.user.email,
              image: owner.user.image,
            }
          : null,
      }
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
          members: {
            create: {
              userId,
              role: "OWNER",
            },
          },
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
      const userId = ctx.session.user.id
      await requireProjectAccess(ctx.db, input.id, userId, "VIEW")

      const project = await ctx.db.project.findUnique({
        where: {
          id: input.id,
        },
        select: {
          id: true,
          name: true,
          members: {
            select: {
              id: true,
              role: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
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
      await requireProjectAccess(ctx.db, input.id, ctx.session.user.id, "OWNER")

      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
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
      await requireProjectAccess(ctx.db, input.id, ctx.session.user.id, "OWNER")

      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
        select: { id: true },
      })

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" })
      }

      await ctx.db.project.delete({ where: { id: input.id } })
      return { id: input.id }
    }),
})
