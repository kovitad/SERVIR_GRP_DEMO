#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

command="${1:-status}"

wait_for_backend() {
  echo "Waiting for the backend health check..."
  for _ in {1..30}; do
    status="$(docker inspect --format='{{.State.Health.Status}}' grp-observability-backend 2>/dev/null || true)"
    [[ "$status" == "healthy" ]] && { echo "Backend healthy."; return 0; }
    sleep 2
  done
  echo "Backend did not become healthy." >&2
  docker compose logs --tail=80 observability-backend >&2 || true
  return 1
}

case "$command" in
  status)
    python3 scripts/env_control.py status
    echo
    docker compose ps observability-backend 2>/dev/null || true
    ;;
  lock)
    # Stop first so an already-open runtime window cannot consume the personal key
    # while the container is being recreated with the locked environment.
    docker compose stop observability-backend >/dev/null 2>&1 || true
    python3 scripts/env_control.py lock
    docker compose up -d --no-deps --force-recreate observability-backend
    wait_for_backend
    echo "AI is environment-locked. Planner explanation calls cannot reach OpenAI."
    ;;
  allow)
    python3 scripts/env_control.py allow
    if ! docker compose up -d --no-deps --force-recreate observability-backend; then
      echo "Backend recreation failed; restoring the environment lock." >&2
      python3 scripts/env_control.py lock
      docker compose up -d --no-deps --force-recreate observability-backend || true
      exit 1
    fi
    wait_for_backend
    echo "Environment master allowed, but runtime access is still OFF."
    echo "Sign in as Admin over HTTPS and enable the short request window in AI Assurance."
    ;;
  *)
    echo "Usage: $0 {status|allow|lock}" >&2
    exit 2
    ;;
esac
