# Multi-stage build for NestJS Core HR Service
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

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
RUN npm ci --workspace=@srp/core-hr-service --workspace=@srp/shared --workspace=@srp/database --include-workspace-root

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/apps/core-hr-service/node_modules ./apps/core-hr-service/node_modules
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY apps/core-hr-service ./apps/core-hr-service
COPY tsconfig.json ./
RUN cd packages/database && npx prisma generate
RUN cd apps/core-hr-service && npm run build

FROM node:22-alpine AS runner
RUN apk add --no-cache dumb-init
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder --chown=nestjs:nodejs /app/apps/core-hr-service/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages/database/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nestjs:nodejs /app/apps/core-hr-service/package.json ./

USER nestjs
EXPOSE 4002
CMD ["dumb-init", "node", "dist/main"]
