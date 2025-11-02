.PHONY: build up up-dashboard down run logs bash clean compose-cmd
.PHONY: reset-sqlite reset-postgres reset-db

# Detect a compose command: prefer Docker Compose v2, then docker-compose, then podman-compose
DC := $(shell (docker compose version >/dev/null 2>&1 && echo "docker compose") \
	|| (docker-compose version >/dev/null 2>&1 && echo docker-compose) \
	|| (podman-compose version >/dev/null 2>&1 && echo podman-compose))

compose-cmd:
	@if [ -z "$(DC)" ]; then \
	  echo "No compose found. Install Docker Compose v2 (recommended) or docker-compose/podman-compose."; \
	  exit 1; \
	else \
	  echo Using compose command: $(DC); \
	fi

build: compose-cmd
	$(DC) build --pull --no-cache

up: compose-cmd
	$(DC) up -d aura

up-dashboard: compose-cmd
	$(DC) up -d dashboard

up-api: compose-cmd
	$(DC) up -d api

down: compose-cmd
	$(DC) down

run: compose-cmd
	$(DC) run --rm aura

logs: compose-cmd
	$(DC) logs -f --tail=100

bash: compose-cmd
	$(DC) run --rm aura bash


clean: compose-cmd
	$(DC) down -v --remove-orphans
	-docker rmi aura:latest

# Remove local SQLite DB and re-create schema
reset-sqlite:
	rm -f data/jobs.db
	python -m src.db.init_db

# Reset Postgres by removing the compose volume (pgdata)
reset-postgres: compose-cmd
	$(DC) down -v
	@echo "Postgres volume removed. Start services and re-init schema if needed."

# Convenience: attempt both (SQLite always, Postgres if compose available)
reset-db:
	$(MAKE) -s reset-sqlite
	-$(MAKE) -s reset-postgres

.PHONY: wipe
wipe:
	python -m src.db.wipe_data --yes
