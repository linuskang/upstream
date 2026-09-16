import { NextRequest } from "next/server"
import { prisma } from "@workspace/db"
import { Project } from "@/server/project"
import { getSession } from "@/server/auth"
import { ApiResponse } from "@/app/api/responses"

export async function GET(
  request: NextRequest,
  { params }: {
    params: Promise<{ id: string }>
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
    include: {
      apiKeys: {
        include: {
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

  const keys = project.apiKeys.map((key) => ({
    id: key.id,
    name: key.name,
    createdAt: key.createdAt,
    lastUsed: key.lastUsed,
    addedBy: key.addedBy,
    active: key.active,
  }))

  return ApiResponse.Success(undefined, keys)
}

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>
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
  })

  if (!project) {
    return ApiResponse.NotFound()
  }

  const body = await request.json()

  if (!body.name) {
    return ApiResponse.BadRequest()
  }

  const key = await Project.addApiKey(id, session.user.id, body.name)
  await Project.log(id, session.user.id, `Created API key ${body.name}`)

  return ApiResponse.Success(undefined, key)
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  const session = await getSession()

  if (!session) {
    return ApiResponse.Unauthorized()
  }

  const { id } = await params
  const body = await request.json()

  if (!body.keyId) {
    return ApiResponse.BadRequest()
  }

  if (!await Project.isAuthorized(id, session.user.id)) {
    return ApiResponse.Forbidden("You do not have access to this project")
  }

  const key = await prisma.apiKey.findUnique({
    where: {
      id: body.keyId,
      projectId: id,
    },
  })

  if (!key) {
    return ApiResponse.NotFound()
  }

  await prisma.apiKey.delete({
    where: {
      id: body.keyId,
      projectId: id,
    },
  })

  await Project.log(id, session.user.id, `Deleted API key ${key.name}`)

  return ApiResponse.Success()
}
