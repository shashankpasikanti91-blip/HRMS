# Lightweight build for Next.js Web App (no full monorepo install)
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install only web app dependencies
FROM base AS deps
COPY apps/web/package.json ./
RUN npm install --legacy-peer-deps

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web/ ./
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=https://api.hrms.srpailabs.com
ENV NEXT_PUBLIC_APP_URL=https://app.hrms.srpailabs.com
ENV NEXT_PUBLIC_MARKETING_URL=https://hrms.srpailabs.com
ARG NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
ARG NEXT_PUBLIC_TELEGRAM_CHAT_ID
ENV NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=$NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
ENV NEXT_PUBLIC_TELEGRAM_CHAT_ID=$NEXT_PUBLIC_TELEGRAM_CHAT_ID
RUN npm run build

# Production
FROM node:22-alpine AS runner
RUN apk add --no-cache dumb-init
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["dumb-init", "node", "server.js"]
