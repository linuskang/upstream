import crypto from "crypto"
import { prisma } from "@workspace/db"

export class Api {
  static async validateKey(
    apiKey: string
  ): Promise<{ valid: boolean; projectId?: string }> {
    if (!apiKey.startsWith("up_")) {
      return { valid: false }
    }

    const hash = crypto.createHash("sha256").update(apiKey).digest("hex")

    const key = await prisma.apiKey.findUnique({
      where: {
        key: hash,
      },
    })

    if (!key || !key.active) {
      return { valid: false }
    }

    await prisma.apiKey.update({
      where: {
        id: key.id,
      },
      data: {
        lastUsed: new Date(),
      },
    })

    return { valid: true, projectId: key.projectId }
  }

  static async log(
    projectId: string,
    endpoint: string,
    method: string,
    status: number,
    userAgent: string | null,
    requestBody: string | null,
    responseBody: string | null
  ) {
    const res = await prisma.requestLog.create({
      data: {
        projectId,
        endpoint,
        method,
        status,
        userAgent,
        requestBody: requestBody ?? undefined,
        responseBody: responseBody ?? undefined,
      },
    })

    return res
  }
}