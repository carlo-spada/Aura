# AURA — Autonomous Up-skilling & Role-Acquisition Agent

AURA is an autonomous system that discovers jobs, ranks them using semantic search and preferences, gathers feedback, learns over time, and generates tailored application materials. See `AURA_Specification.md` for the full engineering spec.

## Quickstart

- Python: 3.11
- OS: Linux/macOS recommended

### Local (no Docker)
1. Create a virtualenv and install deps:
   - `python -m venv .venv && source .venv/bin/activate`
   - `pip install -r requirements.txt`
2. Initialize the local SQLite database:
   - `python -m src.db.init_db`
3. Ingest recent jobs (RemoteOK, last 7 days):
   - `python -m src.ingestion.remoteok --days 7`
4. Generate embeddings and build FAISS index:
   - `python -m src.embeddings.encoder embed`
   - `python -m src.embeddings.encoder index`
5. Rank jobs by combined score:
   - `python -m src.ranking.rank --q "data scientist remote nlp" --k 50 --top 10`
   - JSON output: add `--json`
6. Run the bootstrap:
   - `python -m src.main`

### API (FastAPI)
- Local:
  - `uvicorn src.api.main:app --reload --port 8000`
  - Endpoints: `GET /healthz`, `GET /jobs?limit=50&offset=0[&q=...]`, `GET /search?q=...&k=10`
- Docker:
  - `docker compose up -d api` then open http://localhost:8000/healthz
  
### Database (Postgres by default in Docker)
- Docker Compose includes a `db` service (Postgres 16). App services use `DATABASE_URL=postgresql+psycopg://aura:aura@db:5432/aura`.
- Local fallback is SQLite at `./data/jobs.db` if `DATABASE_URL` is unset.
- Initialize schema:
  - Quick start: `python -m src.db.init_db` (creates tables from models)
  - Migrations (Alembic): `alembic upgrade head` (requires `DATABASE_URL` env)

### Docker
- Build + run (single container):
  - `docker build -t aura .`
  - `docker run --rm -it -v "$(pwd)/data:/app/data" -v "$(pwd)/logs:/app/logs" -v "$(pwd)/outputs:/app/outputs" -p 8501:8501 aura`

### Container Tools (Docker Compose)
- Build images: `docker compose build`
- Run CLI bootstrap (one-shot): `docker compose run --rm aura` (runs `python -m src.main`)
- Ingest recent jobs (inside container): `docker compose run --rm aura python -m src.ingestion.remoteok --days 7`
 - Embed and index (inside container):
   - `docker compose run --rm aura python -m src.embeddings.encoder embed`
   - `docker compose run --rm aura python -m src.embeddings.encoder index`
- Run dashboard (long-running): `docker compose up -d dashboard` then open http://localhost:8501
- Run API (long-running): `docker compose up -d api` then open http://localhost:8000/healthz
  - Search: `GET /search?q=...&k=10`
  - Rank: `GET /rank?q=...&k=50&top=10`
- Stop all: `docker compose down`
- Convenience targets also available via `Makefile`:
  - `make run` (CLI one-shot), `make up-dashboard`, `make down`, `make logs`, `make bash`
  - Weekly pipeline one-shot: `make weekly` (ingest → embed → index)
- Compose reads `.env` automatically for settings like `LOG_LEVEL`.

Note: In Docker, Postgres is used by default. For local dev without Docker you can omit `DATABASE_URL` to use SQLite.

### Project Layout
- `src/` core modules and pipelines
- `data/` local database, metrics, artifacts
- `outputs/` generated CVs and cover letters
- `logs/` runtime logs

### Configuration
- Edit `config.yaml` to customize models, providers, and schedule.
 - Copy `.env.sample` to `.env` and fill values (e.g., `LOG_LEVEL`, API keys).
 - Logging: set `LOG_LEVEL`, optional `LOG_FILE` for file output. Default human-friendly console logs.

### Next Steps
- Implement scrapers in `src/ingestion/` and wire to DB
- Add embedding generation and ranking in `src/embeddings/` and `src/ranking/`
- Flesh out the feedback loop, training, RL, and generation modules

## Scheduling (Fridays at 09:00)
- Simple cron (host): `crontab -e` and add a line like:
  - `0 9 * * 5 cd /absolute/path/to/Aura && /usr/bin/env bash -lc 'docker compose run --rm aura python -m src.pipelines.weekly >> logs/weekly.log 2>&1'`
  - If running locally (venv): `0 9 * * 5 cd /absolute/path/to/Aura && /usr/bin/env bash -lc 'source .venv/bin/activate && python -m src.pipelines.weekly >> logs/weekly.log 2>&1'`
  - Note: ensure the path is absolute; cron doesn’t load your shell profile.

## License
MIT — see `LICENSE` for details.

## Development
- Install dev tooling: `pip install -r requirements-dev.txt`
- Enable pre-commit hooks: `pre-commit install` (then hooks run on each commit)
- Run formatters locally:
  - `black .`
  - `ruff check .` (auto-fix: `ruff check . --fix`)
- CI: GitHub Actions run lint, type-checks, tests (if any), and Docker build on PRs/pushes to `main`.

## Logging
- Writes to `logs/aura.log` with rotation (default 5MB, 3 backups) and console.
- Configure via env vars:
  - `LOG_LEVEL` (e.g., `INFO`, `DEBUG`)
  - `LOG_FILE` (override path; default resolves from `paths.logs_dir`)
  - `LOG_MAX_BYTES` (bytes), `LOG_BACKUP_COUNT` (files)
