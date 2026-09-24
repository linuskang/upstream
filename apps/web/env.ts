import { createEnv } from "@t3-oss/env-core"
import * as z from "zod"

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    BASE_URL: z.url(),

    VAPID_PUBLIC_KEY: z.string().optional(),
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
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true"
})
