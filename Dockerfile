# Dependencies
FROM node:26-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY tooling/eslint/package.json ./tooling/eslint/package.json
COPY tooling/typescript/package.json ./tooling/typescript/package.json
RUN npm ci --workspaces --include-workspace-root

FROM node:26-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app/packages/db
RUN npx prisma generate

WORKDIR /app/apps/web
ARG SKIP_ENV_VALIDATION=false
RUN SKIP_ENV_VALIDATION=$SKIP_ENV_VALIDATION npm run build

FROM node:26-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV NODE_OPTIONS="--no-network-family-autoselection --dns-result-order=ipv4first"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/server ./apps/web/.next/server
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/generated ./packages/db/generated
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/prisma.config.ts ./packages/db/prisma.config.ts

# Next.js' standalone output strips package.json files from node_modules, but Prisma's
# config loader needs the full `dotenv` package. Copy the complete dependency from deps.
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/dotenv ./node_modules/dotenv
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/entrypoint.sh ./entrypoint.sh

# Install the Prisma CLI globally so migrations can run at startup.
# It is only a dev dependency, so it is not included in Next.js' standalone output.
COPY --from=builder /app/packages/db/package.json /tmp/db-package.json
RUN PRISMA_VERSION=$(node -p "require('/tmp/db-package.json').devDependencies.prisma") && \
    npm install -g prisma@${PRISMA_VERSION} && \
    rm /tmp/db-package.json

RUN sed -i 's/\r$//' ./entrypoint.sh && chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
