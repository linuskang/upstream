import { initTRPC, TRPCError } from "@trpc/server"
import type { ApiContext } from "./context"

const t = initTRPC.context<ApiContext>().create()

export const router = t.router

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  })
})
