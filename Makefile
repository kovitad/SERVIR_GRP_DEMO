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

validate:
	docker compose config --quiet
	docker build --check .
