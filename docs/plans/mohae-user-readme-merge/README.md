# User-facing README and merge readiness (Alchemy 2.2)

- gate_version: 2.2
- project: blond11qq/mohae
- existing MR: !1, source `feat/mohae-v1-three-bots`, target `main`
- initial source SHA: d4093c82fd96fa4fa2f3e7b8ff9b31b96de0f3d9
- user request: write a Korean, practical README for ordinary Discord users; merge existing MR into `main` if the actual merge gate can be satisfied.
- resolved format: `README_USER.md` at repo root plus prominent navigation from existing developer-oriented `README.md`; preserve operator/developer documentation.
- audience: non-admin members. No shell, tokens, self-hosting or CI instructions in user guide.
- source of truth: command registration/dispatch in `apps/mohae.ts`, `apps/polly.ts`, `apps/collector.ts`; economy and privacy `src/game.ts`, `src/gacha.ts`, `src/catalog.ts`, `docs/game-rules.md`.
- behavior acceptance: starting play, daily rewards, gacha, inventory, season, privacy and report flows; cover invalid inputs, permissions, rate limits and not-yet-deployed features honestly.
- merge constraint: explicit user authorization to merge; NO authorization to change CI provider, runners, repo visibility, secrets or deploy. Previously recorded unresolved release gates must be re-evaluated from current evidence. Unverified tests must not be described as passing.
- main SHA at discovery: 069c7ef18f77679dc50d148b3434a9c91fac66ad.

## Phases

1. [Guide content](phase-01-user-guide.md) — document commands and economy from exact source; verify every registered user command is covered and examples are correct.
2. [Integration and merge](phase-02-merge.md) — add root README link, inspect actual MR/head pipeline and CI jobs, two-lens review, merge only with an adequately established gate; otherwise preserve open MR and report blocker.

## State

- 2026-11-22: phase 01 not_started, phase 02 not_started. Prior v1 implementation gate is unverified; no retrospective status upgrade.
