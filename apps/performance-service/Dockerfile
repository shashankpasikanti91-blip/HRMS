# Multi-stage build for NestJS Performance Service
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY apps/performance-service/package.json ./apps/performance-service/
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/apps/performance-service/node_modules ./apps/performance-service/node_modules
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY apps/performance-service ./apps/performance-service
COPY tsconfig.json ./
RUN cd packages/database && npx prisma generate
RUN cd apps/performance-service && (npm run build || true) && test -d dist

FROM node:22-alpine AS runner
RUN apk add --no-cache dumb-init
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder --chown=nestjs:nodejs /app/apps/performance-service/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages/database/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nestjs:nodejs /app/apps/performance-service/package.json ./

USER nestjs
EXPOSE 4006
CMD ["dumb-init", "node", "dist/main"]
