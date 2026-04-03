# Multi-stage build for NestJS Notification Service
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY apps/notification-service/package.json ./apps/notification-service/
RUN npm ci --workspace=@srp/notification-service --include-workspace-root

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/apps/notification-service/node_modules ./apps/notification-service/node_modules
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY apps/notification-service ./apps/notification-service
COPY tsconfig.json ./
RUN cd packages/database && npx prisma generate
RUN cd apps/notification-service && npm run build

FROM node:22-alpine AS runner
RUN apk add --no-cache dumb-init
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder --chown=nestjs:nodejs /app/apps/notification-service/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages/database/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nestjs:nodejs /app/apps/notification-service/package.json ./

USER nestjs
EXPOSE 4007
CMD ["dumb-init", "node", "dist/main"]
