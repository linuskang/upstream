import { initTRPC, TRPCError } from "@trpc/server"
import type { ApiContext } from "./context"

const t = initTRPC.context<ApiContext>().create()

export const router = t.router

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  if (!ctx.session.user.emailVerified) {
    throw new TRPCError({ code: "FORBIDDEN" })
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  })
})
