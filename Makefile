.PHONY: build up up-dashboard down run logs bash clean compose-cmd

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

down: compose-cmd
	$(DC) down

run: compose-cmd
	$(DC) run --rm aura

logs: compose-cmd
	$(DC) logs -f --tail=100

bash: compose-cmd
	$(DC) run --rm aura bash

weekly: compose-cmd
	$(DC) run --rm aura python -m src.pipelines.weekly

clean: compose-cmd
	$(DC) down -v --remove-orphans
	-docker rmi aura:latest
