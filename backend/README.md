# Backend — FastAPI

Multi-tenant HRMS API. All routes are under `/api/v1/`.

**Live:** `https://api.hrms.srpailabs.com` · **Docs:** `/docs` · **ReDoc:** `/redoc`

---

## Stack

| Component | Version | Role |
|-----------|---------|------|
| FastAPI | 0.115 | ASGI web framework |
| SQLAlchemy | 2.0 async | ORM |
| PostgreSQL | 16 | Primary database |
| Redis | 7 | JWT blacklist + rate-limit counters |
| Alembic | latest | Database migrations |
| Pydantic | v2 | Schema validation |
| python-jose + passlib | latest | JWT (jti) + bcrypt |
| slowapi | latest | Rate limiting |
| Docker | latest | Container runtime |

---

## API Modules

| Prefix | Endpoints | Description |
|--------|-----------|-------------|
| `/auth` | 8 | Login, register, token refresh, password reset, invite, Google OAuth |
| `/companies` | 5 | Tenant CRUD, logo upload |
| `/users` | 5 | User management, role assignment |
| `/employees` | 9 | Employee lifecycle, photo, bank & address details, exit workflow |
| `/departments` | 4 | Department CRUD |
| `/attendance` | 8 | Clock in/out, manual entry, corrections, team dashboard, CSV |
| `/leaves` | 7 | Leave requests, approvals, balances |
| `/holidays` | 5 | Holiday calendar — country/state presets |
| `/payroll` | 5 | Payroll runs, payslip generation |
| `/lop` | 6 | LOP calculation, overrides, approval workflow |
| `/salary-structures` | 9 | Salary structures, components, employee salary assignment |
| `/performance` | 5 | Performance reviews, goal scoring |
| `/documents` | 4 | File upload — PDF, DOC, XLS, CSV |
| `/document-vault` | 4 | Onboarding/exit checklists |
| `/notifications` | 3 | In-app notification feed |
| `/analytics` | 6 | Dashboard KPIs, trends, payroll summary |
| `/organization` | 8 | Branches, designations, shifts, org settings |
| `/policies` | 10 | Leave types, leave policies, balances, attendance policy |
| `/audit-logs` | 2 | Immutable system audit trail (admin only) |
| `/search` | 1 | `GET /search/global?q=` — unified cross-entity search |
| `/jobs` | 5 | Job postings (Recruitment add-on) |
| `/candidates` | 6 | Candidate profiles, resume upload |
| `/applications` | 4 | Application pipeline |
| `/interviews` | 3 | Interview scheduling |
| `/ai/chat` | 2 | GPT-4o HR assistant with session context |

---

## Data Model

37 SQLAlchemy models. Multi-tenancy is enforced at the repository layer — every query is scoped by `company_id`.

**Business IDs** — every entity has a human-readable, sequential Business ID:

| Entity | Format | Example |
|--------|--------|---------|
| Company | `COMP-NNNNNN` | COMP-000001 |
| Employee | `EMP-NNNNNN` | EMP-000042 |
| Department | `DEPT-NNNNNN` | DEPT-000003 |
| User | `USR-NNNNNN` | USR-000007 |
| Attendance | `ATT-NNNNNN` | ATT-001234 |
| Leave | `LVE-NNNNNN` | LVE-000050 |
| Holiday | `HOL-NNNNNN` | HOL-000012 |
| Payroll Run | `PAY-NNNNNN` | PAY-000001 |
| Performance | `PERF-NNNNNN` | PERF-000010 |
| Document | `DOC-NNNNNN` | DOC-000088 |
| Branch | `BRN-NNNNNN` | BRN-000001 |
| Designation | `DESG-NNNNNN` | DESG-000005 |
| Salary Structure | `SSTR-NNNNNN` | SSTR-000001 |
| Job Posting | `JOB-NNNNNN` | JOB-000015 |
| Candidate | `CAND-NNNNNN` | CAND-000099 |

---

## Security

- **JWT + jti** — every token contains a unique ID; revoked tokens are added to the Redis blacklist and checked on every request
- **bcrypt** — password hashing (cost factor 12)
- **Rate limiting** — slowapi: 5/min login · 3/min register/forgot-password · 200/min global
- **Multi-tenant isolation** — `company_id` filter applied at the repository layer on every query
- **RBAC** — 7 roles enforced via FastAPI dependency injection (`get_current_user` + `require_roles`)
- **Audit log** — every create/update/delete writes an immutable audit record (user, timestamp, IP, entity, diff)

---

## Local Setup

### Prerequisites

- Python 3.12+
- PostgreSQL 15+
- Redis 7+

### Install

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Configure

```bash
cp .env.example .env
# Set DATABASE_URL, REDIS_URL, JWT_SECRET_KEY, OPENAI_API_KEY
```

### Migrate and Seed

```bash
alembic upgrade head
python seed.py
```

### Run

```bash
uvicorn app.main:app --port 8003 --reload
# Swagger UI: http://localhost:8003/docs
```

### Tests

```bash
# Requires a separate hrms_test database
pytest -v
```

---

## Docker

### Development

```bash
docker compose up -d
docker compose exec backend alembic upgrade head
docker compose exec backend python seed.py
```

### Production

```bash
ssh root@5.223.67.236
cd /opt/srp-hrms
git pull origin main

docker build -f backend/Dockerfile -t srp-hrms/fastapi-backend:latest backend/
docker compose -f infrastructure/docker/docker-compose.prod.yml up -d fastapi-backend
```

Migrations run automatically on container start via the `CMD` in the Dockerfile.

---

## Directory Structure

```
backend/
├── app/
│   ├── main.py                 # Application factory, middleware, router registration
│   ├── api/v1/routes/          # Route handlers (~28 files, one per module)
│   ├── models/                 # SQLAlchemy ORM models
│   ├── schemas/                # Pydantic request/response schemas
│   ├── services/               # Business logic (calculations, workflows)
│   ├── repositories/           # Data access (all queries go here)
│   ├── core/
│   │   ├── config.py           # Settings from .env (Pydantic BaseSettings)
│   │   ├── auth.py             # JWT creation and verification
│   │   ├── deps.py             # FastAPI dependency injection
│   │   └── rate_limit.py       # slowapi rate limiter config
│   ├── integrations/           # OpenAI, Google OAuth clients
│   ├── middleware/             # Request logging, error handling
│   └── utils/                  # Business ID generator, file helpers
├── alembic/                    # Migration scripts
├── tests/                      # pytest test suite
├── nginx/hrms-api.conf         # Nginx vhost config
├── Dockerfile
├── docker-compose.yml          # Local dev compose
├── requirements.txt
├── alembic.ini
├── pytest.ini
├── seed.py
└── .env.example
```

---

## Environment Variables

See `.env.example` for defaults. Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://user:pass@host:port/db` |
| `REDIS_URL` | `redis://:password@host:6379/0` |
| `JWT_SECRET_KEY` | Random 32-char string — `openssl rand -hex 32` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Default: 30 |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | Default: 7 |
| `OPENAI_API_KEY` | Required for `/ai/chat` |
| `FRONTEND_URL` | Injected into emails |
| `ALLOWED_ORIGINS` | CORS — comma-separated |
| `STORAGE_BACKEND` | `local` or `s3` |
| `LOCAL_UPLOAD_DIR` | Path for local file storage |
| `GOOGLE_CLIENT_ID` | Optional — Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Optional — Google OAuth |

---

## Demo Credentials (after `seed.py`)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@srpailabs.com | Admin@1234 |
| Company Admin | admin@demo.srpailabs.com | Admin@1234 |
