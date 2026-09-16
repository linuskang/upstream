import { router } from "./trpc"
import { accountRouter } from "./routers/account"
import { projectRouter } from "./routers/project"
import { usageRouter } from "./routers/usage"

export const appRouter = router({
  account: accountRouter,
  project: projectRouter,
  usage: usageRouter,
})

export type AppRouter = typeof appRouter
