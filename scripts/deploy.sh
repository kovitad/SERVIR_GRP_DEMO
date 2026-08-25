#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example. Review SITE_ADDRESS before public deployment."
fi

docker compose config --quiet
docker compose build --pull
docker compose up -d --remove-orphans

echo "Waiting for the container health check..."
for _ in {1..30}; do
  status="$(docker inspect --format='{{.State.Health.Status}}' grp-evacuation-prototype 2>/dev/null || true)"
  if [[ "$status" == "healthy" ]]; then
    echo "Deployment healthy."
    docker compose ps
    exit 0
  fi
  sleep 2
done

echo "Health check failed." >&2
docker compose logs --tail=100
exit 1
