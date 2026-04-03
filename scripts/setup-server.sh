#!/bin/bash
# ============================================================
# SRP AI HRMS - Server Initial Setup Script
# Run this ONCE on a fresh Hetzner server
# ============================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'
log() { echo -e "${GREEN}[SETUP]${NC} $1"; }

log "Starting SRP AI HRMS server setup..."

# ---- System updates ----
log "Updating system packages..."
apt-get update && apt-get upgrade -y

# ---- Install Docker ----
if ! command -v docker &> /dev/null; then
    log "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    log "Docker installed."
else
    log "Docker already installed."
fi

# ---- Install Docker Compose V2 ----
if ! docker compose version &> /dev/null; then
    log "Installing Docker Compose V2..."
    apt-get install -y docker-compose-plugin
    log "Docker Compose V2 installed."
else
    log "Docker Compose V2 already installed."
fi

# ---- Install Git ----
if ! command -v git &> /dev/null; then
    apt-get install -y git
fi

# ---- Install useful tools ----
apt-get install -y curl wget htop nano ufw fail2ban

# ---- Firewall setup ----
log "Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp       # SSH
ufw allow 80/tcp       # HTTP (redirect to HTTPS)
ufw allow 443/tcp      # HTTPS
ufw --force enable
log "Firewall configured (SSH, HTTP, HTTPS only)."

# ---- Fail2ban (brute force protection) ----
log "Configuring fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# ---- Create app directory ----
APP_DIR="/opt/srp-hrms"
if [ ! -d "$APP_DIR" ]; then
    mkdir -p "$APP_DIR"
    log "Created $APP_DIR"
fi

# ---- Clone repository ----
if [ ! -d "$APP_DIR/.git" ]; then
    log "Cloning repository..."
    git clone https://github.com/shashankpasikanti91-blip/HRMS.git "$APP_DIR"
    log "Repository cloned."
else
    log "Repository already exists. Pulling latest..."
    cd "$APP_DIR" && git pull origin main
fi

# ---- Setup SSL directory ----
mkdir -p "$APP_DIR/infrastructure/ssl"
log "IMPORTANT: Copy your Cloudflare Origin Certificate files:"
log "  - origin.pem -> $APP_DIR/infrastructure/ssl/origin.pem"
log "  - origin.key -> $APP_DIR/infrastructure/ssl/origin.key"

# ---- Setup .env.production ----
if [ ! -f "$APP_DIR/.env.production" ]; then
    cp "$APP_DIR/.env.example" "$APP_DIR/.env.production"
    chmod 600 "$APP_DIR/.env.production"
    log "Created .env.production from template. EDIT IT NOW:"
    log "  nano $APP_DIR/.env.production"
fi

# ---- Backups directory ----
mkdir -p "$APP_DIR/backups"

# ---- Cron job for daily DB backup ----
CRON_JOB="0 3 * * * $APP_DIR/scripts/deploy.sh backup >> /var/log/srp-hrms-backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v "srp-hrms"; echo "$CRON_JOB") | crontab -
log "Daily database backup cron job added (3 AM)."

# ---- Make deploy script executable ----
chmod +x "$APP_DIR/scripts/deploy.sh"
chmod +x "$APP_DIR/scripts/setup-server.sh"

log "============================================"
log "Server setup complete!"
log ""
log "Next steps:"
log "1. Edit .env.production:  nano $APP_DIR/.env.production"
log "2. Copy SSL certs to:     $APP_DIR/infrastructure/ssl/"
log "3. Deploy:                 cd $APP_DIR && ./scripts/deploy.sh deploy"
log "============================================"
