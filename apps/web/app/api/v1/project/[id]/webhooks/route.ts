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
      webhooks: true,
    },
  })

  if (!project) {
    return ApiResponse.NotFound()
  }

  return ApiResponse.Success(undefined, project.webhooks)
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

  const body = await request.json()

  if (!body.name || !body.subscription || !body.url) {
    return ApiResponse.BadRequest()
  }

  const project = await prisma.project.findUnique({
    where: {
      id,
      ownerId: session.user.id,
    },
  })

  if (!project) {
    return ApiResponse.NotFound()
  }

  const webhook = await Project.newWebhook(
    id,
    body.name,
    body.subscription,
    body.url
  )

  await Project.log(id, session.user.id, `Created webhook ${body.name}`)

  return ApiResponse.Success(undefined, { webhookId: webhook.id })
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

  if (!body.webhookId) {
    return ApiResponse.BadRequest()
  }

  const project = await prisma.project.findUnique({
    where: {
      id,
      ownerId: session.user.id,
    },
  })

  if (!project) {
    return ApiResponse.NotFound()
  }

  const webhook = await prisma.webhook.findUnique({
    where: {
      id: body.webhookId,
      projectId: id,
    },
  })

  if (!webhook) {
    return ApiResponse.NotFound()
  }

  await prisma.webhook.delete({
    where: {
      id: body.webhookId,
    },
  })

  await Project.log(id, session.user.id, `Deleted webhook ${webhook.name}`)

  return ApiResponse.Success()
}

export async function PATCH(
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

  if (!body.webhookId) {
    return ApiResponse.BadRequest()
  }

  const project = await prisma.project.findUnique({
    where: {
      id,
      ownerId: session.user.id,
    },
  })

  if (!project) {
    return ApiResponse.NotFound()
  }

  const webhook = await prisma.webhook.findUnique({
    where: {
      id: body.webhookId,
      projectId: id,
    },
  })

  if (!webhook) {
    return ApiResponse.NotFound()
  }

  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.url !== undefined) data.url = body.url
  if (body.subscription !== undefined) data.subscription = body.subscription
  if (body.enabled !== undefined) data.enabled = body.enabled

  const updated = await prisma.webhook.update({
    where: {
      id: body.webhookId,
    },
    data,
  })

  await Project.log(id, session.user.id, `Updated webhook ${body.name}`)

  return ApiResponse.Success(undefined, updated)
}
