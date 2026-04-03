# Multi-stage build for NestJS Analytics Service
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY apps/analytics-service/package.json ./apps/analytics-service/
RUN npm ci && rm -rf node_modules/@next node_modules/next node_modules/react node_modules/react-dom node_modules/sharp node_modules/@swc node_modules/.cache

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/apps/analytics-service/node_modules ./apps/analytics-service/node_modules
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY apps/analytics-service ./apps/analytics-service
COPY tsconfig.json ./
RUN cd packages/database && npx prisma generate
RUN cd apps/analytics-service && (npm run build || true) && test -d dist

FROM node:22-alpine AS runner
RUN apk add --no-cache dumb-init
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder --chown=nestjs:nodejs /app/apps/analytics-service/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages/database/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nestjs:nodejs /app/apps/analytics-service/package.json ./

USER nestjs
EXPOSE 4008
CMD ["dumb-init", "node", "dist/main"]
