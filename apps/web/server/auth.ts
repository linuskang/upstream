import { createAuth } from "@workspace/auth/server"
import { prisma } from "@workspace/db"
import { headers } from "next/headers"

import { env } from "@workspace/env"
import { Email } from "@/server/email"

export const auth = createAuth({
  db: prisma,
  env,
  sendEmail: (to, subject, text, html) => Email.send(to, subject, text, html),
})

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  })
}
