import { prisma } from "@workspace/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env } from "@/env"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { Email } from "@/server/email";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  })
}

export async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/login")
  }
  return session
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  baseURL: env.BASE_URL,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async (data) => {
      await Email.send(
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

      const existing = await prisma.user.findUnique({
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
      await Email.send(
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
});
