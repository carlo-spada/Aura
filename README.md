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
3. Run the bootstrap:
   - `python -m src.main`

### Docker
- Build + run (single container):
  - `docker build -t aura .`
  - `docker run --rm -it -v "$(pwd)/data:/app/data" -v "$(pwd)/logs:/app/logs" -v "$(pwd)/outputs:/app/outputs" -p 8501:8501 aura`

### Container Tools (Docker Compose)
- Build images: `docker compose build`
- Run CLI bootstrap (one-shot): `docker compose run --rm aura` (runs `python -m src.main`)
- Run dashboard (long-running): `docker compose up -d dashboard` then open http://localhost:8501
- Stop all: `docker compose down`
- Convenience targets also available via `Makefile`:
  - `make run` (CLI one-shot), `make up-dashboard`, `make down`, `make logs`, `make bash`

### Project Layout
- `src/` core modules and pipelines
- `data/` local database, metrics, artifacts
- `outputs/` generated CVs and cover letters
- `logs/` runtime logs

### Configuration
- Edit `config.yaml` to customize models, providers, and schedule.
 - Copy `.env.sample` to `.env` and fill values (e.g., `LOG_LEVEL`, API keys).

### Next Steps
- Implement scrapers in `src/ingestion/` and wire to DB
- Add embedding generation and ranking in `src/embeddings/` and `src/ranking/`
- Flesh out the feedback loop, training, RL, and generation modules

## License
MIT — see `LICENSE` for details.

## Development
- Install dev tooling: `pip install -r requirements-dev.txt`
- Enable pre-commit hooks: `pre-commit install` (then hooks run on each commit)
- Run formatters locally:
  - `black .`
  - `ruff check .` (auto-fix: `ruff check . --fix`)
- CI: GitHub Actions run lint, type-checks, tests (if any), and Docker build on PRs/pushes to `main`.
