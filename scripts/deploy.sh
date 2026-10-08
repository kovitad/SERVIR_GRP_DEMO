#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

public=false
[[ "${1:-}" == "--public" ]] && public=true

set_env() { python3 scripts/env_control.py set "$1" "$2" >/dev/null; }

if [[ ! -f .env ]]; then
  cp .env.example .env
  chmod 600 .env
  echo "Created .env from .env.example."
  # Fill empty accounts so a first deployment needs no manual editing.
  if ! grep -q '^ADMIN_PASSWORD=..*' .env; then
    admin_password="$(openssl rand -base64 18)"
    planner_password="$(openssl rand -base64 18)"
    set_env ADMIN_USERNAME admin
    set_env ADMIN_PASSWORD "$admin_password"
    set_env PLANNER_USERNAME planner
    set_env PLANNER_PASSWORD "$planner_password"
    echo "Generated accounts (shown once; also stored in .env):"
    echo "  Admin:   admin / $admin_password"
    echo "  Planner: planner / $planner_password"
  fi
fi

if [[ "$public" == "true" ]]; then
  set_env HOST_BIND 0.0.0.0
fi

chmod 600 .env
python3 scripts/env_control.py migrate
python3 scripts/env_control.py validate
docker compose config --quiet
docker compose build --pull
docker compose up -d --remove-orphans

echo "Waiting for frontend and observability backend health checks..."
for _ in {1..30}; do
  frontend_status="$(docker inspect --format='{{.State.Health.Status}}' grp-evacuation-prototype 2>/dev/null || true)"
  backend_status="$(docker inspect --format='{{.State.Health.Status}}' grp-observability-backend 2>/dev/null || true)"
  if [[ "$frontend_status" == "healthy" && "$backend_status" == "healthy" ]]; then
    echo "Deployment healthy."
    docker compose ps
    exit 0
  fi
  sleep 2
done

echo "Health check failed." >&2
docker compose logs --tail=100
exit 1
