# AURA — Autonomous Up-skilling & Role-Acquisition Agent
### Comprehensive Engineering Specification (for Codex and agent collaboration)

---

## 1. Mission & Overview
**Goal:** Build an autonomous AI system that continuously searches for career opportunities, evaluates them based on evolving user preferences, generates personalized application materials, learns from outcomes, and recommends skill improvements.

**Core Principles**
- Modular architecture: every subsystem independent and easily replaceable.
- Data privacy by design: all data stored locally unless explicitly configured.
- Full reproducibility through Docker.
- Self-improving loop (data ingestion → evaluation → feedback → retraining).

---

## 2. System Workflow

1. **Weekly Job Discovery**
   - Fetch new job listings (≤7 days old) from multiple sources (e.g., Glassdoor, LinkedIn, RemoteOK, Indeed).
   - Normalize job data: title, company, location, salary, description, date posted, URL.
   - Store in local database.

2. **Semantic Scoring**
   - Generate dense embeddings for job descriptions and user profile.
   - Compute similarity scores using cosine distance.
   - Combine with metadata (salary normalization, location weight, company prestige).

3. **User Interaction**
   - Present top-5 ranked jobs via CLI or web dashboard.
   - Collect ratings (fit, interest, prestige, location, etc.) and optional comments.

4. **Learning Loop**
   - Train or update:
     - **Embedding fine-tuner:** contrastive loss on positive (liked) vs negative (rejected) jobs.
     - **Preference model:** LSTM predicting rating vector for next cycle.
     - **Policy agent:** reinforcement learner optimizing which jobs to present.
   - Update database with results and metrics.

5. **Application Generation**
   - Use LLM or local small model to craft:
     - Tailored CV highlighting matched skills.
     - Personalized cover letter referencing job keywords.
   - Output as Markdown and PDF in `/outputs`.

6. **Outcome Tracking**
   - User logs interview stages or offers.
   - System stores outcome as reward for reinforcement agent.

7. **Skill-Gap Analysis**
   - Extract recurring skill keywords from highly-rated but unsuccessful postings.
   - Compare against existing CV to identify missing skills.
   - Recommend upskilling resources (optional API integration).

---

## 3. Architecture

### 3.1 Layered Design
```
┌──────────────────────────────┐
│ Ingestion Layer              │
│   - Scraper / API clients    │
└───────────┬──────────────────┘
            ▼
┌──────────────────────────────┐
│ Database Layer (SQLite/Postgres) │
│   - jobs, ratings, outcomes   │
└───────────┬──────────────────┘
            ▼
┌──────────────────────────────┐
│ Embedding & Scoring Layer    │
│   - Sentence Transformers     │
│   - FAISS index for similarity │
└───────────┬──────────────────┘
            ▼
┌──────────────────────────────┐
│ Learning Layer               │
│   - LSTM preference model    │
│   - RL agent (DQN/PPO)       │
└───────────┬──────────────────┘
            ▼
┌──────────────────────────────┐
│ Generation Layer             │
│   - CV & Cover Letter LLM    │
└───────────┬──────────────────┘
            ▼
┌──────────────────────────────┐
│ Analytics & Dashboard Layer  │
│   - Streamlit or Dash         │
└──────────────────────────────┘
```

---

## 4. Data Schema (SQLite / Postgres)

### Table: `jobs`
| Column | Type | Description |
|---------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto |
| title | TEXT | Job title |
| company | TEXT | Company name |
| location | TEXT | City, country |
| salary_min | REAL | Minimum salary |
| salary_max | REAL | Maximum salary |
| currency | TEXT | Currency code |
| description | TEXT | Full text |
| url | TEXT | Original link |
| date_posted | DATE | Posting date |
| embedding | BLOB | Vector serialized (np.ndarray) |

### Table: `ratings`
| Column | Type | Description |
|---------|------|-------------|
| id | INTEGER PRIMARY KEY |
| job_id | INTEGER | FK → jobs.id |
| fit_score | INTEGER | 1–10 |
| interest_score | INTEGER | 1–10 |
| prestige_score | INTEGER | 1–10 |
| location_score | INTEGER | 1–10 |
| comment | TEXT | Optional feedback |
| timestamp | DATETIME | When rated |

### Table: `outcomes`
| Column | Type | Description |
|---------|------|-------------|
| id | INTEGER PRIMARY KEY |
| job_id | INTEGER | FK → jobs.id |
| stage | TEXT | e.g., “none”, “interview1”, “offer” |
| reward | REAL | Derived numeric reward |
| timestamp | DATETIME | |

---

## 5. Machine Learning Components

### 5.1 Embedding Engine
- Model: `sentence-transformers/all-MiniLM-L6-v2`
- Loss: Contrastive (InfoNCE)
- Function: `encode_jobs(texts: list[str]) -> np.ndarray`
- Fine-tuning: optional with labeled “liked” vs “disliked” pairs.

### 5.2 Preference Model
- Architecture: 2-layer LSTM → Dense(5) predicting user rating vector.
- Inputs: chronological list of job embedding + previous rating vector.
- Loss: MSE.

### 5.3 Reinforcement Learning Agent
- Algorithm: start with Contextual Bandit → Deep Q-Network.
- State vector: concat(preference_vector, avg_embedding(top_jobs)).
- Action space: {choose 5 jobs out of N}.
- Reward: weighted function of (user_rating, interview_stage).
- Library: `stable-baselines3` or custom PyTorch.

### 5.4 CV/CL Generator
- Uses template prompting:
  - Input: {job_description, user_profile_json, key_skills}.
  - Output: Markdown and PDF.
- Option 1: OpenAI API (cheap, reliable).
- Option 2: local small model via `llama.cpp`.

### 5.5 Skill-Gap Analyzer
- Extract skills with `spaCy` + `KeyBERT`.
- Compute TF-IDF frequency difference between high-rated and low-rated jobs.
- Recommend top missing skills.

---

## 6. Data Flow Summary
1. `scraper.py` → fetch JSON → DB insert.  
2. `embeddings.py` → generate & store vectors → FAISS index.  
3. `rank_jobs.py` → rank by similarity & scoring heuristic.  
4. `feedback.py` → collect user ratings → update DB.  
5. `train_preference_model.py` → update LSTM weights.  
6. `rl_agent.py` → learn policy, log cumulative reward.  
7. `generator.py` → produce CV & CL outputs.  
8. `analyzer.py` → update skills report.  
9. `dashboard/app.py` → render metrics & trends.

---

## 7. Modularity & Extensibility
- All models loaded from `config.yaml`:
  - Embedding model name
  - RL algorithm
  - LLM provider
- Database ORM (e.g., `SQLAlchemy`) abstracts persistence layer.
- Job scrapers registered dynamically via `entry_points` pattern.

---

## 8. Dockerization

### Dockerfile (overview)
```Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY src/ ./src/
COPY data/ ./data/
ENV PYTHONPATH=/app/src
CMD ["python", "src/main.py"]
```

### docker-compose.yml
```yaml
version: "3.8"
services:
  aura:
    build: .
    container_name: aura_core
    volumes:
      - ./data:/app/data
    environment:
      - PYTHONUNBUFFERED=1
  dashboard:
    build: .
    command: streamlit run src/dashboard/app.py
    ports:
      - "8501:8501"
    depends_on:
      - aura
```

---

## 9. Configuration

`config.yaml`
```yaml
paths:
  data_dir: "./data"
  models_dir: "./models"
models:
  embedding: "sentence-transformers/all-MiniLM-L6-v2"
  preference_model: "lstm"
  rl_agent: "dqn"
llm:
  provider: "openai"
  temperature: 0.2
job_sources:
  - name: "RemoteOK"
    url: "https://remoteok.io/api"
  - name: "Indeed"
    search_terms: ["data scientist", "strategy consultant"]
schedule:
  frequency: "weekly"
  day: "Friday"
```

---

## 10. Metrics & Logging
- Log all events to `logs/aura.log` via `logging` module.
- Weekly metrics written to `data/metrics.json`:
  - `avg_match_score`
  - `avg_rating`
  - `cumulative_reward`
  - `skill_gap_index`
- Use `matplotlib` or `plotly` for visual trends.

---

## 11. Evaluation

| Stage | Metric | Target |
|--------|--------|--------|
| Embedding | Mean Reciprocal Rank (MRR) | ≥0.70 |
| Preference | RMSE of rating prediction | ≤0.5 |
| RL Agent | Average reward per episode | ↑ over time |
| Application | Interview conversion rate | ↑ over time |

---

## 12. Development Timeline (16 Weeks)

| Phase | Deliverables | Time |
|--------|--------------|------|
| 1 | Repo setup, Docker, dummy pipeline | Week 1–2 |
| 2 | Scraper + DB | Week 3–4 |
| 3 | Embeddings + FAISS | Week 5–6 |
| 4 | Feedback interface | Week 7–8 |
| 5 | LSTM preference | Week 9–10 |
| 6 | RL agent | Week 11–12 |
| 7 | CV/CL generator | Week 13–14 |
| 8 | Skill-gap + Dashboard | Week 15–16 |

---

## 13. Testing & Validation
- Unit tests with `pytest` under `/tests`.
- Mock data generator for reproducible experiments.
- Integration tests for DB and scraping modules.
- Performance benchmark on sample 1000 postings.

---

## 14. Security & Privacy
- No external data transmission by default.
- API keys stored in `.env`.
- Sanitized logs (no PII).
- Optional encryption for CV and outcomes tables.

---

## 15. Deliverables for First Commit
1. `src/` skeleton with placeholder modules and docstrings.
2. `requirements.txt` and `Dockerfile`.
3. `README.md` (user-facing summary).
4. `AURA_Specification.md` (this document).
5. Dummy `jobs.db` and `config.yaml`.

---

---

## 16. Deployment & Hosting (Production)

- Recommended topology:
  - Portfolio: Vercel or Cloudflare Pages (root domain).
  - Apps (e.g., AURA): single VPS (Hetzner CX11 / DO $6) running Docker Compose.
  - Reverse proxy: Caddy with automatic HTTPS and subdomain routing (e.g., aura.yourdomain).
- Runtime containers:
  - `aura` (CLI tasks + pipelines)
  - `dashboard` (Streamlit UI)
  - optional: `api` (FastAPI) for multi-user later
- Storage & backups:
  - Persist `data/` (SQLite/FAISS) on disk volume; nightly tarball or provider snapshots.
  - Secret management via `.env` mounted as read-only.

## 17. Multi‑User, Auth & Billing (SaaS Upgrade)

- Target: $5/mo plan with Stripe billing.
- Auth: OAuth (Google/Apple/GitHub) or email magic links; sessions via JWT.
- Data model additions:
  - `users` (id, email, name, auth_provider, created_at)
  - `subscriptions` (user_id, stripe_customer_id, status)
  - Add `user_id` FK to `jobs`, `ratings`, `outcomes` (or scope jobs per user workspace).
- API access control: per‑user data isolation; rate limiting.
- Billing: Stripe Checkout + Billing Portal; webhook updates subscription status.

## 18. PWA Frontend (Installable App)

- Tech: Next.js + next-pwa (or Astro with Workbox) hosted on Vercel.
- Features:
  - Web app manifest (icons, theme, display standalone) and service worker caching.
  - Pages: Login, Jobs, Search, Rate, Profile/Subscription.
  - Calls backend API for data; optional offline read cache.
- iOS notes: PWA installable via “Add to Home Screen”; notifications limited; background sync limited.

## 19. API Layer (FastAPI)

- Endpoints (v1):
  - `POST /auth/*` (provider callback or email link)
  - `GET /jobs` (filter, pagination)
  - `GET /search?q=…` (FAISS/pgvector top‑N)
  - `POST /ratings` (store feedback)
  - `GET /metrics` (for dashboard)
  - `POST /stripe/webhook` (subscription lifecycle)
- AuthN/Z: JWT in Authorization header; middleware enforces user scoping.
- Background jobs: keep ingestion/embedding/index as CLI run by cron/systemd timer.

## 20. Scheduling & Automation

- Weekly pipeline runner (`src/pipelines/weekly.py`): ingest → embed → index.
- Scheduling options:
  - Host cron: run Compose task on Fridays 09:00.
  - Systemd timers on VPS for more control.
- Logging: append to `logs/weekly.log`; rotate via `logrotate` or Python rotating handlers.

## 21. Observability

- Logging: structured logs; console + file handler (`logs/`).
- Metrics: extend `data/metrics.json` or move to SQLite table `metrics` with timestamped records.
- Health checks: `/healthz` on API; simple status page.

## 22. CI/CD & DevX

- GitHub Actions pipeline (lint, format check, mypy, tests, docker build).
- Pre-commit hooks (ruff/black) to enforce consistency.
- Future: build/push production images; SSH deploy to VPS or use actions‑rs/ssh.

## 23. Domain & DNS

- Primary domain: prefer no dash (easier to type/say). e.g., `carlospada.me`.
- Registrar: Cloudflare Registrar (at‑cost, privacy) or Porkbun.
- DNS:
  - Root/`www` → Portfolio host (Vercel/Pages)
  - `aura` → VPS A/AAAA record; Caddy terminates TLS and proxies → dashboard/API

## 24. Migration Plan: SQLite → Postgres

- When to migrate: multi-user, heavy concurrency, advanced search (JSONB/FTS/pgvector).
- Steps:
  - Introduce SQLAlchemy ORM models + Alembic migrations.
  - Add `DATABASE_URL` env with Postgres and dual‑stack code paths.
  - Data migration: export SQLite → import into Postgres; rebuild FAISS (or adopt pgvector).
  - Update ingestion/embedding to respect `user_id` scoping.

## 25. Revised Near‑Term Roadmap (MVP → SaaS)

1) Ingestion MVP (RemoteOK) — done
2) Embeddings + FAISS — done
3) Dashboard basic search/list — done
4) API scaffold (FastAPI) — next
5) Ratings capture via dashboard/API
6) Ranking pipeline (semantic + metadata + prefs)
7) Preference model training (LSTM) and metrics
8) SaaS foundations: Postgres, auth, Stripe billing
9) PWA frontend (Next.js) integrated with API
10) Production deploy: VPS + Caddy + cron; domain on Cloudflare

---

**End of specification.**
 
---

## 26. Frontend UI/UX Redesign (Next.js Web)

### 26.1 Core Vision & Aesthetic
- Premium, minimalist, data‑oriented feel inspired by RP Strength (training.rpstrength.com).
- Dark Mode default (charcoal/blue surfaces, light text, bright accents); accessible Light Mode toggle.
- Tone: “personal AI agent” guiding the user with clear, sparse copy and helpful states.

Design tokens (suggested):
- Dark: bg `#0B0F19`, surface `#121826`/`#1A2235`; text primary `#E6E8EE`, secondary `#AAB1C5`; accents primary `#5B8CFF`, success `#3FD09E`, warn `#F5B84B`, danger `#FF6B6B`.
- Light: bg `#F8FAFF`, surface `#FFFFFF`, text `#0C1222`; mirror accents; maintain ≥4.5:1 contrast.

### 26.2 User Journey & Key Screens

Stage A — Landing & Onboarding
- Landing: Above‑the‑fold login/signup; below‑the‑fold features (screenshots, bullets).
- Onboarding (mandatory, multi‑step; one question/screen):
  1) Role(s) sought (chips + free text)
  2) Experience level (Student, Junior, Mid, Senior, Lead)
  3) Location preference (Remote/Hybrid/On‑site + city)
  4) Skills to include/exclude (tag input)
  5) Company type (Startup/Corporation/Non‑profit/etc.)
  6) CV upload (source of truth) or create generic CV
  7) Jobs per batch (1–5 slider)
  8) Search frequency (Daily/Weekly/Bi‑weekly/Monthly or 1–30 days)
- Processing screen: “Gathering jobs → Embedding → Ranking”, notify when ready.

Stage B — Core Application Loop
- App shell: Desktop sidebar (Dashboard, Applications, Tracker, History, Settings); Mobile bottom bar.
- Dashboard (Job Rating): current batch (≤5) as compact cards with 5–10 distilled insights
  (Title, Company, Pay Range, Top 3 skills, Location, Posted age, Remote/Hybrid tag, match bullets).
  Primary action: 1–5 star rating; progress bar (e.g., 3/5 rated); autosave + toasts.
- Post‑rating: summarize ≥4★; user selects jobs → CTA “Prepare applications”.
- Application Generation & Review: working state → per job CV/CL previews (editable), option to tweak generic CV first; actions: download PDF/copy/save.
- Gated action: new search disabled until at least one application confirmed (unless no ≥4★).
- Tracker: status board/table (Applied, Interview 1, Interview 2, Offer, Rejected, No Response, Accepted) with quick status changes and notes.
- History: past batches, ratings, outcomes; filters + small trend metrics.

Stage C — Settings & Profile
- Preferences editor (all onboarding answers), CV management (replace/edit source), theme toggle, basic account.

### 26.3 Navigation, Responsiveness, Accessibility
- Sidebar collapses <1024px; bottom nav on mobile; keyboard navigable; ARIA on rating stars; focus rings.
- Loading skeletons, empty/error states with guidance; toasts for optimistic updates/undo.

### 26.4 Web App Structure (Next.js App Router)
```
web/src/app/(public)/page.tsx                # Landing (hero + marketing)
web/src/app/(public)/auth/*                  # Login/Signup (NextAuth or custom)
web/src/app/(onboarding)/onboarding/*        # 8‑step wizard
web/src/app/(onboarding)/processing/page.tsx # First search wait screen
web/src/app/(app)/layout.tsx                 # Auth shell (sidebar/header/bottom bar)
web/src/app/(app)/dashboard/page.tsx         # Batch rating view
web/src/app/(app)/review/page.tsx            # ≥4★ selection → prepare apps
web/src/app/(app)/applications/page.tsx      # Generated CV/CL review/edit
web/src/app/(app)/tracker/page.tsx           # Application status board/table
web/src/app/(app)/history/page.tsx           # Activity history
web/src/app/(app)/settings/page.tsx          # Preferences, CV, theme, account
```

### 26.5 Key Components
- AppShell (sidebar/header/theme toggle/user menu), FormStepper, QuestionCard, TagInput, FileUpload
- JobCardCompact, StarRating (1–5), BatchProgress, EmptyState, Skeleton
- DocPreview (Markdown/HTML), EditDialog, PDFActions, StatusSelect, BoardColumn, TrackerTable
- ThemeToggle (persisted), ToastProvider, ConfirmDialog

### 26.6 Backend Additions for UX
- Auth/users: NextAuth (Google/GitHub) on web; FastAPI verifies JWT; `users` table.
- Preferences: `GET/PUT /preferences`
- Batches: `POST /batches`, `GET /batches/current`, `POST /batches/{id}/ratings`, `POST /batches/{id}/lock`
- Applications: `POST /applications/generate`, `GET /applications`, `PUT /applications/{id}` (status, notes)
- CVs: `GET/PUT /cv` (generic CV file + editable form)
- Gating: enforce one active unlocked batch per user

### 26.7 Data Model (additions)
- `users(id, email, name, created_at)`
- `preferences(user_id, roles[], experience, location_mode, location_text, include_skills[], exclude_skills[], company_types[], batch_size, frequency_days, cv_url)`
- `batches(id, user_id, created_at, locked_at)`
- `batch_jobs(id, batch_id, job_id)`
- `ratings(id, user_id, batch_id, job_id, stars INT, timestamp)`
- `applications(id, user_id, job_id, batch_id, status, cv_doc, cl_doc, updated_at)`

### 26.8 Implementation Plan (Phases)
1) Theme + Shell: Tailwind tokens, dark/light toggle, AppShell.
2) Landing + marketing skeleton with auth form placeholder.
3) Onboarding wizard scaffold (8 steps) + processing screen.
4) Dashboard Batch Rating MVP (compact cards, star ratings, progress).
5) Post‑rating + Applications MVP (selection, working, previews).
6) Tracker + History MVP (table/board + feed).
7) Settings MVP (preferences editor, CV manager, theme).
8) Auth + preferences/batches/ratings endpoints; JWT verification.
9) Generation integration (CV/CL), doc editing, PDF export.
10) Polish: copy, skeletons, toasts, accessibility, SEO/manifest/icons.
