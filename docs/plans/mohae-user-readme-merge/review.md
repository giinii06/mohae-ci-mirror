# User README / merge review (sequential self-review, 2026-11-22)

## Context and evidence

- Repo: blond11qq/mohae
- Existing MR: !1, `feat/mohae-v1-three-bots` -> `main`
- Reviewed guide+source SHA: `bcde7063db07bf76f700b13e4e6e9028d880840b`
- Verified document paths: `README_USER.md` and `README.md` top-link.
- Review type: sequential self-review. No independent code reviewer, runtime or production service evidence.

## Requirements / documentation lens

- All 38 declared MOHAE command names and all four Polly command names were cross-checked against the guide; missing names: none.
- Beginner flow: join server -> /도움말 -> /게임 -> /출석 -> /일퀘 -> /뽑기.
- Rewards, KST 05:00 reset, 1/10-pull currency prices, pity, protected last card, opt-in journal and report rate limits are grounded in current code.
- Admin-only commands separated from user help; dummy content and absence of narrative/AI/card trading disclosed.
- Relative links from the user guide to README.md, docs/game-rules.md and docs/operations.md reference existing files.
- Documentation feature is implemented and statically reviewed, but live usability has not been E2E-tested.

## Security/privacy lens

- User guide never exposes secrets or tells ordinary users to access hosting environments.
- Private reply is not represented as true anonymity; Polly stores report information accessible by staff.
- Account deletion accurately described as anonymizing identity and deleting journal/visibility, not a guaranteed full physical erase.
- User export warned to contain plaintext private data; journal persistence is explicit opt-in.
- No actual Discord commands have been executed in a real guild.

## Merge gate — blocked

- GitLab effective CI config: external `.gitlab/ci-hub-request.yml@blond11qq/ci-hub-smoke`.
- Fresh pipeline: https://gitlab.com/blond11qq/mohae/-/pipelines/3098867015
- Source SHA: `bcde7063db07bf76f700b13e4e6e9028d880840b`
- Pipeline displays success but the only bridge `dispatch_github_actions` succeeded and **0 test/build jobs** ran.
- Downstream `ci-hub-smoke` pipeline #3098867047 was skipped.
- GitHub Actions Bun typecheck/test/build and exact checkout SHA were not verifiable, and live Discord/restore E2E was not executed.
- Older candidate pipeline #3098849459 now shows failed, not sufficient passing evidence.
- Therefore source is **NOT verified for shipping**; do not conflate permission to merge with evidence that required tests passed.
- Keep existing MR Draft. To merge under Alchemy's gates, gather actual exact-code-SHA Bun jobs and user-flow/E2E evidence or a valid explicitly scoped waiver where permitted. Do not change CI settings/mirroring/runners or merge just because dispatch is green.
