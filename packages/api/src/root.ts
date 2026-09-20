import { router } from "./trpc"
import { accountRouter } from "./routers/account"
import { projectRouter } from "./routers/project"
import { usageRouter } from "./routers/usage"
import { eventRouter } from "./routers/event"
import { apiKeyRouter } from "./routers/api-key"
import { webhookRouter } from "./routers/webhook"
import { projectSettingsRouter } from "./routers/project-settings"
import { projectMemberRouter } from "./routers/project-member"

export const appRouter = router({
  account: accountRouter,
  project: projectRouter,
  usage: usageRouter,
  event: eventRouter,
  apiKey: apiKeyRouter,
  webhook: webhookRouter,
  projectSettings: projectSettingsRouter,
  projectMember: projectMemberRouter,
})

export type AppRouter = typeof appRouter
