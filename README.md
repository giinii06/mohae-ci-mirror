# MOHAE | Three-Bot Discord Collection Game

MOHAE is an independently hosted Discord game built with **Bun + TypeScript + discord.js + SQLite**. This repository is a working implementation branch of the original MOHAE game plan. It uses **three different, real Discord bots with three unique tokens** and a fourth internal game-api process.

**This release contains entirely dummy content** (person1 to person27, dummy minigames, cosmetics, quests and season events). **Stories, dialogue, story options and AI chat are excluded on purpose.** Card trading was explicitly deferred to a later release in the design document and is disabled.

## Architecture

~~~mermaid
flowchart TD
  A[MOHAE Discord app] --> B[mohae-bot]
  C[Collector Discord app] --> D[collector-bot]
  E[Polly Discord app] --> F[polly-bot]
  B -->|"MOHAE_API_KEY"| G[game-api]
  D -->|"COLLECTOR_API_KEY"| G
  F -->|"POLLY_API_KEY"| G
  G --> H[(SQLite durable Docker volume)]
~~~

**Only game-api reads/writes the database.** All authenticated internal API keys are role-limited. Personal in-game messages are ephemeral. Collector counts messages and voice membership without storing message bodies or recording audio.

## Getting started (Docker Compose)

1. Create **three** Discord applications in the Developer Portal and invite all three to the same private test server. Collector must have the Gateway guild message and voice state intents. Do not grant message-content intent merely for rewards.
2. Copy .env.example to .env and edit the guild/channel IDs. Configure a locked moderator-only report channel for Polly.
3. Run bash deploy/init-secrets.sh. Enter the three bot tokens interactively. This script also generates the three service API keys and an AES-256-GCM journal encryption key.
4. Run docker compose config --quiet.
5. Run docker compose up --build -d.
6. Run docker compose ps and docker compose logs --tail=100. Verify **four running processes and three distinct Discord bot identities**.
7. Run a manual smoke test in the test guild, following docs/operations.md. Docker configuration validation is not proof of actual Discord connectivity.

Secrets are files under secrets/, deliberately ignored by Git. Never put real bot tokens in source files, logs or .env.example. Only game-api mounts the SQLite volume. **Never use docker compose down -v** unless explicitly destroying all stored accounts, cards and balances.

## Game overview

| Feature | Status |
|---|---|
| Daily attendance and reflection quest | Implemented |
| Weekly progress and previous-week claim | Implemented |
| 1 / 10 draw and standard / limited pity state | Implemented |
| 27 dummy characters, owned cards, discovery book, duplicate dismantle | Implemented |
| Cosmetic shop, profile, privacy visibility, 12 optional color roles | Implemented |
| Affinity points with daily limits, no dialogue | Implemented |
| Five dummy interactive minigames with completion rewards | Implemented |
| Message/voice activity counted by Collector only | Implemented with conservative eligibility |
| 56-day season, 20 tiers, automatic expired-tier settlement | Implemented |
| Three dummy events and server cooperative progress | Implemented |
| Polly private reports, staff triage, status, rate limits | Implemented |
| Opt-in encrypted private journal and owner data export/delete | Implemented |
| Character stories, narrative, choices, AI chat | Explicitly excluded |
| Card-to-card trading | Deferred (initial version) |
| Real art/music, real character biographies | Dummy placeholders, as requested |
| Production deployment and live three-token Discord test | Not yet verified |

The game day begins at **05:00 Asia/Seoul**, Monday for game weeks. Attendance +40 MOHAE, daily quest +60, four rewarded minigames +40 and chat/voice activities +10 give the normal maximum **150 MOHAE per day**, plus weekly/event rewards. One draw costs 150 MOHAE, ten draw costs 1,500, or free tickets. Gacha uses 1/2/3 star base chances of 83/15/2%, a maximum 60-pull 3-star guarantee and maximum 70-pull limited pickup guarantee.

## Structure

~~~text
apps/
  api.ts         # game-api, only database writer
  mohae.ts       # MOHAE Discord application commands
  collector.ts   # independent Collector Discord app
  polly.ts       # independent Polly Discord app
src/
  store.ts       # SQLite schema and transactions
  game.ts        # economy, inventory, quest, season domain services
  gacha.ts       # cryptographically random pity engine
  catalog.ts     # dummy persons and content IDs
  time.ts        # KST day/week and season math
  client.ts      # internal service client
  secrets.ts     # file-mounted secrets and allowed guild
  roles.ts       # safe 12-role palette validation
tests/
  game.test.ts   # economic invariants and behavior
  api.test.ts    # local API authorization and request replay
deploy/
  init-secrets.sh
  backup.sh
compose.yaml
Dockerfile
.gitlab-ci.yml
docs/
  architecture.md
  game-rules.md
  operations.md
~~~

## Development and verification

Run bun install then bun run check locally. The optional GitHub Actions workflow .github/workflows/mohae-ci.yml runs typecheck, Bun tests, four builds, Compose configuration and a Docker image build on configured GitHub mirror branches. A GitLab CI dispatch status is NOT proof these jobs ran; verify exact GitHub run + checkout SHA. The API test launches a real local game-api process with **fake credentials**.

**Do not mistake a green CI pipeline for full operational readiness:** the Docker containers have not been booted in a live target host, the three Discord bot tokens have not been supplied and the Discord Gateway and live slash commands have not yet been tested. A backup restore rehearsal, security review and production privacy policy are necessary before real users.

More detail: [Architecture](docs/architecture.md) · [Game rules](docs/game-rules.md) · [Operator runbook](docs/operations.md).


## User-facing commands

MOHAE includes economy/collection, season pass, event/co-op, opt-in journal, JSON export, profile visibility, 1/2-star auto-dismantle and optional twelve-role color commands. Polly separately registers private /신고, /신고상태 and staff-only /신고목록 and /신고처리. All replies are private to the caller unless the explicitly enabled, private Polly staff receipt notification fires. See docs/operations.md for a command-by-command acceptance checklist.
