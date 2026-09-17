import { prisma } from "@workspace/db"

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

}
