# 개발과 유지보수

처음 작업할 때는 `AGENTS.md`, [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)를 읽고 변경 범위를 정하세요. 관리자 운영 절차는 비공개 서버 저장소의 `admin/README.md`에 있습니다.

## 로컬 실행

Node.js 24와 npm을 사용합니다. CI도 Node.js 24를 사용합니다.

```bash
npm ci
npm run dev:local
```

로컬 Supabase 프론트 주소는 `http://127.0.0.1:5164`입니다. 운영 DB를 읽는 개발 화면은 `npm run dev:production`으로 `http://127.0.0.1:5174`에 실행합니다. 이 명령은 `hosted` mode와 무시된 `.env.hosted.local`을 사용합니다. 포트가 점유되면 실행이 실패해야 하며 다른 포트로 바꾸지 않습니다. 운영 계정으로 쓰기 작업을 하면 실제 운영 데이터가 바뀝니다. 개발 검증은 로컬 DB를 기준으로 진행하세요.

## 변경 위치 찾기

| 작업 | 먼저 읽을 파일 | 함께 검증할 항목 |
| --- | --- | --- |
| URL 추가 | `src/app/AppRoutes.tsx`, `src/lib/seo.ts` | 새로고침, canonical, robots, 정적 shell, sitemap, analytics 정규화 |
| 공통 화면과 모달 | `src/index.css`, `src/components/ui/` | 모바일, 다크 모드, Tab과 Escape, 포커스 복원 |
| 오프라인 CSV | `src/lib/csv.ts`, `src/components/upload/CsvUploadPanel.tsx` | 기존 헤더, 세 문제 유형, 박스형 지문, 제목 제안 |
| 저장이나 백업 | `src/lib/offlineDataStorage.ts`, `src/lib/dashboardBackup.ts`, `src/store/useTestStore.ts` | 구형 데이터 이전, 저장 용량 부족, 충돌, 복구 실패 |
| Premium 통신 | `src/lib/premiumApi.ts`, `src/lib/premium/` | 401 1회 재시도, 요청 body와 멱등키 유지, 원문 오류 비공개 |
| 온라인 조회 | `src/hooks/usePremiumResource.ts` | 빠른 경로 변경, 느린 이전 응답, 실패 후 재시도, 빈 목록 |
| 풀이 동작 | `src/components/cbt/CbtSolveScreen.tsx`, `src/pages/PremiumSolvePage.tsx` | 실패한 답안 보존, 저장 전 제출 차단, 오프라인 동일 UI |
| 결과와 복기 | `src/components/session/SessionPageContext.tsx`, `src/lib/premiumSession.ts` | 새 재풀이 세션, 오답 노트, 책갈피, Premium CSV 제한 |
| 랜딩 소개 | `src/pages/LandingPage.tsx`, `src/components/landing/`, `src/lib/seo.ts` | 실제 출시 상태, 저장 경계, 활성 결제 수단 |
| 미니 앱 | `src/mini-apps/README.md`, 해당 앱 manifest | catalog, 저장 namespace, 경로, 앱별 테스트 |

문구는 짧고 구체적인 한국어로 작성합니다. 중간점, em dash, 말줄임표, 상투적인 대비 표현을 새로 넣지 마세요. 기술적 구현 설명은 사용자가 판단하는 데 필요한 경우에만 화면에 표시하고 자세한 내용은 문서에 둡니다.

## 검증

```bash
npm run verify
```

`verify`는 전체 Vitest 테스트와 TypeScript 검사를 포함한 Vite 빌드를 실행합니다. 빠른 확인에는 `npm run typecheck`, 특정 회귀 확인에는 `npm test -- <test-file>`을 사용할 수 있습니다. 필요한 테스트를 통과한 뒤 최종 변경 전체에 `verify`를 실행하세요.

프론트 CI는 `develop` push와 `develop`, `main` 대상 PR에서 같은 명령을 실행합니다. Pages 배포도 테스트와 빌드를 통과해야 합니다. 성공한 개발 PR이 곧 운영 배포를 뜻하지는 않습니다.

```bash
npm run preview -- --host 127.0.0.1 --port 4164 --strictPort
```

`npm run pre`는 기존 작업 지침과 호환되는 preview 별칭입니다. 미리보기는 마지막 `dist` 빌드를 사용합니다. 운영 API 환경으로 빌드한 산출물을 미리 볼 때는 로그인과 변경 대상에 주의하세요.

수동 검증에서는 다음 사용자 흐름을 확인합니다.

1. 랜딩에서 시작하고 `/apps`, `/account`, `/premium`에 직접 접속합니다. 오프라인 저장소 오류가 이 화면들을 막지 않아야 합니다.
2. 샘플 CSV를 새 과목에 등록하고 답안 선택, 중단, 재접속, 제출, 오답 노트와 재풀이를 확인합니다.
3. 온라인 문제를 푸는 중 저장 요청을 실패시켜 답안이 남고 제출이 중단되는지 확인합니다. 연결이 돌아오면 저장 후 제출할 수 있어야 합니다.
4. JSON 복구나 클라우드 복구 실패 시 기존 데이터가 유지되고 확인 모달이 남아 있는지 확인합니다.
5. 모바일과 데스크톱, 라이트와 다크 모드에서 모달의 Tab 순환, Escape, 닫은 후 포커스 복원을 확인합니다.
6. 공개 경로 새로고침과 존재하지 않는 경로의 홈 이동을 확인합니다. ID가 포함된 학습 경로를 sitemap에 넣지 않습니다.

자동 테스트에서는 실제 이메일, 사용자 답안, 유료 콘텐츠를 fixture에 넣지 않습니다. 시간에 따라 의미가 달라지는 테스트는 시간을 고정하거나 해당 테스트의 의미를 분명히 하는 데이터를 사용합니다. 비동기 저장 테스트는 저장 완료 또는 오류 상태를 기다리고 기존 경고를 작업 실패로 오인하지 않도록 대상 요소를 구체적으로 고릅니다.

## 두 저장소 변경과 병합

아래 순서는 기능 추가와 구조 변경에 적용합니다. 문구, 문서, 버전의 작은 수정은 `AGENTS.md`의 허용 범위에서 `develop`에 직접 반영할 수 있습니다. Premium 장기 작업은 기존 `feature/premium` 브랜치 규칙을 따릅니다.

1. 두 저장소의 현재 branch와 미커밋 파일을 확인합니다. 최신 `origin/develop`에서 목적이 드러나는 작업 브랜치를 만듭니다.
2. API, 권한, DB 또는 콘텐츠를 변경하면 서버 계약 문서를 먼저 갱신하고 서버를 구현합니다.
3. 프론트 client와 화면을 맞춥니다. 서버 파일을 프론트 커밋에 포함하지 않습니다.
4. 각 저장소에서 `npm run verify`를 실행합니다. 서버 DB 변경에는 별도의 로컬 DB 검증도 필요합니다.
5. 각 저장소에서 별도 커밋과 PR을 만들고 해당 저장소의 `develop`에 병합합니다. 작업 브랜치를 정리합니다.
6. 운영 릴리즈는 별도로 결정합니다. 프론트는 `develop`에서 `main`으로 PR을 보내고 병합 커밋에 새 버전 태그를 붙입니다. 서버는 자체 수동 배포 절차를 따릅니다.

이미 발행한 태그와 적용된 서버 migration을 수정해 이력을 덮지 마세요. 운영 장애를 되돌릴 때는 문제가 생긴 변경의 revert PR을 검증하며, DB 변경은 서버의 배포 문서에 따라 별도 판단합니다.
