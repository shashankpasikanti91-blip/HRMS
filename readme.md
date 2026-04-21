# SRP AI HRMS

Multi-tenant, role-based Human Resource Management System built for growing organisations. Covers the full employee lifecycle — onboarding through exit — with payroll, attendance, leave, performance, and an AI HR assistant.

**Live:** [app.hrms.srpailabs.com](https://app.hrms.srpailabs.com) · **API:** [api.hrms.srpailabs.com](https://api.hrms.srpailabs.com) · **Docs:** [/docs](https://api.hrms.srpailabs.com/docs)

---

## Demo Access

| Role | Email | Password |
|------|-------|----------|
| Company Admin | admin@demo.srpailabs.com | Admin@1234 |
| Super Admin | superadmin@srpailabs.com | Admin@1234 |

---

## Modules

| Module | Status |
|--------|--------|
| Employee Management | Live |
| Department & Branch Management | Live |
| Attendance Tracking | Live |
| Leave Management | Live |
| Loss of Pay (LOP) | Live |
| Holiday Calendar | Live |
| Payroll & Payslips | Live |
| Salary Structures | Live |
| Tax & Statutory Compliance | Live |
| Performance Reviews | Live |
| Document Vault | Live |
| Analytics Dashboard | Live |
| AI HR Assistant (GPT-4o) | Live |
| Notifications | Live |
| System Audit Logs | Live |
| User & Role Management | Live |
| Organization Settings | Live |
| Recruitment & ATS | Add-on |
| Geo-Fenced Clock-in | Planned |

---

## Tech Stack

### Backend
- **FastAPI 0.115** + SQLAlchemy 2.0 async
- **PostgreSQL** — multi-tenant, scoped by `company_id`
- **Redis** — JWT blacklist, rate-limit counters
- **Alembic** migrations
- **JWT HS256** — jti blacklist, bcrypt, Google OAuth
- **slowapi** rate limiting (5/min login · 200/min global)
- **OpenAI GPT-4o** — AI HR assistant endpoint

### Web App (`apps/web`)
- **Next.js 15** App Router · TypeScript
- **Tailwind CSS** + shadcn/ui (Radix UI)
- **Zustand** auth store · **Axios** with auto-refresh interceptor
- **react-hook-form** + **zod** · **Recharts**

### Marketing Site (`apps/marketing`)
- **Vite 5** + React 18 · TypeScript
- **Tailwind CSS** · Framer Motion · React Router v6

### Infrastructure
- **Hetzner VPS** — `5.223.67.236`
- **Docker** containers via `docker-compose.prod.yml`
- **Nginx** reverse proxy (host-level, not containerised)
- **Cloudflare** origin SSL certificates
- Turborepo monorepo

---

## Project Structure

```
srp-hrms/
├── apps/
│   ├── web/                        # Next.js 15 web application
│   │   └── src/
│   │       ├── app/                # App Router pages
│   │       │   └── (dashboard)/   # All authenticated pages
│   │       ├── components/        # Shared UI components
│   │       ├── services/          # API service layer (api-services.ts)
│   │       ├── store/             # Zustand stores
│   │       ├── lib/               # Axios instance, utilities
│   │       └── types/             # TypeScript interfaces
│   └── marketing/                 # Vite marketing site
│       └── src/
│           ├── pages/             # Landing, Pricing, Contact, etc.
│           └── components/        # Section components
├── backend/                       # FastAPI application
│   └── app/
│       ├── api/v1/routes/         # Route handlers (~28 files)
│       ├── models/                # SQLAlchemy ORM models
│       ├── schemas/               # Pydantic request/response schemas
│       ├── services/              # Business logic layer
│       ├── repositories/          # Data access layer
│       └── core/                  # Config, auth, deps, rate limiting
├── infrastructure/
│   ├── docker/                    # docker-compose files
│   └── nginx/                     # Nginx vhost configs
├── packages/
│   ├── database/                  # Shared DB package (Turborepo)
│   ├── shared/                    # Shared TypeScript types/utils
│   └── tsconfig/                  # Shared TS configs
└── scripts/
    ├── deploy.sh                  # Full-stack production deploy
    ├── deploy-backend.sh          # Backend-only deploy
    ├── deploy-production.sh       # Production deploy with health checks
    ├── setup-server.sh            # Fresh server bootstrap
    ├── seed-demo.sql              # Demo company and users
    └── seed-demo-employees.sql    # Demo employee data
```

---

## RBAC

| Role | Scope |
|------|-------|
| `super_admin` | All companies — platform administration |
| `company_admin` | Full access within own company |
| `hr_manager` | Employees, payroll, leave, attendance, recruitment |
| `finance` | Payroll, taxation, salary structures |
| `team_manager` | Team attendance, leave approvals |
| `recruiter` | Recruitment module only |
| `employee` | Self-service — own profile, attendance, leave, payslips |

---

## API Reference

Base: `https://api.hrms.srpailabs.com/api/v1`

| Prefix | Description |
|--------|-------------|
| `/auth` | Login, register, token refresh, password reset, Google OAuth |
| `/companies` | Company profile, logo upload |
| `/users` | User management, invitations |
| `/employees` | Employee lifecycle, photo upload, exit workflow |
| `/departments` | Department CRUD |
| `/attendance` | Clock in/out, manual entry, corrections, team log |
| `/leaves` | Leave requests, approvals, balances, policies |
| `/holidays` | Holiday calendar, bulk import |
| `/payroll` | Payroll runs, payslip generation |
| `/salary-structures` | Salary structures and components |
| `/lop` | LOP calculation, approval, overrides |
| `/performance` | Performance reviews and goals |
| `/documents` | Document upload and management |
| `/document-vault` | Onboarding/exit checklists |
| `/notifications` | In-app notifications |
| `/analytics` | Dashboard KPIs, trends, forecasts |
| `/organization` | Branches, designations, shifts, settings |
| `/policies` | Leave types and policies |
| `/audit-logs` | System audit trail (admin only) |
| `/search` | Global search across all entities |
| `/jobs` | Job postings (Recruitment add-on) |
| `/candidates` | Candidate management |
| `/ai/chat` | AI HR assistant (GPT-4o + RAG) |

---

## Local Development

### Prerequisites
- Python 3.12+, Node.js 22+, PostgreSQL 15+, Redis 7+

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # configure DATABASE_URL, JWT_SECRET_KEY, etc.
alembic upgrade head               # apply migrations
python seed.py                     # seed demo data

uvicorn app.main:app --port 8003 --reload
```

### Web App

```bash
cd apps/web
npm install
# create .env.local with NEXT_PUBLIC_API_URL=http://localhost:8003
npm run dev                        # http://localhost:3000
```

### Marketing Site

```bash
cd apps/marketing
npm install
npm run dev                        # http://localhost:3001
```

---

## Deployment

See `scripts/deploy.sh` for the full automated workflow.  
Manual steps:

```bash
ssh root@5.223.67.236
cd /opt/srp-hrms && git pull origin main

# Rebuild and restart backend
docker build -f backend/Dockerfile -t srp-hrms/fastapi-backend:latest backend/
docker compose -f infrastructure/docker/docker-compose.prod.yml up -d fastapi-backend

# Rebuild and restart web app (pass Telegram env for error reporting)
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=<token> \
  --build-arg NEXT_PUBLIC_TELEGRAM_CHAT_ID=<chat_id> \
  -t srp-hrms/web:latest .
docker compose -f infrastructure/docker/docker-compose.prod.yml up -d web
```

### Nginx to Container Routing

| Domain | Target |
|--------|--------|
| `hrms.srpailabs.com` | Marketing — static files via nginx |
| `app.hrms.srpailabs.com` | Next.js — `127.0.0.1:3000` |
| `api.hrms.srpailabs.com` | FastAPI — `127.0.0.1:8003` |
| `app.hrms.srpailabs.com/files/*` | FastAPI static uploads |

---

## Environment Variables

### `backend/.env`

```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/hrms_backend
REDIS_URL=redis://:password@localhost:6379/0

JWT_SECRET_KEY=<32-char secret>
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

OPENAI_API_KEY=sk-...
FRONTEND_URL=https://app.hrms.srpailabs.com
ALLOWED_ORIGINS=https://app.hrms.srpailabs.com

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

STORAGE_BACKEND=local           # or s3
LOCAL_UPLOAD_DIR=/app/uploads
```

### `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=https://api.hrms.srpailabs.com
NEXTAUTH_URL=https://app.hrms.srpailabs.com
NEXTAUTH_SECRET=<secret>
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=
NEXT_PUBLIC_TELEGRAM_CHAT_ID=
```

---

## Security

- JWT with `jti` — tokens invalidated immediately on logout via Redis blacklist
- bcrypt password hashing (cost factor 12)
- Per-route rate limiting via slowapi
- All database queries scoped to `company_id` — no cross-tenant data leakage
- RBAC enforced at the FastAPI dependency layer on every protected route
- HTTPS enforced via Cloudflare origin certificates
- Full audit log on every create/update/delete operation

---

## Contact

**SRP AI Labs** · [srpailabs.com](https://srpailabs.com)  
contact@srpailabs.com · +91 6281294878

