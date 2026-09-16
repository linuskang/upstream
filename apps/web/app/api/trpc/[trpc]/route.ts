import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "@workspace/api/root"
import { createTRPCContext } from "@/server/trpc/context"

export const dynamic = "force-dynamic"

const handler = (request: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: createTRPCContext,
  })

export { handler as GET, handler as POST }
