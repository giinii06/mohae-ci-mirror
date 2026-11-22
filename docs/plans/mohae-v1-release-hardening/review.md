# MOHAE v1 — two-lens sequential self-review

- Reviewed code SHA: f88e22464c0ecedc91394ef0190c05bf5764dfb9
- Baseline source SHA: ffa8b3443d7f06485c50d733d45b82683d5a0fbb
- Reviewer: self (sequential review); no independent reviewer, no local Bun test executor
- MR: blond11qq/mohae!1; remains Draft and must not be deployed or merged on this evidence

## Requirements / user flow lens

- Three Discord client processes (MOHAE / Collector / Polly) and internal API remain structurally separate.
- MOHAE: static inspection of 38 slash command declarations and 38 case labels, plus all permitted MOHAE API calls routed in its Discord adapter.
- Polly: private report submit/status/list/update handlers; user-specific SQL report ownership, staff permission checks and ephemeral response.
- Original dummy content remains; narrative/AI chat and card trades remain intentionally excluded by approved v1 design.
- Added static command contract regressions, API moderation cases, SQLite migration version regression, personal data export regression.
- **Blocker**: no real three-account Gateway sign-in, command registration or positive/negative permission test in Discord guild. No production E2E completion claim.

## Quality / security / operations lens

- The game API uses role-specific secret hashes, guild allowlist, one SQLite writer, and private internal network.
- A report notification contains receipt ID only, without untrusted raw report text; report list stays private to Manage Guild users.
- Backups/SQLite files are excluded from Git/Docker contexts. Private export now includes reports submitted by requesting identity, not unrelated users' reports.
- A guarded offline restore script rejects arbitrary archive members, requires explicit --confirm, and stores a rollback snapshot before SQLite replacement.
- Newer unrecognized SQLite user_version triggers failure rather than implicitly using an incompatible DB.
- Outstanding: real guild permission checks, role hierarchy, live voice eligibility, restore rehearsal, offsite encrypted backup, retention/privacy approval, future schema-version migrations.
- Source-only static review does not certify absence of security bugs; this is not independent review.

## Exact-SHA CI evidence

- Candidate code SHA: f88e22464c0ecedc91394ef0190c05bf5764dfb9
- Pipeline: https://gitlab.com/blond11qq/mohae/-/pipelines/3098849459
- GitLab status SUCCESS for only dispatch_github_actions; number of local Bun test/build jobs = 0.
- Downstream: https://gitlab.com/blond11qq/ci-hub-smoke/-/pipelines/3098849510, SKIPPED.
- Evidence: dispatch success; provider result UNKNOWN; actual jobs verified NO; E2E verified NO.
- Prior old-SHA Bun 23/23 success is not candidate test evidence. Candidate cannot be marked tested/verified/completed.

## Gate decision

All 3 phases are implemented, blocked at actual test/external E2E verification. Preserve existing Draft MR !1. Do not merge or deploy.
