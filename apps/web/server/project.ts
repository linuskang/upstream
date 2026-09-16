import { prisma } from "@workspace/db"
import crypto from "crypto"

export interface WebhookEventPayload {
  id: string
  title: string
  icon: string
  description: string | null
  category: string | null
  fields: unknown
  events?: unknown
  data: unknown
  actions: unknown
  createdAt: Date
  projectId: string
}

export class Project {
  static async delete(projectId: string) {
    await prisma.project.delete({
      where: {
        id: projectId,
      },
    })
    return true
  }

  static async create(ownerId: string, name: string) {
    const newProject = await prisma.project.create({
      data: {
        name,
        ownerId,
      },
    })

    return newProject
  }

  static async rename(projectId: string, name: string) {
    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        name,
      },
    })
    return true
  }

  static async addApiKey(projectId: string, addedById: string, name: string) {
    const apiKey = "up_" + crypto.randomUUID().replace(/-/g, "")
    const hash = crypto.createHash("sha256").update(apiKey).digest("hex")

    // TODO: add hint to api key that records first 4 characters
    // e.g. "up_jt83..."

    await prisma.apiKey.create({
      data: {
        name,
        key: hash,
        addedById,
        projectId,
      },
    })

    return apiKey
  }

  static async count(ownerId: string) {
    const count = await prisma.project.count({
      where: {
        ownerId,
      },
    })

    return count
  }

  static async getOwner(projectId: string) {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        ownerId: true,
        owner: {
          select: {
            id: true,
            plan: true,
          },
        },
      },
    })

    return project?.owner ?? null
  }

  static async log(projectId: string, userId: string, message: string) {
    const res = await prisma.auditLog.create({
      data: {
        projectId,
        userId,
        message,
      },
    })

    return res
  }

  static async newWebhook(
    projectId: string,
    name: string,
    subscription: string,
    url: string
  ) {
    const res = await prisma.webhook.create({
      data: {
        projectId,
        name,
        subscription,
        url,
      },
    })

    return res
  }

  static async getWebhooks(projectId: string) {
    const webhooks = await prisma.webhook.findMany({
      where: {
        projectId,
      },
    })

    return webhooks
  }

  static async triggerWebhooks(
    projectId: string,
    subscription: string,
    event: WebhookEventPayload
  ) {
    const webhooks = await prisma.webhook.findMany({
      where: {
        projectId,
        subscription,
        enabled: true,
      },
    })

    for (const webhook of webhooks) {
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          lastTriggered: new Date(),
        },
      })

      fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }).catch((err) => {
        console.log(err)
      })
    }
  }

  static async get(projectId: string) {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    })

    return project
  }

  static async isAuthorized(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        ownerId: true,
      },
    })

    if (!project) {
      return false
    }

    return project.ownerId === userId
  }
}
