# Operational guide

## Setup

Create three distinct Discord applications and tokens. Add all three bots to a private test guild. MOHAE needs slash-command access, optionally Manage Roles for pre-created cosmetic color roles; Collector needs GuildMessages/GuildVoiceStates intents (NOT privileged message-content); Polly requires access to a non-public moderator channel.

1. Clone this repository, checkout feat/mohae-v1-three-bots until reviewed/merged.
2. Copy .env.example to .env, fill allowed guild, explicitly allowed collector channel IDs and staff report channel.
3. Run bash deploy/init-secrets.sh and enter the three bot tokens securely. This generates the API role keys and the separate encrypted journal key.
4. Run docker compose config --quiet; docker compose up --build -d; docker compose ps.
5. Inspect docker compose logs --tail=100 for game-api health and three distinct Discord READY identities.

## Manual checks (NOT executed by CI)

Run /게임 /출석 /일퀘 /미니게임 /뽑기 /카드 /도감 and verify atomic rewards. Repeat the same game actions and check no bonus duplicate. Test two humans in an eligible voice channel and single-person/AFK exclusions. Test /신고 through Polly and ensure only moderator staff can see records. Activate a demo season by a guild manager and check /시즌, /이벤트 and /협동. Reboot each container separately; verify DB balances persist.

## Backups and incidents

For a consistent offline snapshot run bash deploy/backup.sh. It temporarily stops game-api, creates a compressed copy of the SQLite Docker volume, then restarts the API; bot actions may fail temporarily. Encrypt and copy the snapshot to off-site storage and actually rehearse restoration to separate staging. Never use docker compose down -v unless deliberate destruction of all data is intended. Back up the journal key separately; without it saved journal bodies cannot be decrypted.

Rotate any compromised Discord token in the Discord Developer Portal and the corresponding file in secrets/, then recreate that one bot container. Rotate any leaked internal API key and update corresponding service secrets. Never copy token values into Git, issues or CI job logs.

## Release gates

GitLab exact-source-SHA CI must pass both verify and compose_lint. CI tests include a local game-api with fake keys and a validated Docker Compose file. CI does NOT actually start four Docker services with real secrets, talk to Discord or prove operational reliability. Complete live test guild checks, off-site restore, privacy policy and permission audit before production rollout.
