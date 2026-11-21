#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p backups
chmod 700 backups
if ! command -v docker >/dev/null; then echo "Docker CLI required" >&2; exit 1; fi
echo "Stopping the DB writer for a consistent WAL-inclusive backup..."
docker compose stop game-api
trap 'docker compose start game-api >/dev/null || true' EXIT
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
project="mohae"
docker run --rm --read-only   -v "${project}_game-data:/source:ro"   -v "$PWD/backups:/backup"   alpine:3.21 sh -c "cd /source && tar -czf /backup/mohae-${timestamp}.tar.gz ."
chmod 600 "backups/mohae-${timestamp}.tar.gz"
echo "Created encrypted-storage-compatible volume snapshot in backups/"
