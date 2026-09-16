import { config } from "dotenv"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "prisma/config"

if (!process.env.DATABASE_URL) {
  config({
    path: [
      resolve(dirname(fileURLToPath(import.meta.url)), "../../apps/web/.env"),
      resolve(dirname(fileURLToPath(import.meta.url)), "../../.env"),
    ],
  })
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
