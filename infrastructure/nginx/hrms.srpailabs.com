# ============================================================
# SRP AI HRMS — Nginx Site Config
# Domains: hrms.srpailabs.com, *.hrms.srpailabs.com
# Deployed on host nginx at /etc/nginx/sites-available/
# ============================================================

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=hrms_api:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=hrms_auth:10m rate=10r/m;

# ---- Marketing site: hrms.srpailabs.com ----
server {
    listen 80;
    listen [::]:80;
    server_name hrms.srpailabs.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name hrms.srpailabs.com;

    ssl_certificate     /etc/ssl/cloudflare/hrms.srpailabs.com.pem;
    ssl_certificate_key /etc/ssl/cloudflare/hrms.srpailabs.com.key;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-XSS-Protection "1; mode=block" always;
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# ---- API Gateway: api.hrms.srpailabs.com ----
server {
    listen 80;
    listen [::]:80;
    server_name api.hrms.srpailabs.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name api.hrms.srpailabs.com;

    ssl_certificate     /etc/ssl/cloudflare/hrms.srpailabs.com.pem;
    ssl_certificate_key /etc/ssl/cloudflare/hrms.srpailabs.com.key;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-XSS-Protection "1; mode=block" always;
    client_max_body_size 50M;

    # Auth endpoints — strict rate limit
    location /api/v1/auth/ {
        limit_req zone=hrms_auth burst=5 nodelay;
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # General API
    location / {
        limit_req zone=hrms_api burst=50 nodelay;
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}

# ---- Web App: app.hrms.srpailabs.com ----
server {
    listen 80;
    listen [::]:80;
    server_name app.hrms.srpailabs.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name app.hrms.srpailabs.com;

    ssl_certificate     /etc/ssl/cloudflare/hrms.srpailabs.com.pem;
    ssl_certificate_key /etc/ssl/cloudflare/hrms.srpailabs.com.key;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-XSS-Protection "1; mode=block" always;
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# ---- Tenant wildcard: *.hrms.srpailabs.com ----
server {
    listen 80;
    listen [::]:80;
    server_name ~^(?<tenant>[a-z0-9-]+)\.hrms\.srpailabs\.com$;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name ~^(?<tenant>[a-z0-9-]+)\.hrms\.srpailabs\.com$;

    ssl_certificate     /etc/ssl/cloudflare/hrms.srpailabs.com.pem;
    ssl_certificate_key /etc/ssl/cloudflare/hrms.srpailabs.com.key;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    client_max_body_size 10M;

    # Skip known subdomains handled above
    if ($tenant ~* "^(api|app|www)$") {
        return 444;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Tenant-Slug $tenant;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /api/ {
        limit_req zone=hrms_api burst=50 nodelay;
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Tenant-Slug $tenant;
    }
}
