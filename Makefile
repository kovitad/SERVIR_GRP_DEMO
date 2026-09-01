.PHONY: build up down restart logs health validate

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f --tail=100

health:
	curl -fsS http://127.0.0.1/healthz && echo
	docker compose ps

validate:
	node --check public/app.js
	node --check public/i18n.js
	node --check public/map-integration.js
	node --check public/observability.js
	node --check public/auth.js
	node --check backend/server.js
	node --check scripts/dev-local.js
	docker compose config --quiet
