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

GitHub Actions MOHAE Bun + Compose checks should run on the exact candidate Git commit and must pass typecheck, tests, four builds, Docker image build, Compose config and shell syntax. This GitLab project's effective ci_config_path is an external ci-hub bridge: a green GitLab bridge/dispatch alone does NOT prove GitHub jobs ran. Confirm the GitHub Actions run and checkout SHA separately. None of these CI checks connect to real Discord or demonstrate production reliability. Complete live test guild checks, off-site restore, privacy policy and permission audit before production rollout.


## Slash-command smoke matrix

Test MOHAE commands on a private guild:
- Core: /게임, /프로필, /출석, /일퀘 (with optional journal save), /주간퀘, /뽑기, /뽑기기록, /천장, /도감, /카드, /카드잠금, /분해, /대표, /호감도, /미니게임, /상점, /구매, /꾸미기.
- Privacy: /공개설정, /다른프로필, /일지, /일지삭제, /내보내기, /계정삭제; verify public-profile denial, private export and deletion confirmation.
- Seasons and events: /시즌, /시즌보상, /이벤트, /이벤트보상, /협동, /협동참여, /협동보상. Guild managers only: /시즌시작, /이벤트시작, /협동시작.
- Optional cosmetics: /닉네임색 with exactly 12 precreated color roles; test bot role hierarchy, removing the old palette role and no arbitrary role assignment.
- Polly: /신고 (private reply), /신고상태 (only own receipt), /신고목록 and /신고처리 (Manage Guild only). Staff-only alert channel receives receipt ID, not report contents.
- Collector: allowlisted text channels count spaced non-bot messages without reading content; voice counts only two continuous eligible human participants.

Deploy only after all commands succeed, separate users cannot view each other's data, no sensitive public notifications occur and database/backup survive deliberate container restarts.

## Continuous integration provider boundaries

This GitLab project can report green for a bridge dispatch with no Bun test jobs. The GitHub Actions workflow at .github/workflows/mohae-ci.yml performs the checks when it is present in a GitHub mirror with the branch and Actions enabled. Independently inspect its checked-out SHA, actual jobs and output; absent a visible run mark build/test evidence UNKNOWN rather than PASSED. Do not change project CI settings or runner configuration as part of this branch.
