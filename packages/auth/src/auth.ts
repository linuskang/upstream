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
  text: string,
  html?: string
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
    database: prismaAdapter(db, { 
      provider: "postgresql" 
    }),

    baseURL: env.BASE_URL,

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      sendResetPassword: async (data) => {
        await sendEmail(
          data.user.email,
          "Reset your password",
          `Reset your password by clicking the following link: ${data.url}`,
          `<div style="font-family: Arial, sans-serif; color: #0f172a;">
            <p>We received a request to reset your Upstream password.</p>
            <p>
              <a href="${data.url}" style="display: inline-block; padding: 10px 16px; border-radius: 6px; background-color: #0f172a; color: #ffffff; text-decoration: none;">
                Reset your password
              </a>
            </p>
            <p style="font-size: 12px; color: #64748b;">
              If the button doesn't work, copy and paste this URL into your browser:<br />
              ${data.url}
            </p>
          </div>`
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
              "Sign ups are currently disabled. Please contact the administrator.",
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
              "Email already exists",
          })
        }
      }),
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
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
      sendVerificationEmail: async (data) => {
        await sendEmail(
          data.user.email,
          "Verify your email",
          `Please verify your email by clicking the following link: ${data.url}`,
          `<div style="font-family: Arial, sans-serif; color: #0f172a;">
            <p>Welcome to Upstream! Please verify your email address.</p>
            <p>
              <a href="${data.url}" style="display: inline-block; padding: 10px 16px; border-radius: 6px; background-color: #0f172a; color: #ffffff; text-decoration: none;">
                Verify your email
              </a>
            </p>
            <p style="font-size: 12px; color: #64748b;">
              If the button doesn't work, copy and paste this URL into your browser:<br />
              ${data.url}
            </p>
          </div>`
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
