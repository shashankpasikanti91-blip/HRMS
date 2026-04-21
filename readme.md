<div align="center">

# SRP AI HRMS

### AI-Powered Human Resource Management System

*Built by [SRP AI Labs](https://srpailabs.com)*

[![Live App](https://img.shields.io/badge/App-app.hrms.srpailabs.com-blue?style=for-the-badge)](https://app.hrms.srpailabs.com)
[![Marketing](https://img.shields.io/badge/Marketing-hrms.srpailabs.com-purple?style=for-the-badge)](https://hrms.srpailabs.com)
[![API Docs](https://img.shields.io/badge/API-api.hrms.srpailabs.com%2Fdocs-green?style=for-the-badge)](https://api.hrms.srpailabs.com/docs)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)]()

</div>

---

## Overview

SRP AI HRMS is a multi-tenant, role-based HR management platform covering the full employee lifecycle — from onboarding to exit. It is built on a FastAPI backend with PostgreSQL, a Next.js 15 web app, a React/Vite marketing site, and a GPT-4o powered AI assistant.

**Live URLs**

| Service | URL |
|---------|-----|
| Web App | https://app.hrms.srpailabs.com |
| Marketing | https://hrms.srpailabs.com |
| API | https://api.hrms.srpailabs.com |
| API Docs (Swagger) | https://api.hrms.srpailabs.com/docs |

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Company Admin | admin@demo.srpailabs.com | Admin@1234 |
| Super Admin | superadmin@srpailabs.com | Admin@1234 |

---

## Live Modules (April 2026)

| Module | Status | Description |
|--------|--------|-------------|
| Employee Management | Live | Full lifecycle — create, edit, probation, exit, document upload |
| Department Management | Live | CRUD departments, team member view, employee counts |
| Branch & Designation Management | Live | Multi-branch, designations, shift configuration |
| Attendance Tracking | Live | Clock in/out, manual entry, corrections, team dashboard, CSV export |
| Leave Management | Live | Apply/approve/reject, leave balances, policies per type |
| LOP (Loss of Pay) | Live | Monthly LOP calculation, approval workflow, bulk processing, overrides |
| Holiday Calendar | Live | Multi-country presets: India, Malaysia, Singapore, UAE |
| Calendar Overview | Live | Monthly attendance overlay — present, late, absent, leave, holidays |
| Payroll Processing | Live | Salary structures, components, monthly runs, payslip generation |
| Tax & Compliance | Live | Statutory rules: PF, ESIC (India), CPF (Singapore), professional tax |
| Performance Reviews | Live | Create reviews, goal scores, manager feedback, self-assessment |
| Document Vault | Live | Upload documents, onboarding/exit checklists, compliance templates |
| Analytics Dashboard | Live | Headcount, attendance trend + forecast, payroll summary, dept breakdown |
| AI HR Assistant | Live | GPT-4o + RAG, session persistence, handles HR queries 24/7 |
| Notifications | Live | In-app feed, mark-read, bulk clear, paginated |
| System Audit Logs | Live | Full audit trail: entity, change diff, user, IP — admin only |
| User & Role Management | Live | Invite by email, assign 7 RBAC roles, manage from Settings |
| Organization Settings | Live | Company profile, timezone, employee ID format, MFA |
| Recruitment & ATS | Add-on | Job postings, candidate pipeline, AI resume screening, interviews, offers |
| Geo-Fenced Check-in | Coming Soon | Location-verified clock in/out |
| 360° Feedback | Coming Soon | Peer review cycles |
| Expense Management | Coming Soon | Employee expense claims and approval |

---

## Tech Stack

### Backend
- **Framework:** FastAPI 0.115 + SQLAlchemy 2.0 async
- **Database:** PostgreSQL (`hrms_backend`)
- **Cache:** Redis
- **Migrations:** Alembic
- **Auth:** JWT HS256 with jti blacklist, bcrypt, Google OAuth (NextAuth)
- **Rate Limiting:** slowapi (200/min global, 5/min login)
- **AI:** OpenAI GPT-4o via `/ai/chat/` endpoint
- **Port:** 8003

### Frontend (Web App: `/apps/web`)
- **Framework:** Next.js 15 + App Router
- **Language:** TypeScript (strict: false, noEmitOnError: false)
- **UI:** Tailwind CSS + Radix UI + shadcn/ui
- **State:** Zustand (auth-store.ts)
- **HTTP:** Axios with auto-refresh token interceptor (lib/api.ts)
- **Forms:** react-hook-form + zod
- **Charts:** Recharts

### Marketing Site (`/apps/marketing`)
- **Framework:** Vite 5 + React 18 + TypeScript
- **Styling:** Tailwind CSS 3
- **Animations:** Framer Motion
- **Router:** React Router v6

### Infrastructure
- **Server:** Hetzner VPS — 5.223.67.236
- **Containers:** Docker
- **Reverse Proxy:** Host Nginx (not containerized)
- **SSL:** Cloudflare origin certificates
- **PostgreSQL Port:** 5434

---

## RBAC — User Roles

| Role | Key Permissions |
|------|----------------|
| `super_admin` | Full access across all companies |
| `company_admin` | Full access within own company |
| `hr_manager` | Employees, payroll, leave, attendance, recruitment |
| `finance` | Payroll, taxation, salary structures |
| `team_manager` | Team attendance view, leave approvals |
| `recruiter` | Recruitment module |
| `employee` | Self-service: own profile, attendance, leave, payslips |

---

## API Routes

Base URL: `https://api.hrms.srpailabs.com/api/v1/`

| Prefix | Module |
|--------|--------|
| `/auth/` | Login, register, refresh, reset, Google OAuth |
| `/companies/` | Company profile |
| `/users/` | User management, invitations |
| `/employees/` | Employee lifecycle, exit workflow |
| `/departments/` | Department CRUD |
| `/attendance/` | Clock in/out, logs, corrections |
| `/leaves/` | Leave CRUD, approve/reject, balances, policies |
| `/holidays/` | Holidays, bulk import |
| `/payroll/` | Payroll runs, payslips |
| `/salary-structures/` | Salary structures and components |
| `/lop/` | LOP calculation and approval |
| `/performance/` | Reviews, goals |
| `/documents/` | Document management |
| `/document-vault/` | Onboarding/exit checklists |
| `/notifications/` | Notification feed |
| `/analytics/` | Dashboard KPIs, trends |
| `/organization/` | Branches, designations, shifts |
| `/policies/` | Leave types and policies |
| `/audit-logs/` | System audit trail |
| `/search/` | Global search |
| `/jobs/` | Job postings (Add-on) |
| `/candidates/` | Candidates (Add-on) |
| `/applications/` | Applications (Add-on) |
| `/interviews/` | Interviews (Add-on) |
| `/recruitment-ai/` | AI resume screening, job post generation |
| `/ai/chat/` | AI HR Assistant (GPT-4o + RAG) |

---

## Project Structure

```
srp-hrms/
├── apps/
│   ├── web/                         # Next.js 15 web app
│   │   └── src/
│   │       ├── app/(dashboard)/     # All dashboard pages
│   │       ├── components/          # Reusable UI components
│   │       ├── services/api-services.ts
│   │       ├── store/auth-store.ts
│   │       ├── lib/api.ts           # Axios instance + token refresh
│   │       └── types/index.ts
│   └── marketing/                   # Vite marketing site
│       └── src/
│           ├── pages/               # LandingPage, PricingPage, ContactPage, etc.
│           └── components/          # HeroSection, FeaturesSection, etc.
├── backend/                         # FastAPI backend
│   └── app/
│       ├── api/v1/routes/           # Route handlers (26 files)
│       ├── models/                  # SQLAlchemy models (37+ models)
│       ├── schemas/                 # Pydantic request/response schemas
│       ├── services/                # Business logic
│       └── core/                    # Auth, deps, config, rate limiting
├── infrastructure/                  # Docker Compose, nginx configs
└── scripts/                         # Deploy and seeding scripts
```

---

## Local Development

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # fill DATABASE_URL, JWT_SECRET_KEY, OPENAI_API_KEY

alembic upgrade head   # run migrations
python seed.py         # seed demo data

uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload
```

### Web App

```bash
cd apps/web
npm install
# set NEXT_PUBLIC_API_URL=http://localhost:8003 in .env.local
npm run dev   # http://localhost:3000
```

### Marketing

```bash
cd apps/marketing
npm install
npm run dev   # http://localhost:3001
```

---

## Deployment

**Target server:** `root@5.223.67.236`

```bash
ssh root@5.223.67.236
cd /opt/srp-hrms
git pull origin main

# Backend (Docker)
cd backend
docker compose up -d --build
# Run migrations inside container
docker exec srp-hrms-backend alembic upgrade head

# Web app (Docker)
cd ../apps/web
docker build -t srp-hrms-web .
docker stop srp-hrms-web 2>/dev/null; docker rm srp-hrms-web 2>/dev/null
docker run -d --name srp-hrms-web -p 3000:3000 \
  --env-file /opt/srp-hrms/.env.production \
  srp-hrms-web

# Marketing (static build served via nginx)
cd ../marketing
npm install && npm run build
cp -r dist/* /var/www/hrms-marketing/
```

### Nginx Routing

| Domain | Backend |
|--------|---------|
| `hrms.srpailabs.com` | Marketing static files |
| `app.hrms.srpailabs.com` | Next.js — `127.0.0.1:3000` |
| `api.hrms.srpailabs.com` | FastAPI — `127.0.0.1:8003` |
| `app.hrms.srpailabs.com/files/*` | FastAPI uploads — `127.0.0.1:8003` |

---

## Environment Variables

### Backend `.env`

```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5434/hrms_backend
REDIS_URL=redis://:password@localhost:6379/0
JWT_SECRET_KEY=
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
OPENAI_API_KEY=sk-...
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FRONTEND_URL=https://app.hrms.srpailabs.com
```

### Web App `.env.local`

```env
NEXT_PUBLIC_API_URL=https://api.hrms.srpailabs.com
NEXTAUTH_URL=https://app.hrms.srpailabs.com
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## Security

- JWT `jti` blacklist on Redis — tokens revoked immediately on logout
- bcrypt password hashing
- Rate limiting: 5/min login, 3/min register/forgot-password, 200/min global
- Multi-tenant isolation: every DB query scoped to `company_id`
- RBAC enforced via FastAPI dependency injection on every protected route
- HTTPS via Cloudflare origin certs (certificate at `/etc/ssl/cloudflare/`)
- Full system audit log for every data change

---

## Contact

- **Email:** contact@srpailabs.com
- **WhatsApp:** +91 6281294878
- **Website:** https://srpailabs.com

---

*© 2026 SRP AI Labs. All rights reserved.*
