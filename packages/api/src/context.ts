import type { PrismaClient } from "@workspace/db"

export interface ApiSession {
  user: {
    id: string
    emailVerified: boolean
  }
}

export type SendEmail = (
  to: string,
  subject: string,
  text: string,
  html?: string
) => Promise<void>

export interface ApiContext {
  db: PrismaClient
  session: ApiSession | null
  sendEmail: SendEmail
}
