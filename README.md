# AURA — Autonomous Job Copilot

AURA helps users find, rate, and win better jobs with a fast, guided experience. The product vision centers on:
- A frictionless UI (Next.js) with modern auth (Clerk) and API-backed state
- AI services in Python for job sourcing, ranking, and document generation
- A feedback loop from ratings and application outcomes to improve recommendations

See the product/UX vision in `AURA_Specification.md`.

## Architecture (New Vision)

- Frontend: Next.js (App Router) + shadcn/ui + Tailwind; hosted on Vercel
- Auth: Clerk (client SDK + server verification)
- State: API + Postgres (Supabase) for users, preferences, qualifications, ratings, applications
- AI Services: Python/FastAPI microservices (job sourcing, ranking, generation) deployable as serverless
- Database: Postgres for jobs and AI artifacts; pgvector planned for vector search (FAISS used locally)

## Status

- Fresh scaffolds for web (Next.js + Clerk) and API (FastAPI) are added.
- API exposes stub endpoints for `/healthz`, `/search`, and `/rank`.

## Quickstart

### Web App (Clerk)
1) Setup environment
   - `cd web`
   - `cp .env.local.example .env.local` and fill:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
     - `NEXT_PUBLIC_API_URL` (Python API origin; dev: `http://localhost:8000`)
2) Install and run
   - `npm install`
   - `npm run dev` (Next.js at http://localhost:3000)

### Python API Service
- Python: 3.11; OS: Linux/macOS recommended

Local (no Docker)
1) Create a virtualenv and install deps:
   - `cd services/api`
   - `python -m venv .venv && source .venv/bin/activate`
   - `pip install -r requirements.txt`
2) Run API:
   - `uvicorn api.main:app --reload --port 8000 --app-dir src`

Ingest and query
- Ingest sample jobs from RemoteOK (best-effort; falls back on empty if offline):
  - `curl -X POST 'http://localhost:8000/ingest/remoteok?q=engineer&limit=50'`
- List jobs:
  - `curl 'http://localhost:8000/jobs?k=20'`
- Search jobs:
  - `curl 'http://localhost:8000/jobs?q=frontend&k=20'`
- Rank jobs:
  - `curl 'http://localhost:8000/rank?q=frontend&k=50&top=10'`

Docker Compose
- From repo root: `docker compose up -d api` → http://localhost:8000/healthz

### Deploy

- Web (Vercel)
  - Import the `web/` subdirectory in Vercel.
  - Set env vars:
    - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
    - `NEXT_PUBLIC_API_URL` (point to your deployed API URL)
  - Build command: default (`npm run build`).

- API (Render)
  - Use `render.yaml` in repo root to create a Docker web service for the API.
  - Set env vars:
    - `ALLOWED_ORIGINS`: e.g. `https://your-vercel-domain.vercel.app,https://your-prod-domain`
    - `CLERK_ISSUER`, `CLERK_JWKS_URL`
    - `DATABASE_URL` (Supabase Postgres pooled URL) or omit to use SQLite volume, `AURA_DATA_DIR=/app/data`
  - Health check: `/healthz`

Alternatively deploy API to Fly.io/Cloud Run using `services/api/Dockerfile` directly.

### Key API Endpoints (Python)
- Health: `GET /healthz`
- Jobs: `GET /jobs`, `GET /jobs/{id}`
- Search/Rank: `GET /jobs?q=...&k=50`, `GET /rank?q=...&k=50&top=10`
- Auth-protected (Clerk JWT): `/me/preferences`, `/me/qualifications`, `/me/ratings`, `/me/applications`, `/me/applications/status`

## Project Layout
- `web/` Next.js app (Clerk, pages, components)
- `services/api/` FastAPI app (stubs for search/rank)
- `data/` DB and artifacts; `logs/` runtime logs; `outputs/` generated docs (future)

## Configuration
- `web/.env.local`: Clerk keys and `NEXT_PUBLIC_API_URL`
- API env: `ALLOWED_ORIGINS`, `CLERK_ISSUER`, `CLERK_JWKS_URL`, `DATABASE_URL`

## Roadmap (MVP)
- Milestone 1: Clerk auth + Convex preferences/qualifications onboarding
- Milestone 2: Asynchronous job search & cache (Python) + ranking endpoint
- Milestone 3: Dashboard with batch rating (2–6 jobs) and application creation stub (Convex)
- Milestone 4: Application generation (Python) and Applications tracking with statuses (incl. interviewing_1/2/3)

## Development
- Python dev: `pip install -r requirements-dev.txt`; format with `black` and `ruff`
- Web dev: run `npm run dev`
- CI: lint/type-check/build; Docker build for services

## License
MIT — see `LICENSE`.
