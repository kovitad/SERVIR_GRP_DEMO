.PHONY: build up down restart logs health validate feedback-backup ai-status ai-allow ai-lock

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

feedback-backup:
	./scripts/feedback-backup.sh

ai-status:
	./scripts/ai-master.sh status

ai-allow:
	./scripts/ai-master.sh allow

ai-lock:
	./scripts/ai-master.sh lock

validate:
	node --check public/app.js
	node --check public/i18n.js
	node --check public/map-integration.js
	node --check public/observability.js
	node --check public/auth.js
	node --check public/feedback.js
	node --check backend/server.js
	node --check scripts/dev-local.js
	python -m py_compile scripts/env_control.py
	python scripts/env_control.py validate
	docker compose config --quiet
