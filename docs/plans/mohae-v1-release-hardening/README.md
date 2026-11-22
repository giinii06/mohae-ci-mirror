# MOHAE v1 release hardening (Alchemy 2.2)

- gate_version: 2.2
- project: blond11qq/mohae (#89258415)
- source branch: feat/mohae-v1-three-bots
- target: main, existing Draft MR !1
- baseline code SHA: ffa8b3443d7f06485c50d733d45b82683d5a0fbb
- user outcome: Three distinct Discord bot accounts operate the documented collection game, activity rewards and private moderation workflows, with safe persistent economy and repeatable deployment.
- negative acceptance: Malformed commands reject before registration, commands cannot cross bot role, public channels cannot leak reports, double actions cannot double-credit, restarts must not lose data.
- constraints: No merge, live deploy, GitLab runner or visibility/mirror setting changes; no real bot tokens or guild test environment provided. Stories/AI chat/card trading remain intentionally out of scope per approved v1 design.
- CI provider: effective project ci_config_path is an external GitLab -> GitHub Actions bridge; historical feature-branch GitLab pipeline was green on baseline SHA, but new-SHA evidence must be re-resolved.
- method: Sequential self-review, source-pinned GitLab commits and remote CI; no independent reviewer or local authenticated checkout assumed.

## Phases

1. [Phase 01](phase-01-command-contract.md): Fix source-encoded command names and guard Discord registration; verify full command surface, negative validation.
2. [Phase 02](phase-02-moderation.md): Wire all Polly reporting/status/admin commands with role checks, private replies and tests.
3. [Phase 03](phase-03-integration.md): Regression and restart/deployment checks, security/privacy review and operator instructions.

## State (append-only events)

- 2026-11-22: Phase 01 not_started; Phase 02 not_started; Phase 03 not_started. This plan is authored from inspected baseline source. Later states require actual SHA-specific evidence; no retroactive CI or live Discord claim.

## Release gate

Human-controlled Discord test-guild smoke test with three tokens, backup+restore rehearsal, offsite encrypted backup, privacy/permission review and stable schema migration plan are required before non-draft MR or deployment. Code/test completion does not replace these external E2E requirements.
