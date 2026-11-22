# Phase 01 — Discord command integrity

State: not_started

User flow: User opens Discord slash UI; MOHAE command set and localized options register without validation errors, actions route to intended API operation.
Negative: malformed UTF-8/mojibake names, unsupported command, duplicate bot token or wrong guild must fail safely.

Entrypoint: apps/mohae.ts; apps/polly.ts; src/catalog.ts. Consumer: actual three-bot Discord smoke test.
RED: add deterministic lexical checks for all bot command names to reject malformed/control characters, then inspect source failure before patch.
GREEN: restore UTF-8 names and descriptions without changing intended economic behavior; test command definitions.
Proof: explicit CI run at exact candidate SHA plus manual live Discord registration later.
