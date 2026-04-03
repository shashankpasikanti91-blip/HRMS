# Multi-stage build for NestJS API Gateway
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY apps/api-gateway/package.json ./apps/api-gateway/
RUN npm ci --workspace=@srp/api-gateway --include-workspace-root

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/apps/api-gateway/node_modules ./apps/api-gateway/node_modules
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY apps/api-gateway ./apps/api-gateway
COPY tsconfig.json ./
RUN cd packages/database && npx prisma generate
RUN cd apps/api-gateway && npm run build

# Production
FROM node:22-alpine AS runner
RUN apk add --no-cache dumb-init
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder --chown=nestjs:nodejs /app/apps/api-gateway/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages/database/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nestjs:nodejs /app/apps/api-gateway/package.json ./

USER nestjs
EXPOSE 4000
CMD ["dumb-init", "node", "dist/main"]
