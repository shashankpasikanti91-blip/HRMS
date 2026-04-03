#!/bin/bash
# ============================================================
# SRP AI HRMS - Production Deployment Script
# Server: srp-ai-server (5.223.67.236)
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/infrastructure/docker/docker-compose.prod.yml"
ENV_FILE="$PROJECT_ROOT/.env.production"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ---- Pre-flight checks ----
preflight() {
    log "Running pre-flight checks..."

    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi

    if ! command -v docker compose &> /dev/null; then
        error "Docker Compose V2 is not installed"
    fi

    if [ ! -f "$ENV_FILE" ]; then
        error ".env.production not found! Copy .env.example to .env.production and fill values."
    fi

    if [ ! -f "$PROJECT_ROOT/infrastructure/ssl/origin.pem" ]; then
        error "SSL certificate not found at infrastructure/ssl/origin.pem"
    fi

    if [ ! -f "$PROJECT_ROOT/infrastructure/ssl/origin.key" ]; then
        error "SSL private key not found at infrastructure/ssl/origin.key"
    fi

    # Check for placeholder values
    if grep -q "CHANGE_ME" "$ENV_FILE" 2>/dev/null; then
        warn "Found CHANGE_ME placeholders in .env.production - please update before production use!"
    fi

    log "Pre-flight checks passed!"
}

# ---- Build all images ----
build() {
    log "Building Docker images..."
    cd "$PROJECT_ROOT/infrastructure/docker"
    docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" build --parallel
    log "Build complete!"
}

# ---- Deploy (pull/build + up) ----
deploy() {
    preflight
    log "Deploying SRP AI HRMS..."

    cd "$PROJECT_ROOT/infrastructure/docker"

    # Start infrastructure first
    log "Starting infrastructure services..."
    docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d \
        postgres redis elasticsearch minio nats

    log "Waiting for infrastructure to be healthy..."
    sleep 10
    docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" \
        exec -T postgres pg_isready -U srp_hrms_prod || error "PostgreSQL not ready"

    # Run migrations
    log "Running database migrations..."
    docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" run --rm \
        auth-service npx prisma migrate deploy 2>/dev/null || warn "Migrations may have already been applied"

    # Start application services
    log "Starting application services..."
    docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d

    log "Waiting for services to stabilize..."
    sleep 15

    # Health check
    healthcheck

    log "Deployment complete!"
    log "  Marketing:  https://hrms.srpailabs.com"
    log "  App:        https://app.hrms.srpailabs.com"
    log "  API:        https://api.hrms.srpailabs.com"
    log "  API Docs:   https://api.hrms.srpailabs.com/docs"
    log "  Grafana:    https://grafana.hrms.srpailabs.com"
}

# ---- Stop all services ----
stop() {
    log "Stopping SRP AI HRMS..."
    cd "$PROJECT_ROOT/infrastructure/docker"
    docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" down
    log "All services stopped."
}

# ---- Restart specific service ----
restart_service() {
    local service=$1
    log "Restarting $service..."
    cd "$PROJECT_ROOT/infrastructure/docker"
    docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" restart "$service"
    log "$service restarted."
}

# ---- View logs ----
logs() {
    local service=${1:-}
    cd "$PROJECT_ROOT/infrastructure/docker"
    if [ -z "$service" ]; then
        docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" logs -f --tail=100
    else
        docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" logs -f --tail=100 "$service"
    fi
}

# ---- Health check ----
healthcheck() {
    log "Running health checks..."
    local services=(
        "srp-hrms-api-gateway:4000"
        "srp-hrms-auth-service:4001"
        "srp-hrms-web:3000"
    )
    local all_healthy=true
    for svc in "${services[@]}"; do
        IFS=':' read -r container port <<< "$svc"
        if docker exec "$container" wget -qO- "http://localhost:$port/api/v1/health" &>/dev/null || \
           docker exec "$container" wget -qO- "http://localhost:$port" &>/dev/null; then
            log "  ✓ $container healthy"
        else
            warn "  ✗ $container may not be ready yet"
            all_healthy=false
        fi
    done
    if [ "$all_healthy" = true ]; then
        log "All services healthy!"
    else
        warn "Some services may still be starting up. Check logs with: $0 logs"
    fi
}

# ---- Status ----
status() {
    cd "$PROJECT_ROOT/infrastructure/docker"
    docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" ps
}

# ---- Database backup ----
backup_db() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="$PROJECT_ROOT/backups"
    mkdir -p "$backup_dir"
    log "Backing up database to $backup_dir/srp_hrms_$timestamp.sql.gz..."
    docker exec srp-hrms-postgres pg_dump -U srp_hrms_prod srp_hrms_prod | gzip > "$backup_dir/srp_hrms_$timestamp.sql.gz"
    log "Backup complete: $backup_dir/srp_hrms_$timestamp.sql.gz"
}

# ---- Update (pull latest + redeploy) ----
update() {
    log "Updating SRP AI HRMS..."
    cd "$PROJECT_ROOT"
    git pull origin main
    build
    deploy
}

# ---- Seed demo data ----
seed() {
    log "Seeding demo data..."
    cd "$PROJECT_ROOT/infrastructure/docker"
    docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" \
        exec -T postgres psql -U srp_hrms_prod -d srp_hrms_prod < "$PROJECT_ROOT/scripts/seed-demo.sql"
    log "Demo data seeded!"
}

# ---- Usage ----
usage() {
    echo "Usage: $0 {deploy|stop|restart|logs|health|status|backup|update|build|seed}"
    echo ""
    echo "Commands:"
    echo "  deploy              Full deployment (build + start all)"
    echo "  stop                Stop all services"
    echo "  restart <service>   Restart a specific service"
    echo "  logs [service]      View logs (all or specific service)"
    echo "  health              Run health checks"
    echo "  status              Show service status"
    echo "  backup              Backup PostgreSQL database"
    echo "  update              Pull latest code and redeploy"
    echo "  build               Build all Docker images"
    echo "  seed                Seed demo tenant data"
}

# ---- Main ----
case "${1:-}" in
    deploy)     deploy ;;
    stop)       stop ;;
    restart)    restart_service "${2:-}" ;;
    logs)       logs "${2:-}" ;;
    health)     healthcheck ;;
    status)     status ;;
    backup)     backup_db ;;
    update)     update ;;
    build)      build ;;
    seed)       seed ;;
    *)          usage ;;
esac
