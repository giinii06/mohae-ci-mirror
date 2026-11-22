# Phase 01 — Discord command integrity

State: not_started

User flow: User opens Discord slash UI; MOHAE command set and localized options register without validation errors, actions route to intended API operation.
Negative: malformed UTF-8/mojibake names, unsupported command, duplicate bot token or wrong guild must fail safely.

Entrypoint: apps/mohae.ts; apps/polly.ts; src/catalog.ts. Consumer: actual three-bot Discord smoke test.
RED: add deterministic lexical checks for all bot command names to reject malformed/control characters, then inspect source failure before patch.
GREEN: restore UTF-8 names and descriptions without changing intended economic behavior; test command definitions.
Proof: explicit CI run at exact candidate SHA plus manual live Discord registration later.


## 2026-11-22 implementation checkpoint

Status transition: not_started -> in_progress -> implemented. Code SHA: f88e22464c0ecedc91394ef0190c05bf5764dfb9.
- Original multiply corrupt Korean strings in MOHAE, Polly, game prompts and dummy catalog repaired.
- 38 declared MOHAE commands have 38 matching handler cases; every permitted MOHAE API operation has an adapter call.
- Added tests/discord-contract.test.ts for corrupted source, illegal names and missing handlers.
- Only static source inspection was run. Bun RED/GREEN and actual Discord registration are unverified. Gate blocked before tested/verified.
