#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077
mkdir -p secrets
for name in mohae collector polly; do
  file="secrets/${name}_bot_token"
  if [[ -s "$file" ]]; then echo "Keeping existing $file"; continue; fi
  read -rsp "Discord token for ${name}: " token
  echo
  if [[ ${#token} -lt 12 ]]; then echo "Token too short" >&2; exit 1; fi
  printf %s "$token" >"$file"
  unset token
  chmod 600 "$file"
done
for name in mohae collector polly; do
  file="secrets/${name}_api_key"
  if [[ ! -s "$file" ]]; then openssl rand -hex 32 >"$file";chmod 600 "$file";fi
done
echo "Secrets saved without printing values."
