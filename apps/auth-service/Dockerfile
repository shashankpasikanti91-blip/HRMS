# Multi-stage build for NestJS Auth Service
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY apps/auth-service/package.json ./apps/auth-service/
RUN npm ci --workspace=@srp/auth-service --include-workspace-root

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/apps/auth-service/node_modules ./apps/auth-service/node_modules
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY apps/auth-service ./apps/auth-service
COPY tsconfig.json ./
RUN cd packages/database && npx prisma generate
RUN cd apps/auth-service && npm run build

# Production
FROM node:22-alpine AS runner
RUN apk add --no-cache dumb-init
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder --chown=nestjs:nodejs /app/apps/auth-service/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages/database/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nestjs:nodejs /app/apps/auth-service/package.json ./

USER nestjs
EXPOSE 4001
CMD ["dumb-init", "node", "dist/main"]
