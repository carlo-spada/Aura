## AURA Production Deployment

This guide walks through deploying AURA on a small VPS using Docker Compose and Caddy for HTTPS.

### Prerequisites
- VPS (Ubuntu 22.04+). Suggested: Hetzner CX11 (~€4–5/mo) or DigitalOcean Basic ($6/mo)
- Domain name and a subdomain for the app, e.g. `aura.yourdomain.com`
- DNS A/AAAA record for `aura.yourdomain.com` pointing to your VPS IP

### Install Docker
```
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# log out and back in to pick up group membership
```

### Clone repo and set env
```
git clone https://github.com/<you>/Aura.git
cd Aura
cp .env.sample .env
# Edit .env and set:
#   AURA_DOMAIN=aura.yourdomain.com
#   ACME_EMAIL=you@example.com
```

### Build and initialize
```
docker compose -f docker-compose.prod.yml build
# Create tables in Postgres
docker compose -f docker-compose.prod.yml run --rm aura python -m src.db.init_db
```

### First data pass (optional but recommended)
```
# Ingest last 7 days from RemoteOK
docker compose -f docker-compose.prod.yml run --rm aura python -m src.ingestion.remoteok --days 7
# Embed and index
docker compose -f docker-compose.prod.yml run --rm aura python -m src.embeddings.encoder embed
docker compose -f docker-compose.prod.yml run --rm aura python -m src.embeddings.encoder index
```

### Migrate existing local SQLite data (optional)
If you've been running locally with SQLite and want to import that data to Postgres:
```
# Ensure DATABASE_URL points to Postgres (compose.prod does this by default)
docker compose -f docker-compose.prod.yml run --rm aura python -m src.db.migrate_sqlite_to_postgres --sqlite ./data/jobs.db
```
Target DB should be empty (no rows in jobs/ratings/outcomes) unless you pass `--force`.

### Start services
```
# Start API, dashboard, Postgres, and Caddy (HTTPS terminator)
docker compose -f docker-compose.prod.yml up -d db api dashboard caddy
```

Verify:
- API health: https://aura.yourdomain.com/healthz
- Dashboard: https://aura.yourdomain.com/

### Kubernetes (optional)
Prefer managed Postgres and an image in a registry. Two options are included:

1) Helm chart (`charts/aura`)
- Set values:
  - `image.repository` and `image.tag`
  - `env.DATABASE_URL` (to a managed Postgres)
  - `ingress.host` to your domain (e.g., aura.carlospada.me)
- Install:
```
helm upgrade --install aura charts/aura \
  --set image.repository=your-docker-repo/aura \
  --set image.tag=latest \
  --set env.DATABASE_URL='postgresql+psycopg://user:pass@host:5432/db' \
  --set ingress.host='aura.carlospada.me'
```

2) Raw manifests (`k8s/`)
- Create namespace and secret, edit image + host, and apply the files as shown in `k8s/README.md`.

### Schedule weekly pipeline
On the VPS:
```
crontab -e
# Fridays at 09:00 local time
0 9 * * 5 cd /path/to/Aura && /usr/bin/env bash -lc 'docker compose -f docker-compose.prod.yml run --rm aura python -m src.pipelines.weekly >> logs/weekly.log 2>&1'
```

### Logs & backups
- App logs: `logs/aura.log` (rotates automatically)
- Database volume: `pgdata` Docker volume
- Backups: schedule snapshots or `pg_dump` regularly; also back up `data/` if needed.

### Notes
- Change `AURA_DOMAIN` and `ACME_EMAIL` in `.env` before starting `caddy`.
- If you change your domain, update DNS records and `.env`, then `docker compose -f docker-compose.prod.yml up -d caddy`.
- For future schema changes use Alembic migrations: `alembic upgrade head`.
