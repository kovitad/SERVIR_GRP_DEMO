#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

git pull --ff-only
docker compose build --pull
docker compose up -d --remove-orphans
docker image prune -f

for _ in {1..30}; do
  [[ "$(docker inspect --format='{{.State.Health.Status}}' grp-evacuation-prototype 2>/dev/null || true)" == "healthy" ]] && { echo "Update complete and healthy."; exit 0; }
  sleep 2
done

echo "Update completed but health check did not become healthy." >&2
exit 1
