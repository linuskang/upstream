import type { Prisma, PrismaClient } from "@workspace/db"
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { router, protectedProcedure } from "../trpc"

export type DashboardEvent = {
  id: string
  title: string
  icon: string
  description?: string
  category?: string
  fields?: { title: string; value: string }[]
  actions?: { title: string; variant: "primary" | "secondary" | "ghost"; url: string }[]
  data?: unknown
  events?: DashboardEvent[]
  contextId?: string
  pushNotify: boolean
  emailNotify: boolean
  projectId: string
  createdAt: string
}

type EventListPage = {
  events: DashboardEvent[]
  total: number
  page: number
  limit: number
  nextCursor?: number
}

type RawEvent = {
  id: string
  title: string
  icon: string
  description: string | null
  category: string | null
  fields: Prisma.JsonValue | null
  actions: Prisma.JsonValue | null
  data: Prisma.JsonValue | null
  contextId: string | null
  pushNotify: boolean
  emailNotify: boolean
  projectId: string
  createdAt: Date
}

const eventFilters = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  pushNotify: z.enum(["true", "false"]).optional(),
  category: z.string().optional(),
  contextId: z.string().optional(),
  createdAt: z.string().optional(),
  q: z.string().optional(),
})

export const eventRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          projectId: z.string().uuid(),
          limit: z.number().int().min(1).max(100).default(20),
          cursor: z.number().int().min(1).default(1),
        })
        .extend(eventFilters.shape)
    )
    .query(async ({ ctx, input }) => {
      await assertProjectAccess(ctx.db, input.projectId, ctx.session.user.id)

      const fieldConditions: Prisma.EventWhereInput[] = []

      if (input.id) fieldConditions.push({ id: input.id })
      if (input.title) {
        fieldConditions.push({
          title: { contains: input.title, mode: "insensitive" },
        })
      }
      if (input.description) {
        fieldConditions.push({
          description: { contains: input.description, mode: "insensitive" },
        })
      }
      if (input.pushNotify) {
        fieldConditions.push({ pushNotify: input.pushNotify === "true" })
      }
      if (input.category) {
        fieldConditions.push({
          category: input.category === "none" ? null : input.category,
        })
      }
      if (input.contextId) {
        fieldConditions.push({
          contextId: input.contextId === "none" ? null : input.contextId,
        })
      }
      if (input.createdAt) {
        const date = new Date(input.createdAt)
        if (!Number.isNaN(date.getTime())) {
          const end = new Date(date)
          end.setDate(end.getDate() + 1)
          fieldConditions.push({
            createdAt: {
              gte: date,
              lt: end,
            },
          })
        }
      }
      if (input.q) {
        fieldConditions.push({
          OR: [
            { title: { contains: input.q, mode: "insensitive" } },
            { description: { contains: input.q, mode: "insensitive" } },
            { category: { contains: input.q, mode: "insensitive" } },
          ],
        })
      }

      const where: Prisma.EventWhereInput = {
        projectId: input.projectId,
        AND: [
          {
            OR: [{ contextStart: true }, { contextId: null }],
          },
          ...fieldConditions,
        ],
      }

      const skip = (input.cursor - 1) * input.limit
      const [events, total] = await Promise.all([
        ctx.db.event.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: input.limit,
        }),
        ctx.db.event.count({ where }),
      ])

      const contextIds = events.flatMap((event) =>
        event.contextId ? [event.contextId] : []
      )
      const contextEvents = contextIds.length
        ? await ctx.db.event.findMany({
            where: {
              projectId: input.projectId,
              contextId: { in: contextIds },
              contextStart: false,
            },
            orderBy: { createdAt: "asc" },
          })
        : []

      const formatted: DashboardEvent[] = events.map((event) =>
        serializeEvent(
          event,
          event.contextId
            ? contextEvents.filter((child) => child.contextId === event.contextId)
            : []
        )
      )

      const pages = Math.ceil(total / input.limit)
      const result: EventListPage = {
        events: formatted,
        total,
        page: input.cursor,
        limit: input.limit,
        nextCursor: input.cursor < pages ? input.cursor + 1 : undefined,
      }

      return result
    }),

  categories: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertProjectAccess(ctx.db, input.projectId, ctx.session.user.id)

      const [total, grouped] = await Promise.all([
        ctx.db.event.count({ where: { projectId: input.projectId } }),
        ctx.db.event.groupBy({
          by: ["category"],
          where: { projectId: input.projectId },
          _count: { id: true },
        }),
      ])

      return {
        total,
        categories: grouped.map((group) => ({
          name: group.category ?? "none",
          count: group._count.id,
        })),
      }
    }),
})

async function assertProjectAccess(
  db: PrismaClient,
  projectId: string,
  userId: string
) {
  const project = await db.project.findFirst({
    where: { id: projectId, ownerId: userId },
    select: { id: true },
  })

  if (!project) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" })
  }
}

function serializeEvent(
  event: RawEvent,
  children: RawEvent[]
): DashboardEvent {
  return {
    id: event.id,
    title: event.title,
    icon: event.icon,
    description: event.description ?? undefined,
    category: event.category ?? undefined,
    fields: (event.fields ?? undefined) as DashboardEvent["fields"],
    actions: (event.actions ?? undefined) as DashboardEvent["actions"],
    data: event.data ?? undefined,
    events: children.length
      ? children.map((child) => serializeEvent(child, []))
      : undefined,
    contextId: event.contextId ?? undefined,
    pushNotify: event.pushNotify,
    emailNotify: event.emailNotify,
    projectId: event.projectId,
    createdAt: event.createdAt.toISOString(),
  }
}
