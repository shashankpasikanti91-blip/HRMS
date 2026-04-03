# Multi-stage build for Next.js Web App
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY apps/api-gateway/package.json ./apps/api-gateway/
COPY apps/auth-service/package.json ./apps/auth-service/
COPY apps/core-hr-service/package.json ./apps/core-hr-service/
COPY apps/attendance-service/package.json ./apps/attendance-service/
COPY apps/payroll-service/package.json ./apps/payroll-service/
COPY apps/recruitment-service/package.json ./apps/recruitment-service/
COPY apps/performance-service/package.json ./apps/performance-service/
COPY apps/notification-service/package.json ./apps/notification-service/
COPY apps/analytics-service/package.json ./apps/analytics-service/
COPY apps/web/package.json ./apps/web/
COPY apps/marketing/package.json ./apps/marketing/
RUN npm ci

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
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

# In a monorepo, Next.js standalone output places files relative to the monorepo root
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["dumb-init", "node", "apps/web/server.js"]
