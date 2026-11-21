# MOHAE — three independent Discord bots

A Discord collection game built with TypeScript + Bun + SQLite. Contains **27 dummy characters** (person1–person27), dummy mini-games, quests, season rewards and cosmetics. There are **no stories, dialogue, story choices or AI chat**.

## Services

| Service | Responsibility | Credential |
|---|---|---|
| mohae-bot | Game commands, gacha, collection, cosmetics, season | mohae_bot_token |
| collector-bot | Counts eligible messages and voice minutes; never reads message bodies or recordings | collector_bot_token |
| polly-bot | Private reports via /신고 | polly_bot_token |
| game-api | Sole DB writer; economy, pity, cards and claims | Three role-specific API secrets |

## Local use

1. Create three **different Discord applications and bot tokens**; invite all three to a test guild. The collector bot needs GuildMessages and GuildVoiceStates intents, not privileged MessageContent.
2. Copy .env.example to .env and replace all example Discord snowflake IDs. The guild and eligible channel allowlists are mandatory.
3. Run **bash deploy/init-secrets.sh**. Enter the three tokens without storing them in .env or Git.
4. Run **docker compose up --build -d**.
5. Run **docker compose ps** and **docker compose logs --tail=100**. Require three individual READY log messages and healthy game-api.
6. Use /출석, /일퀘, four /미니게임 completions, and activity bonuses to earn up to 150 MOHAE/day; /뽑기 costs 150.
7. To stop without deleting all game data: **docker compose down**. Do **not** use down -v.

Only game-api mounts the SQLite volume. The API is not published to the host; each bot has only its own token and role-specific API key. The API validates a non-empty guild allowlist.

## Guarantees

* Monetary debits/credits, card instances, discoveries, pity counters and draw receipts commit in one SQLite transaction.
* The same request ID returns the original receipt; retries do not grant a second reward.
* 10x draws are sequential internally, all-or-nothing externally. 3-star probability: 2% before pull 41; +3 percentage points from 41 to 59; guaranteed at 60. 2+ guaranteed at 10. Limited pickup guaranteed at 70.
* Server-local accounts use KST day boundaries at 05:00.
* Seasons and limited banners are not automatically published. Authorized guild admins run /시즌시작 to activate a Monday-start 56-day dummy season.
* Daily journal content is not collected. Reports are private and do not generate game currency.
* Trading is excluded from v1 as an explicitly postponed feature; it needs a separate escrow implementation.

## Validation and release gate

Run **bun run typecheck**, **bun test**, **bun run build**. GitLab CI executes all three. Passing CI alone does **not** prove a live three-token Discord login, Docker startup, offsite backup/restore or production security review. Real bot smoke tests require the three private tokens and target Discord guild.

This is a testable implementation branch, not a claim that every optional future feature of the original 26-page guide has shipped. See the merge request description for current gaps.
