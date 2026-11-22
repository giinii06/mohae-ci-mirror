#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077

if [[ $# -ne 2 || "$1" != "--confirm" ]]; then
  echo "Usage: bash deploy/restore.sh --confirm backups/mohae-YYYYMMDDTHHMMSSZ.tar.gz" >&2
  echo "DANGER: This replaces the existing MOHAE SQLite database. Stop all clients first." >&2
  exit 2
fi
if ! command -v docker >/dev/null || ! command -v tar >/dev/null; then
  echo "Docker CLI and tar are required" >&2
  exit 1
fi

file="$2"
if [[ ! -f "$file" || -L "$file" ]]; then
  echo "Regular, non-symlink archive file required" >&2
  exit 1
fi
archive_dir="$(cd "$(dirname "$file")" && pwd -P)"
if [[ "$archive_dir" != "$PWD/backups" ]]; then
  echo "For safety, only local backups/ archives can be restored" >&2
  exit 1
fi
archive_name="$(basename "$file")"
if [[ ! "$archive_name" =~ ^mohae-[0-9]{8}T[0-9]{6}Z[.]tar[.]gz$ ]]; then
  echo "Unexpected backup filename" >&2
  exit 1
fi
archive="$archive_dir/$archive_name"
tar -tzf "$archive" >/dev/null

# Do not permit a path outside the SQLite volume or foreign files.
while IFS= read -r member; do
  case "$member" in
    ./|./mohae.sqlite|./mohae.sqlite-wal|./mohae.sqlite-shm) ;;
    *) echo "Unexpected backup entry: $member" >&2; exit 1 ;;
  esac
done < <(tar -tzf "$archive")

docker compose config --quiet
echo "Stopping game-api before offline SQLite restoration..."
docker compose stop game-api
trap 'docker compose start game-api >/dev/null || true' EXIT

rollback="mohae-pre-restore-$(date -u +%Y%m%dT%H%M%SZ).tar.gz"
# If extraction fails, the existing database is preserved in the rollback archive.
docker run --rm --read-only \
  -v "mohae_game-data:/volume" \
  -v "$PWD/backups:/backup" \
  alpine:3.21 sh -eu -c '
    tar -czf "/backup/$1" -C /volume .
    rm -f /volume/mohae.sqlite /volume/mohae.sqlite-wal /volume/mohae.sqlite-shm
    tar -xzf "/backup/$2" -C /volume
  ' sh "$rollback" "$archive_name"

chmod 600 "backups/$rollback"
echo "Restored $archive_name. Previous volume snapshot: backups/$rollback"
echo "Verify docker compose ps/logs and all balances before enabling traffic."
