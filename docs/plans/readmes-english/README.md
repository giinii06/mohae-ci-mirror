# Translate every MOHAE README to English — Alchemy 2.2

- Gate version: 2.2
- Baseline branch/commit: `main` at `aa4c65fe49a3266f6b4b954e5eb55575bc58ba30`
- Working branch: `docs/readmes-english-20261122`
- Target: `main` via new merge request
- User outcome: every README in MOHAE provides English-only explanatory prose without changing actual Discord commands or game behavior.
- Scope (all README-like source docs): `README.md`, `README_USER.md`, `docs/plans/mohae-user-readme-merge/README.md`, `docs/plans/mohae-v1-release-hardening/README.md`.
- Repository discovery: the two historical `docs/plans/**/README.md` files are **already in English**. Preserve their append-only historical records exactly; no translation needed. `README.md` has a Korean intro and Korean slash-command names; `README_USER.md` is Korean. Update these two.
- Backward compatibility: keep every registered Korean slash command and Korean option name verbatim in inline code, since renaming them in prose would break the guide. Explain that commands remain Korean even though documentation prose is English.
- Non-goals: no Discord code, config, package, CI, secret, hosting, or deployment changes. A Git merge is authorized; a production release is not.
- Negative acceptance: no invented English slash-command aliases, broken Markdown anchors, missing command coverage or privacy claims that contradict source; no accidental changes to gameplay.
- Source of truth: `apps/mohae.ts` (38 commands), `apps/polly.ts` (4 commands), `src/game.ts`, `src/gacha.ts`, `docs/game-rules.md`.
- CI reality: configured GitLab external CI is a dispatch bridge; pipeline success alone does not prove Bun jobs. Docs-only validation is structural static review; actual gameplay and Discord E2E not claimed.

## Phases

1. [Phase 01: translate and cross-check](phase-01-translation.md): convert root README and user README to idiomatic English; preserve all valid Korean command tokens and essential gameplay figures; check every referenced command against source.
2. [Phase 02: review and merge](phase-02-merge.md): verify changes are documentation-only, two-lens self-review, check MR/source SHA and pipeline evidence, then merge per explicit user instruction.

## Append-only state log

- 2026-11-22: Phase 01 not_started, Phase 02 not_started. Baseline pinned as above. Previously merged MOHAE implementation remains subject to its independent unverified runtime/test gates. 
