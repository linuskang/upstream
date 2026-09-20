// curl -X POST https://up.linus.my/api/v1/log \
// -H "x-api-key: YOUR_API_KEY" \
// -H "Content-Type: application/json" \
// -d '{
//     "title": "Test Event",
//     "icon": "~"
//   }'

// Libraries
import { NextRequest } from "next/server"

// Utilities
import { prisma } from "@workspace/db"

import { Api } from "@/server/api"
import { Usage } from "@/server/usage"
import { Project } from "@/server/project"

import { env } from "@/env"

import {
  sendPushNotification,
  sendEmailNotification,
} from "@/server/notification"

import { ApiResponse } from "@/app/api/responses"
import { getPlan } from "@/subscription-types"

// Types
import { Payload } from "./schema"

async function getProjectOwner(projectId: string) {
  const ownerMember = await prisma.projectMember.findFirst({
    where: { projectId, role: "OWNER" },
    include: { user: true },
  })

  return ownerMember?.user ?? null
}

export async function POST(req: NextRequest) {
  // Pre-flight checks
  const apiKey = req.headers.get("x-api-key")

  if (!apiKey) {
    return ApiResponse.BadRequest("API key is required")
  }

  const validate: {
    valid: boolean
    projectId?: string
  } = await Api.validateKey(apiKey)

  if (!validate.valid) {
    return ApiResponse.Unauthorized("Invalid API key")
  }

  const project = await Project.get(validate.projectId!)

  if (!project) {
    return ApiResponse.NotFound("Project not found")
  }

  const user = await getProjectOwner(project.id)

  if (!user) {
    return ApiResponse.NotFound("User not found")
  }

  // Logging
  const usage = await Usage.increment(user.id)
  const body = await req.json()
  const plan = getPlan(user.plan)

  if (usage.eventCount > plan.maxEventsPerMonth) {
    await Usage.decrement(user.id)
    await Api.log(
      project.id,
      "/api/v1/log",
      "POST",
      429,
      req.headers.get("user-agent"),
      JSON.stringify(body),
      JSON.stringify({
        error:
          "Monthly event quota exceeded. Upgrade your plan to ingest more events.",
      })
    )
    return ApiResponse.BadRequest(
      "Monthly event quota exceeded. Upgrade your plan to ingest more events."
    )
  }

  const parsed = Payload.safeParse(body)

  if (!parsed.success) {
    await Api.log(
      project.id,
      "/api/v1/log",
      "POST",
      400,
      req.headers.get("user-agent"),
      JSON.stringify(body),
      JSON.stringify({
        error: "Invalid request body",
      })
    )
    await Usage.decrement(user.id) // Undos usage if errored, v0.2.4 improvement
    return ApiResponse.BadRequest("Invalid request body")
  }

  const event = parsed.data

  if (
    event.contextId &&
    event.contextStart &&
    (await prisma.event.findFirst({
      where: {
        projectId: project.id,
        contextId: event.contextId,
        contextStart: true,
      },
    }))
  ) {
    await Api.log(
      project.id,
      "/api/v1/log",
      "POST",
      400,
      req.headers.get("user-agent"),
      JSON.stringify(body),
      JSON.stringify({
        error: "Context ID already exists for a context start event",
      })
    )
    await Usage.decrement(user.id) // Undos usage if errored, v0.2.4 improvement
    return ApiResponse.BadRequest(
      "Context ID already exists for a context start event"
    )
  }

  if (event.contextStart && !event.contextId) {
    event.contextId = crypto.randomUUID()
  }

  const res = await prisma.event.create({
    data: {
      projectId: project.id,
      title: event.title,
      icon: event.icon,
      description: event.description,
      category: event.category,
      fields: event.fields ?? undefined,
      data: event.data ?? undefined,
      actions: event.actions ?? undefined,
      contextId: event.contextId ?? undefined,
      contextStart: event.contextStart,
      pushNotify: event.pushNotify,
      emailNotify: event.emailNotify,
    },
  })

  await Api.log(
    project.id,
    "/api/v1/log",
    "POST",
    201,
    req.headers.get("user-agent"),
    JSON.stringify(body),
    JSON.stringify(res)
  )

  if (res.category) {
    await Project.triggerWebhooks(project.id, res.category, res)
  }

  const eventUrl = new URL(`/project/${project.id}/`, req.url)
  eventUrl.searchParams.set("search", `@id="${res.id}"`)

  if (res.pushNotify) {
    await sendPushNotification(user.id, {
      title: res.title,
      body: res.description ?? "triggered a notification",
      url: `/project/${project.id}/?search=%40id%3D"${res.id}"`,
    })
  }

  if (res.emailNotify) {
    const eventDetails = JSON.stringify(res, null, 2)

    await sendEmailNotification(user.id, {
      subject: `Event triggered: ${res.title} in ${project.name}`,
      body: `${eventDetails}\n\nGo to event: ${env.BASE_URL}/project/${project.id}/?search=%40id%3D"${res.id}"\n\nTo stop recieving these notifications, disable email subscriptions in your account settings.`,
    })
  }

  return ApiResponse.Success(undefined, res)
}
