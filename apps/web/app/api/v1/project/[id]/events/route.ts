import { NextRequest } from "next/server"
import { prisma } from "@workspace/db"
import { ApiResponse } from "@/app/api/responses"
import { Project } from "@/server/project"
import { getSession } from "@/server/auth"
import type { Prisma } from "@workspace/db"

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  const { id } = await params

  const session = await getSession()

  if (!session) {
    return ApiResponse.Unauthorized()
  }

  const project = await Project.get(id)

  if (!project) {
    return ApiResponse.NotFound("Project not found")
  }

  if (!await Project.isAuthorized(id, session.user.id)) {
    return ApiResponse.Forbidden("You do not have access to this project")
  }

  const search = new URL(req.url)

  const page = Math.max(
    Number(search.searchParams.get("page") ?? 1),
    1
  )

  const limit = Math.min(
    Math.max(Number(search.searchParams.get("limit") ?? 50), 1),
    100
  )

  const skip = (page - 1) * limit

  const eventId = search.searchParams.get("id")
  const title = search.searchParams.get("title")
  const description = search.searchParams.get("description")
  const pushNotify = search.searchParams.get("pushNotify")
  const category = search.searchParams.get("category")
  const contextId = search.searchParams.get("contextId")
  const createdAt = search.searchParams.get("createdAt")
  const q = search.searchParams.get("q")

  const fieldConditions: Prisma.EventWhereInput[] = []

  if (eventId) {
    fieldConditions.push({ id: { equals: eventId } })
  }

  if (title) {
    fieldConditions.push({ title: { contains: title, mode: "insensitive" } })
  }

  if (description) {
    fieldConditions.push({
      description: { contains: description, mode: "insensitive" },
    })
  }

  if (pushNotify !== null) {
    fieldConditions.push({ pushNotify: pushNotify === "true" })
  }

  if (category) {
    fieldConditions.push({
      category: category === "none" ? null : { equals: category },
    })
  }

  if (contextId) {
    fieldConditions.push({
      contextId: contextId === "none" ? null : { equals: contextId },
    })
  }

  if (createdAt) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (dateRegex.test(createdAt)) {
      const start = new Date(createdAt)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      fieldConditions.push({
        createdAt: {
          gte: start,
          lt: end,
        },
      })
    } else {
      fieldConditions.push({
        createdAt: { equals: new Date(createdAt) },
      })
    }
  }

  if (q) {
    fieldConditions.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
      ],
    })
  }

  const where: Prisma.EventWhereInput = {
    projectId: id,
    AND: [
      {
        OR: [
          {
            contextStart: true,
          },
          {
            contextId: null,
          },
        ],
      },
      ...(fieldConditions.length > 0 ? fieldConditions : []),
    ],
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),

    prisma.event.count({
      where,
    }),
  ])

  const contextIds = events
    .filter((event) => event.contextId)
    .map((event) => event.contextId!)

  const contextEvents = contextIds.length
    ? await prisma.event.findMany({
      where: {
        projectId: id,
        contextId: {
          in: contextIds,
        },
        contextStart: false,
      },
      orderBy: {
        createdAt: "asc",
      },
    })
    : []

  const formatted = events.map((event) => ({
    ...event,
    events: event.contextId
      ? contextEvents.filter(
        (child) => child.contextId === event.contextId
      )
      : undefined,
  }))

  return ApiResponse.Success(undefined, {
    events: formatted,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  })
}