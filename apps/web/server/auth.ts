import { createAuth } from "@workspace/auth/server"
import { prisma } from "@workspace/db"
import { headers } from "next/headers"

import { env } from "@/env"
import { Email } from "@/server/email"

export const auth = createAuth({
  db: prisma,
  env,
  sendEmail: (to, subject, text) => Email.send(to, subject, text),
})

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  })
}
