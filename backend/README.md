# SRP AI HRMS — Backend API

Production-ready, multi-tenant HRMS SaaS backend built with **FastAPI + PostgreSQL + Redis**.

**Live URL:** `https://api.hrms.srpailabs.com`

---

## Features

| Module | Endpoints | Description |
|---|---|---|
| Auth | 8 | Register, login, refresh, forgot/reset, invite, activate |
| Companies | 4 | Tenant management, admin company CRUD |
| Users | 5 | User CRUD with role-based access |
| Employees | 9 | Employee + Department CRUD, profile photo upload, visa tracking |
| Attendance | 8 | Check-in/out, manual entry, leave requests & approvals |
| Holidays | 5 | Holiday calendar CRUD with country/state filtering |
| Recruitment | 18 | Jobs, candidates, applications, interviews, offers + stage pipeline |
| Payroll | 5 | Payroll runs, processing, pay slips |
| Performance | 5 | Performance reviews |
| Documents | 4 | File upload (local/S3) — supports PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, RTF |
| Notifications | 3 | In-app notification read/mark-all |
| Analytics | 6 | Dashboard, attendance, recruitment funnel, headcount, leave, payroll |
| Search | 1 | `GET /api/v1/search/global?q=` — searches all entities |

### Business IDs
Every entity has a unique, human-readable, searchable Business ID:

| Entity | Format | Example |
|---|---|---|
| Company | COMP-NNNNNN | COMP-000001 |
| Employee | EMP-NNNNNN | EMP-000042 |
| Department | DEPT-NNNNNN | DEPT-000003 |
| User | USR-NNNNNN | USR-000007 |
| Job Posting | JOB-NNNNNN | JOB-000015 |
| Candidate | CAND-NNNNNN | CAND-000099 |
| Application | APP-NNNNNN | APP-000200 |
| Attendance | ATT-NNNNNN | ATT-001234 |
| Leave | LVE-NNNNNN | LVE-000050 |
| Holiday | HOL-NNNNNN | HOL-000012 |
| Payroll Run | PAY-NNNNNN | PAY-000001 |
| Payroll Item | PAYI-NNNNNN | PAYI-000050 |
| Performance | PERF-NNNNNN | PERF-000010 |
| Document | DOC-NNNNNN | DOC-000088 |
| Interview | INT-NNNNNN | INT-000005 |
| Offer | OFR-NNNNNN | OFR-000003 |

---

## Tech Stack

- **FastAPI 0.115** — ASGI web framework
- **SQLAlchemy 2.0 (async)** — ORM
- **PostgreSQL 16** — Primary database
- **Redis 7** — Token blacklist + cache
- **Alembic** — Database migrations
- **Pydantic v2** — Schema validation
- **python-jose + passlib** — JWT auth + bcrypt
- **httpx** — Async n8n AI webhook client
- **boto3** — S3/MinIO file storage
- **structlog** — Structured JSON logging
- **Celery + Flower** — Background jobs
- **Docker + Nginx** — Containerized deployment

---

## Local Development

### Prerequisites
- Python 3.12+
- PostgreSQL 16
- Redis 7

### Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate        # Linux/Mac
.venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DB/Redis/JWT settings

# Run database migrations
alembic upgrade head

# Seed demo data
python seed.py

# Start development server
uvicorn app.main:app --reload --port 8000
```

API docs at: http://localhost:8000/docs

### Run Tests

```bash
# Ensure test DB exists: hrms_test
pytest -v
```

---

## Docker Deployment

### Development (all-in-one)

```bash
cd backend
cp .env.example .env   # fill in values
docker compose up -d
docker compose exec backend alembic upgrade head
docker compose exec backend python seed.py
```

### Production (Hetzner server)

```bash
# On the server (5.223.67.236)
ssh root@5.223.67.236
cd /opt/srp-hrms/backend

# Pull latest
git pull

# Build and restart
docker compose pull
docker compose up -d --build backend

# First-time migration + seed
docker compose exec backend alembic upgrade head
docker compose exec backend python seed.py
```

### SSL (Cloudflare + Let's Encrypt)

```bash
certbot certonly --standalone -d api.hrms.srpailabs.com
# Cert stored at /etc/letsencrypt/live/api.hrms.srpailabs.com/
```

Copy `nginx/hrms-api.conf` to `/etc/nginx/conf.d/` and reload nginx.

---

## Environment Variables

See [`.env.example`](.env.example) for the full list. Key vars:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL async URL (postgresql+asyncpg://...) |
| `REDIS_URL` | Redis URL |
| `SECRET_KEY` | JWT signing key (generate with `openssl rand -hex 32`) |
| `SUPER_ADMIN_EMAIL` | Bootstrap super admin email |
| `SUPER_ADMIN_PASSWORD` | Bootstrap super admin password |
| `N8N_BASE_URL` | n8n webhook base URL |
| `N8N_ENABLED` | `true/false` |
| `STORAGE_BACKEND` | `local` or `s3` |
| `AWS_S3_BUCKET` | S3/MinIO bucket name |
| `CORS_ORIGINS` | Comma-separated allowed origins |

---

## API Structure

```
/api/v1/
├── auth/                    # Authentication
├── companies/               # Company management  
├── users/                   # User CRUD
├── departments/             # Department CRUD
├── employees/               # Employee CRUD + photo upload + visa tracking
├── attendance/              # Attendance management
├── leaves/                  # Leave requests
├── holidays/                # Holiday calendar (country/state-wise)
├── jobs/                    # Job postings
├── candidates/              # Candidate profiles + resume upload
├── applications/            # Job applications + stage pipeline
├── interviews/              # Interviews
├── offers/                  # Offer letters
├── payroll/                 # Payroll runs + items
├── performance/             # Performance reviews
├── documents/               # File upload/download
├── notifications/           # In-app notifications
├── analytics/               # Dashboard & charts data
└── search/global            # Universal search
```

---

## Default Credentials (seed data)

| Role | Email | Password |
|---|---|---|
| Super Admin | (from SUPER_ADMIN_EMAIL) | (from SUPER_ADMIN_PASSWORD) |
| HR Admin | hr@acme.com | Admin@1234 |
| Employee | alice@acme.com | Employee@1234 |

**Change all passwords immediately after first login.**
