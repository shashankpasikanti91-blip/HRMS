# Multi-stage build for Next.js Web App
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY apps/web/package.json ./apps/web/
RUN npm ci --workspace=@srp/web --include-workspace-root

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY apps/web ./apps/web
COPY tsconfig.json ./

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=https://api.hrms.srpailabs.com
ENV NEXT_PUBLIC_APP_URL=https://app.hrms.srpailabs.com
ENV NEXT_PUBLIC_MARKETING_URL=https://hrms.srpailabs.com

RUN cd apps/web && npm run build

# Production
FROM node:22-alpine AS runner
RUN apk add --no-cache dumb-init
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["dumb-init", "node", "server.js"]
