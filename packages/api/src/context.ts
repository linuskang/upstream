import type { PrismaClient } from "@workspace/db"

export interface ApiSession {
  user: {
    id: string
  }
}

export interface ApiContext {
  db: PrismaClient
  session: ApiSession | null
}
