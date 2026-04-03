# Multi-stage build for Vite Marketing App
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY apps/marketing/package.json ./
RUN npm install

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY apps/marketing/ ./
ENV VITE_API_URL=https://api.hrms.srpailabs.com
ENV VITE_APP_URL=https://app.hrms.srpailabs.com
RUN npm run build

# Production - serve with nginx
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY infrastructure/nginx/marketing-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 3001
CMD ["nginx", "-g", "daemon off;"]
