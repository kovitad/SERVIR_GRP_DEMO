#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

container="grp-observability-backend"
if ! docker inspect "$container" >/dev/null 2>&1; then
  echo "Feedback backend container is not available: $container" >&2
  exit 1
fi

mkdir -p backups
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
output="backups/grp-feedback-${stamp}.tgz"
temporary="${output}.tmp"
trap 'rm -f "$temporary"' EXIT

MSYS_NO_PATHCONV=1 docker compose exec -T observability-backend tar -C /app/storage -czf - . > "$temporary"
chmod 600 "$temporary"
mv "$temporary" "$output"
trap - EXIT

echo "Feedback backup created: $output"
echo "Copy this archive to approved storage; backups/ is intentionally excluded from Git."
