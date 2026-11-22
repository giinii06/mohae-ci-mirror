# Phase 02 — Polly reporting completeness

State: not_started

User flow: user submits private report, can check own receipt; staff with Manage Guild can view and update reports; sensitive reports never appear in public.
Negative: wrong user / non-staff cannot view or mutate reports; malformed status IDs cannot crash or disclose; public moderator channel cannot receive private payload.
Entrypoint: apps/polly.ts -> apps/api.ts -> src/game.ts. Consumer: actual Discord user/admin UI in test guild.
RED: regression assertion covering report status and staff dispatcher routing.
GREEN: implement missing Discord handlers, ephemeral replies, guarded staff channel and redaction.
Proof: Bun tests and genuine live permission smoke test (external release gate).


## 2026-11-22 implementation checkpoint

Status transition: not_started -> in_progress -> implemented. Code SHA: f88e22464c0ecedc91394ef0190c05bf5764dfb9.
- Polly 신고, 신고상태, 신고목록, 신고처리 have Discord adapter implementations, ephemeral replies, Manage Guild guards and receipt-only staff notifications.
- API test cases added for receipt ownership, service role isolation, moderation list/update and invalid status.
- Bun tests and live guild permission/E2E remain unverified. Gate blocked before tested/verified.
