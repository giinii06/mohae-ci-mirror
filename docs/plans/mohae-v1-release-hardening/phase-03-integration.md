# Phase 03 — Integration, operations, review

State: not_started

User flow: docker compose starts 3 independent bots plus shared API; data/rewards remain correct across retries and restart; runbook covers backup and recovery.
Negative: missing token/secrets, cross-role access, failing health, lost or unreadable backup must not be called production-ready.
Entrypoint: compose.yaml, deploy scripts, tests, docs/operations.md.
Checks: typecheck, Bun tests, four builds, compose config, validation tests for command contracts, review of diff for requirements + security separately.
Proof: effective external CI must be resolved by exact SHA; report unavailable jobs and real-world E2E as unknown. Do not merge or deploy.
