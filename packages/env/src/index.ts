import { config } from "dotenv"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

config({
  path: resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env"),
})

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    BASE_URL: z.url(),

    VAPID_PUBLIC_KEY: z.string(),
    VAPID_PRIVATE_KEY: z.string(),
    VAPID_EMAIL: z.email(),

    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.url(),

    GITHUB_CLIENT_ID: z.string(),
    GITHUB_CLIENT_SECRET: z.string(),

    ALLOW_SIGNUP: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),

    RESEND_API_KEY: z.string(),
    RESEND_EMAIL_FROM: z.string(),

    CRON_SECRET: z.string().optional(),
  },

  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
})
