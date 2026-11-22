# Phase 01: complete English README translation

- State: not_started
- User flow: English reader can learn every MOHAE and Polly command without Korean prose, and knows the Discord command identifiers are still Korean.
- Changes: `README.md` and `README_USER.md`; inspect but do not rewrite already-English historical plan READMEs.
- Validation: no Korean natural-language sentences in rewritten guides; 38/38 MOHAE, 4/4 Polly command identifiers included; navigation anchors/relative links intact; gameplay values source-checked.
- Negative flow: reader must not be told to type non-existent English aliases; private reports must not be presented as anonymous; irreversible anonymization must not be misrepresented as physical deletion.
- Executor: GitLab connector static source comparisons; no local CI/test runner authenticated. No application-code change, so RED/GREEN Bun test not applicable to these docs.
