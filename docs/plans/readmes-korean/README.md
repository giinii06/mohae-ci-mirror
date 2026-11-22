# MOHAE README 전체 한글화 작업 계획 — Alchemy 2.2

- 검증 체계: `gate_version=2.2`
- 기준: `main`의 `dbf4db435fa219e76762a6be7c5f0bb931398b56`
- 작업 브랜치: `docs/readmes-korean-20261122`
- 병합 대상: `main` (사용자가 앞선 병합 요청을 한국어로 정정)
- 사용자 결과: 저장소에서 README로 제공되는 문서의 설명 문장과 표를 모두 한국어로 읽을 수 있다.
- 범위: 루트 `README.md`, `README_USER.md`, 기존 3개 `docs/plans/**/README.md`, 이 계획의 `README.md`까지.
- 고유값 보존: Git SHA, ID, 경로, 환경변수, Docker/Bun 명령, Markdown 링크, 게임 API 계약, 실제 Discord 한글 명령어는 원형을 유지한다.
- 비대상: 실행 코드, 테스트, 설정 파일, 과거 Phase 계획 및 리뷰 파일, 저장소 외부 문서. 배포·러너·미러·토큰 변경 없음.
- 과거 이력: 이전 계획에서 기록된 테스트 미확인·드래프트·병합 당시 상태는 **그 당시의 기록**으로 번역하며, 현재 상태인 것처럼 고치지 않는다.
- 검증: 모든 README 목록 재조회, 한글 설명·목차 및 링크 확인, MOHAE 38개/Polly 4개 명령어 누락 확인, 변경 파일 범위와 MR HEAD SHA 확인.
- CI 주의: 현재 외부 CI 브리지 호출만 성공해도 Bun 테스트 결과를 보장하지 않는다. 문서 검증과 실제 앱 검증을 구분한다.

## 단계

1. [1단계 — 전체 README 번역](phase-01-translation.md): 다섯 기존 README의 설명을 한국어로 옮기고 기술 식별자는 보존.
2. [2단계 — 검증과 병합](phase-02-merge.md): 문서 경로·명령어·수치·개인정보 설명을 검토하고 사용자 요청에 따라 MR을 `main`으로 병합.

## 상태 이력

- 2026-11-22: 1단계 `not_started`, 2단계 `not_started`. 이전 코드의 Bun/Discord 실사용 검증은 이 문서 작업으로 대체되지 않음.
