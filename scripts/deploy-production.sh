#!/bin/bash
# ============================================================
# SRP AI HRMS - Production Deployment Script
# Server: 5.223.67.236 (Hetzner)
# ============================================================
set -e

SERVER="root@5.223.67.236"
DEPLOY_DIR="/opt/srp-hrms"
COMPOSE_FILE="infrastructure/docker/docker-compose.prod.yml"

echo "============================================"
echo "  SRP AI HRMS - Production Deployment"
echo "============================================"

# Step 1: Pull latest code
echo ""
echo "[1/5] Pulling latest code on server..."
ssh $SERVER "cd $DEPLOY_DIR && git pull origin main"

# Step 2: Create .env.production if not exists
echo ""
echo "[2/5] Ensuring .env.production exists..."
ssh $SERVER "test -f $DEPLOY_DIR/.env.production && echo '.env.production exists' || echo 'WARNING: .env.production missing! Create it first.'"

# Step 3: Build and deploy containers
echo ""
echo "[3/5] Building and deploying Docker containers..."
ssh $SERVER "cd $DEPLOY_DIR && docker compose -f $COMPOSE_FILE up -d --build --remove-orphans"

# Step 4: Wait for health checks
echo ""
echo "[4/5] Waiting for services to start (60s)..."
sleep 60

# Step 5: Check status
echo ""
echo "[5/5] Checking container status..."
ssh $SERVER "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep srp-hrms"

# Step 6: Reload host nginx
echo ""
echo "[6/6] Reloading host nginx..."
ssh $SERVER "nginx -t && systemctl reload nginx"

echo ""
echo "============================================"
echo "  Deployment Complete!"
echo "============================================"
echo "  Marketing: https://hrms.srpailabs.com"
echo "  Web App:   https://app.hrms.srpailabs.com"
echo "  API:       https://api.hrms.srpailabs.com"
echo "============================================"
