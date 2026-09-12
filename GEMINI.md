# 에이전트 작업 시작점

이 저장소의 공통 지침은 [AGENTS.md](AGENTS.md)입니다. 다른 AI 도구도 같은 지침을 따라 작업합니다.

- 앱 구조와 데이터 흐름: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 디자인 토큰과 공통 UI: [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)
- 변경 위치, 검증, 병합: [docs/MAINTENANCE.md](docs/MAINTENANCE.md)
- 미니 앱: [src/mini-apps/README.md](src/mini-apps/README.md)

프론트는 React, TypeScript, BrowserRouter를 사용합니다. 오프라인 풀이 데이터는 IndexedDB, 설정은 localStorage, Premium 온라인 학습은 비공개 서버가 담당합니다. 상세 규칙을 이 파일에 복제하지 않고 위 문서에서 관리합니다.
