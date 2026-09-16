# Dependencies
FROM node:26-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY tooling/eslint/package.json ./tooling/eslint/package.json
COPY tooling/typescript/package.json ./tooling/typescript/package.json
RUN npm ci --workspaces --include-workspace-root

FROM node:26-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV BASE_URL="http://localhost:3000"
ENV BETTER_AUTH_SECRET="oiwehjfiwheiofhweiofhwioehfoiwehifhweiofoihwefihweifhiwehf"
ENV BETTER_AUTH_URL="http://localhost:3000"
ENV VAPID_PRIVATE_KEY="privatekey"
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY="BCPa_p_M-CkigwhRXiJnRAVpbKlfayVU6X_O71kkgUG84gCcP4f5xtp-e_74M1p-ftrkkn03Ot4tnblnthC01vk"
ENV GITHUB_CLIENT_ID="ci-placeholder"
ENV GITHUB_CLIENT_SECRET="ci-placeholder"
ENV RESEND_API_KEY="ci-placeholder"
ENV VAPID_EMAIL="noreply@localhost.com"
ENV RESEND_EMAIL_FROM="noreply@localhost"

WORKDIR /app/apps/web
RUN npx prisma generate
RUN npm run build

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
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/generated ./apps/web/generated
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/prisma ./apps/web/prisma
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/entrypoint.sh ./entrypoint.sh

RUN sed -i 's/\r$//' ./entrypoint.sh && chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
