import type { PrismaClient } from "@workspace/db"
import { betterAuth } from "better-auth"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { lastLoginMethod } from "better-auth/plugins"
import { prismaAdapter } from "better-auth/adapters/prisma"

export type AuthEnvironment = {
  BASE_URL: string
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  ALLOW_SIGNUP: boolean
}

export type SendAuthEmail = (
  to: string,
  subject: string,
  text: string
) => Promise<void>

export function createAuth({
  db,
  env,
  sendEmail,
}: {
  db: PrismaClient
  env: AuthEnvironment
  sendEmail: SendAuthEmail
}) {
  return betterAuth({
    database: prismaAdapter(db, { provider: "postgresql" }),
    baseURL: env.BASE_URL,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async (data) => {
        await sendEmail(
          data.user.email,
          "Upstream - Reset your password",
          `Reset your password by clicking the following link: ${data.url}`
        )
      },
    },
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/sign-up/email") return

        if (!env.ALLOW_SIGNUP) {
          throw new APIError("FORBIDDEN", {
            message:
              "Signups are currently disabled. Please contact the administrator.",
          })
        }

        const email = ctx.body?.email
        if (typeof email !== "string") return

        const existing = await db.user.findUnique({
          where: {
            email: email.toLowerCase(),
          },
          select: {
            id: true,
          },
        })

        if (existing) {
          throw new APIError("UNPROCESSABLE_ENTITY", {
            message:
              "A user with this email already exists. Please log in instead.",
          })
        }
      }),
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (!env.ALLOW_SIGNUP) {
              throw new APIError("FORBIDDEN", {
                message:
                  "Signups are currently disabled. Please contact the administrator.",
              })
            }

            if (!user.image && user.name) {
              const seed = encodeURIComponent(user.name)
              return {
                data: {
                  ...user,
                  image: `https://avatars.lkang.au/10.x/glass/svg?seed=${seed}`,
                },
              }
            }
          },
        },
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      sendVerificationEmail: async (data) => {
        await sendEmail(
          data.user.email,
          "Upstream - Verify your email",
          `Please verify your email by clicking the following link: ${data.url}`
        )
      },
    },
    user: {
      additionalFields: {
        pushNotificationsEnabled: {
          type: "boolean",
          defaultValue: true,
        },
        emailNotificationsEnabled: {
          type: "boolean",
          defaultValue: true,
        },
      },
    },
    plugins: [
      lastLoginMethod()
    ]
  })
}
