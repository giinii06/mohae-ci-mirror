# Phase 03 — Integration, operations, review

State: not_started

User flow: docker compose starts 3 independent bots plus shared API; data/rewards remain correct across retries and restart; runbook covers backup and recovery.
Negative: missing token/secrets, cross-role access, failing health, lost or unreadable backup must not be called production-ready.
Entrypoint: compose.yaml, deploy scripts, tests, docs/operations.md.
Checks: typecheck, Bun tests, four builds, compose config, validation tests for command contracts, review of diff for requirements + security separately.
Proof: effective external CI must be resolved by exact SHA; report unavailable jobs and real-world E2E as unknown. Do not merge or deploy.


## 2026-11-22 implementation checkpoint

Status transition: not_started -> in_progress -> implemented. Code SHA: f88e22464c0ecedc91394ef0190c05bf5764dfb9.
- Added SQLite user_version=1 guard, guarded offline backup restore+rollback, private export submitted report coverage and backup exclusions.
- Added GitHub Actions workflow and detailed production checklists; configured GitLab bridge not sufficient for test proof.
- Exact-SHA GitLab pipeline 3098849459: success dispatch but zero testing jobs; downstream 3098849510 skipped. GitHub jobs UNKNOWN. Docker and Discord end-to-end unverified.
- Actual restore reheasal, offsite encryption/retention review and permissions audit still required. Gate blocked before tested/verified.
