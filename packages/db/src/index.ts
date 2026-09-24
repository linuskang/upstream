import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client"
import { env } from "@workspace/env"

const adapter = new PrismaPg(env.DATABASE_URL)
const prisma = new PrismaClient({ adapter })

export { prisma }
export * from "../generated/prisma/client"
