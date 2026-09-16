import { NextRequest } from "next/server"
import { getSession } from "@/server/auth"
import { Project } from "@/server/project"
import { prisma } from "@workspace/db"
import { ApiResponse } from "@/app/api/responses"

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string
    }>
  }
) {
  const session = await getSession()

  if (!session) {
    return ApiResponse.Unauthorized()
  }

  const { id } = await params

  const project = await prisma.project.findUnique({
    where: {
      id,
      ownerId: session.user.id,
    },

    select: {
      name: true,
      id: true,
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
    return ApiResponse.NotFound()
  }

  return ApiResponse.Success(undefined, project)
}

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string
    }>
  }
) {
  const session = await getSession()

  if (!session) {
    return ApiResponse.Unauthorized()
  }

  const { id } = await params
  const body = await request.json()

  if (!body.name) {
    return ApiResponse.BadRequest()
  }

  const project = await prisma.project.findUnique({
    where: {
      id,
      ownerId: session.user.id,
    },
    select: {
      id: true,
      name: true,
    },
  })

  if (!project) {
    return ApiResponse.NotFound()
  }

  await Project.rename(id, body.name)
  await Project.log(id, session.user.id, `Renamed project to ${body.name}`)

  return ApiResponse.Success(
    "Renamed project from " + project.name + " to " + body.name
  )
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string
    }>
  }
) {
  const session = await getSession()

  if (!session) {
    return ApiResponse.Unauthorized()
  }

  const { id } = await params

  const project = await prisma.project.findUnique({
    where: {
      id,
      ownerId: session.user.id,
    },

    select: {
      id: true,
    },
  })

  if (!project) {
    return ApiResponse.NotFound()
  }

  await Project.delete(id)

  return ApiResponse.Success("Project deleted", project)
}
