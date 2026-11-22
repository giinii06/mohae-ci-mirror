# Phase 01 — User guide

- State: not_started
- Outcome: regular Discord member can follow a Korean README to understand MOHAE, Collector and Polly, earn MOHAE, draw characters, manage inventory and report privately.
- Source: source SHA d4093c82fd96fa4fa2f3e7b8ff9b31b96de0f3d9 and `docs/game-rules.md`, not speculative future features.
- Files: `README_USER.md`, `README.md`.
- Negative/failure checks: reserved admin commands never presented as everyday commands; no implication of live deployment; no false promise about raw account deletion or public channel privacy.
- Evidence: source/guide command coverage for all 38 MOHAE declarations and 4 Polly declarations; static link review. No code behavior changes; RED/GREEN test execution not applicable to docs-only change.
- Safety: no tokens/user data.

## Recorded status

- 2026-11-22: not_started -> in_progress -> implemented at guide SHA `bcde7063db07bf76f700b13e4e6e9028d880840b`. Static guide and source command-coverage check passed (38/38 MOHAE, 4/4 Polly). Full live user acceptance remains unverified.
