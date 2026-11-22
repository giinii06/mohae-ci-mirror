# English README translation — sequential two-lens review

## Requirements lens

- Reviewed source commit: `3c37d78f3ba5b310a9a5793d182f02e0e24e4622`
- Target main baseline: `aa4c65fe49a3266f6b4b954e5eb55575bc58ba30`
- User outcome: read every README entirely in English without inventing or changing slash commands.
- Repository contains exactly four README files: root README.md, README_USER.md, and two historical docs/plans README.md files.
- Historical plan READMEs were already English and retained unchanged to preserve append-only evidence.
- Translated root documentation; translated all prose of the user guide.
- Registered Korean slash command names and Discord option labels remain as literal code identifiers, **not English prose**. English aliases cannot be supplied without code changes, which were not requested.
- Static source/guide coverage: MOHAE 38/38, Polly 4/4. All 10 internal TOC anchors resolve; root and guide relative links point to existing repository files.
- Source-based mechanics, warnings and moderator-only restrictions retained. No functional changes.
- Review method: sequential self-review only, no independent reviewer.

## Security and quality lens

- No production code, tests, CI config, tokens, dependencies, deployment scripts, or database schema changed.
- Retained private-journal opt-in, personal export risk, limits of account anonymization and non-anonymous-to-staff reporting.
- Retained explicit warning that live Discord operation and actual game build/E2E have not been verified.
- English-only natural-language criterion: no Hangul outside inline code in README_USER.md; no Hangul at all in root README.md; historical plan READMEs already entirely English.
- This is a docs-only static validation; no Bun typecheck/test/build executed for this change; no runtime readiness claim.
- Readiness for the **documentation** merge is independent of older unverified application deployment.
