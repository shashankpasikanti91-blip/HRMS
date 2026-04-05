#!/bin/bash
# ============================================================
# SRP AI HRMS — FastAPI Backend Deployment Script
# Server: root@5.223.67.236 (Hetzner)
# Target: https://api.hrms.srpailabs.com  → 127.0.0.1:8001
# ============================================================
set -e

SERVER="root@5.223.67.236"
DEPLOY_DIR="/opt/srp-hrms"
COMPOSE_FILE="infrastructure/docker/docker-compose.prod.yml"
ENV_FILE=".env.production"
NGINX_CONF="infrastructure/nginx/hrms.srpailabs.com"
NGINX_DEST="/etc/nginx/sites-available/hrms.srpailabs.com"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo ""
echo "=============================================="
echo "  SRP AI HRMS — FastAPI Backend Deployment"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="

# ── Pre-flight: check SSH connection ─────────────────────────────────────────
echo ""
echo "[0/8] Checking SSH connection..."
ssh -o ConnectTimeout=10 "$SERVER" "echo OK" > /dev/null || fail "Cannot reach $SERVER"
log "SSH OK"

# ── Step 1: Pull latest code ──────────────────────────────────────────────────
echo ""
echo "[1/8] Pulling latest code on server..."
ssh "$SERVER" "cd $DEPLOY_DIR && git pull origin main"
log "Code up to date"

# ── Step 2: Ensure required env vars exist ────────────────────────────────────
echo ""
echo "[2/8] Checking required env vars in $ENV_FILE..."
MISSING=$(ssh "$SERVER" "
  cd $DEPLOY_DIR
  REQUIRED='FASTAPI_SECRET_KEY FASTAPI_SUPER_ADMIN_EMAIL FASTAPI_SUPER_ADMIN_PASSWORD DB_USERNAME DB_PASSWORD DB_DATABASE REDIS_PASSWORD'
  missing=''
  for var in \$REQUIRED; do
    grep -q \"^\${var}=\" $ENV_FILE 2>/dev/null || missing=\"\$missing \$var\"
  done
  echo \$missing
")

if [ -n "$MISSING" ]; then
  warn "Missing env vars in $ENV_FILE on server: $MISSING"
  echo ""
  echo "  SSH to the server and add to $DEPLOY_DIR/$ENV_FILE:"
  echo ""
  echo "    FASTAPI_SECRET_KEY=$(openssl rand -hex 32)"
  echo "    FASTAPI_SUPER_ADMIN_EMAIL=superadmin@yourcompany.com"
  echo "    FASTAPI_SUPER_ADMIN_PASSWORD=YourSuperSecurePass@2026"
  echo ""
  fail "Fix missing env vars first, then re-run this script."
fi
log "Env vars OK"

# ── Step 3: Create hrms_backend database ─────────────────────────────────────
echo ""
echo "[3/8] Creating hrms_backend database (if not exists)..."
ssh "$SERVER" "
  cd $DEPLOY_DIR
  source <(grep -E '^(DB_USERNAME|DB_PASSWORD|DB_DATABASE)=' $ENV_FILE)
  docker exec srp-hrms-postgres psql -U \"\$DB_USERNAME\" -tc \
    \"SELECT 1 FROM pg_database WHERE datname='hrms_backend'\" | grep -q 1 && \
    echo 'Database already exists' || \
    docker exec srp-hrms-postgres psql -U \"\$DB_USERNAME\" -c \
      'CREATE DATABASE hrms_backend;'
"
log "Database ready"

# ── Step 4: Build backend image ───────────────────────────────────────────────
echo ""
echo "[4/8] Building FastAPI backend image (this takes 2-4 min)..."
ssh "$SERVER" "cd $DEPLOY_DIR && docker compose -f $COMPOSE_FILE build fastapi-backend"
log "Image built"

# ── Step 5: Start the container ───────────────────────────────────────────────
echo ""
echo "[5/8] Starting fastapi-backend container..."
ssh "$SERVER" "cd $DEPLOY_DIR && docker compose -f $COMPOSE_FILE up -d fastapi-backend"
log "Container started"

# ── Step 6: Run Alembic migrations ────────────────────────────────────────────
echo ""
echo "[6/8] Running database migrations (alembic upgrade head)..."
ssh "$SERVER" "
  docker exec srp-hrms-fastapi-backend \
    sh -c 'cd /app && alembic upgrade head'
"
log "Migrations applied"

# ── Step 7: Seed demo data (only if DB is empty) ──────────────────────────────
echo ""
echo "[7/8] Seeding demo data (skipped if companies exist)..."
ssh "$SERVER" "
  cd $DEPLOY_DIR
  source <(grep -E '^DB_USERNAME=' $ENV_FILE)
  COUNT=\$(docker exec srp-hrms-postgres psql -U \"\$DB_USERNAME\" -d hrms_backend \
    -tAc 'SELECT COUNT(*) FROM companies' 2>/dev/null || echo 0)
  if [ \"\$COUNT\" = \"0\" ]; then
    docker exec srp-hrms-fastapi-backend sh -c 'cd /app && python seed.py'
    echo 'Seed complete'
  else
    echo \"Skipping seed — \$COUNT company(ies) already exist\"
  fi
"
log "Seed step done"

# ── Step 8: Update host nginx ─────────────────────────────────────────────────
echo ""
echo "[8/8] Updating nginx config..."
ssh "$SERVER" "
  cp $DEPLOY_DIR/$NGINX_CONF $NGINX_DEST
  nginx -t && systemctl reload nginx
"
log "Nginx updated and reloaded"

# ── Health check ──────────────────────────────────────────────────────────────
echo ""
echo "Waiting 15s for container to be healthy..."
sleep 15
HEALTH=$(ssh "$SERVER" "curl -sf https://api.hrms.srpailabs.com/health || curl -sf http://127.0.0.1:8003/health || echo FAIL")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  log "Health check passed: $HEALTH"
else
  warn "Health check response: $HEALTH"
fi

echo ""
echo "=============================================="
echo -e "  ${GREEN}Deployment Complete!${NC}"
echo "=============================================="
echo "  API:          https://api.hrms.srpailabs.com"
echo "  Swagger Docs: (disabled in production)"
echo "  Container:    srp-hrms-fastapi-backend"
echo ""
echo "  Useful commands on server:"
echo "    docker logs srp-hrms-fastapi-backend -f"
echo "    docker exec -it srp-hrms-fastapi-backend sh"
echo ""
