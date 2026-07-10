# AGENTS.md

이 문서는 Codex 및 다른 AI 코딩 에이전트가 `law-solver` 저장소에서 작업할 때 따라야 할 프로젝트 지침입니다.

## 프로젝트 개요

`law-solver`는 서버 없이 브라우저에서 실행되는 React 기반 로스쿨 문제 풀이 앱입니다. 사용자는 과목별 대시보드에서 CSV 파일을 업로드해 OX, 5지선다, 단답형 문제 세션을 만들고, CBT 화면에서 풀이한 뒤 결과 확인, 오답노트, 재풀이, CSV 내보내기, JSON 백업/복원을 수행합니다.

데이터 저장은 서버나 DB가 아니라 브라우저 localStorage를 사용합니다.

- 세션 저장 key: `law-solver-storage`
- 환경설정 저장 key: `law-solver-settings`

## 기술 스택

- React 18 + Functional Components + Hooks
- TypeScript strict mode
- Vite
- Tailwind CSS
- React Router
- Zustand + persist middleware
- Papa Parse
- Vitest

## 주요 디렉터리별 역할

```txt
src/App.tsx
```

라우팅과 테마/폰트 watcher를 담당합니다. 라우트는 `/`, `/dashboard`, `/dashboard/:subjectId`, `/solve/:sessionId`, `/result/:sessionId`, `/wrong/:sessionId`, `/review/:sessionId`입니다.

```txt
src/pages/
```

라우트 단위 화면입니다. 랜딩, 과목 목록, 과목별 대시보드, 풀이 결과, 오답 확인, 전체 리뷰 페이지가 들어 있습니다.

```txt
src/components/
```

재사용 UI 컴포넌트입니다. CBT 풀이 화면, CSV 업로드 패널, 리뷰용 선택지 표시 컴포넌트, 공통 모달/버튼 UI가 들어 있습니다.

```txt
src/store/
```

Zustand store입니다. 문제 세션, 과목, 세션-과목 매핑 상태는 `useTestStore.ts`, 다크 모드와 글꼴 설정은 `useSettingsStore.ts`에서 관리합니다.

```txt
src/lib/
```

CSV 파싱/다운로드, 채점, 정렬, 답안 표시, ID 생성, 시간 포맷 등 도메인 유틸입니다. 관련 단위 테스트도 이 디렉터리에 있습니다.

```txt
src/types/
```

문제 타입, 세션 타입, 답안 타입 등 공유 TypeScript 타입입니다.

```txt
samples/
```

수동 테스트와 사용자 예시용 CSV 파일입니다.

```txt
public/
```

GitHub Pages용 정적 파일입니다. `404.html`은 SPA 새로고침 대응용이며, `CNAME`은 커스텀 도메인용입니다.

## 코드 스타일과 네이밍 규칙

- TypeScript strict mode를 전제로 작성합니다.
- React 컴포넌트는 함수 컴포넌트와 Hooks를 사용합니다.
- 컴포넌트 파일은 `PascalCase.tsx`를 사용합니다.
- 유틸 함수 파일은 `camelCase` 또는 기능명 기반 짧은 이름을 사용합니다. 예: `csv.ts`, `order.ts`, `session.ts`.
- Zustand store는 `useSomethingStore.ts` 형태를 유지합니다.
- Tailwind CSS 유틸 클래스를 우선 사용하고, 전역 CSS는 `src/index.css`에 한정합니다.
- 공통 브랜드 마크는 `src/components/ui/BrandMark.tsx`, 공통 푸터는 `src/components/ui/AppFooter.tsx`를 사용합니다. 화면마다 로고나 푸터를 다시 만들지 마세요.
- 과목 목록과 문제 대시보드의 상단 GNB는 `src/components/ui/DashboardHeaderTitle.tsx`를 사용합니다. 모바일에서도 브랜드명은 `Law Solver` 전체를 표시하고, 제목의 계층 구분에는 `|` 문자가 아니라 컴포넌트의 얇은 시각 구분선을 사용합니다. 모바일에서만 액션을 2열 전체 너비로 표시하고, `sm` 이상에서는 텍스트 너비의 버튼을 우측 정렬합니다. GNB가 두 줄인 `sm`·`md` 구간에서는 액션 영역의 가로 구분선 위아래에 각각 해당 구간의 카드 패딩과 같은 여백을 적용하며, 한 줄이 되는 `lg`부터 구분선과 추가 여백을 제거합니다.
- 채점 결과 페이지도 대시보드와 동일한 GNB와 `app-card` 체계를 사용합니다. 상단은 정답률·풀이 시간 지표, 문제 확인, 다시 풀기의 독립 카드 3개를 2:1:1 비율로 배치하고, 전체·정답·오답·미응답·책갈피는 작은 통계표로 표시합니다. 문제 확인·다시 풀기 버튼의 높이와 글자 크기는 모바일에서도 축소하지 않습니다. 상세 분석표는 그 아래 전체 너비를 사용하며 OMR 표에는 파트 열을 포함합니다.
- 서버 API가 없으므로 브라우저 API 사용 시 호환성을 고려합니다. 예: `crypto.randomUUID()` 직접 호출 대신 `src/lib/id.ts`의 `createId()` 사용.
- CSV 헤더 호환성은 `src/lib/csv.ts`의 `normalize`, `getValue` 흐름을 기준으로 확장합니다.
- localStorage 데이터 구조를 바꿀 때는 기존 사용자 데이터와 마이그레이션 영향을 고려합니다.
- `과목 없음`은 저장되는 subject가 아니라 세션-과목 매핑이 없는 상태입니다. `NO_SUBJECT_ID`는 라우팅/UI용 sentinel로만 사용하세요.

## 디자인 시스템

랜딩과 앱 내부 화면은 미색 배경, 따뜻한 백색 표면, 레드 포인트를 공유합니다. 그라디언트가 필요한 강조 요소는 레드에서 주황·오렌지로 부드럽게 이어집니다. 문제 풀이와 복기 화면에서는 장식보다 가독성과 집중을 우선합니다.

공통 토큰과 컴포넌트 클래스는 `src/index.css`에 있습니다.

- `app-page`: 랜딩을 제외한 라우트 화면의 공통 미색/다크 배경
- `app-card`: 주요 콘텐츠 카드와 OMR 패널
- `app-subtle-surface`: 카드 안의 보조 영역
- `app-topbar`: 풀이·복기 화면의 고정 헤더
- `app-button-primary`: 레드→오렌지 그라디언트가 적용되는 대표 행동
- `app-button-primary-standalone`: 단독 배치된 대표 CTA에만 hover 상승 효과를 허용하는 modifier
- `app-button-secondary`: 중립적인 보조 행동
- `app-control`: input, select, textarea의 공통 포커스와 표면
- `app-modal-backdrop`, `app-modal-surface`: 모달과 모바일 bottom sheet
- `app-progress-gradient`: 진행률처럼 제한된 면적의 브랜드 그라디언트

디자인 작업에서는 다음 원칙을 지킵니다.

- 기존 라우트, 레이아웃, 정보 순서, 버튼 위치, 사용자 흐름을 임의로 바꾸지 않습니다.
- `app-button-*`, `app-card` 같은 공통 시각 클래스에는 `position`, `display`, `width`, `height`, `overflow`처럼 배치를 바꾸는 속성을 넣지 않습니다. 위치와 크기는 페이지 컴포넌트의 Tailwind 클래스가 소유하며, 공통 클래스는 색상·테두리·그림자·전환만 담당합니다.
- 대표 CTA와 작은 진행률에만 레드→오렌지 그라디언트를 사용하고, 넓은 문제 본문이나 표 전체에는 사용하지 않습니다.
- 그라디언트 버튼의 기본 `app-button-primary`는 hover 시 배경 레이어만 한 단계 진해지고 위치·크기·글자색·기본 그림자는 유지합니다. 버튼 전체에 `filter`를 적용하면 흰 글자까지 어두워지므로 사용하지 않습니다. 독립 CTA와 페이지 우상단의 대표 관리 CTA에만 `app-button-primary-standalone`을 함께 사용해 상승 효과를 추가합니다. 카드 하단, 풀이 하단, 결과 페이지의 버튼 묶음에는 modifier를 사용하지 않습니다.
- 문제 세션 카드는 `app-problem-card`의 순백색 표면을 사용하고, 완료 카드 하단의 `app-result-link`는 아주 밝은 중립 회색으로 분리합니다. 문제 카드에 미색 CTA 표면을 사용하지 않습니다.
- 결과 요약과 문제 세션 카드 안의 진행률·시간·점수 같은 중립 정보 박스는 `app-neutral-box`의 쿨 그레이 표면과 얇은 테두리를 사용합니다. 외부의 미색 페이지 배경과 내부 정보 영역이 섞이지 않도록 `bg-stone-50`만 단독으로 사용하지 않습니다.
- 정답은 emerald, 오답과 선택 상태는 red, 정답 안내는 blue, 책갈피는 amber 의미 색상을 유지합니다.
- 본문과 문제 텍스트는 `word-break: keep-all`을 고려하고, 지나치게 굵은 글자나 좁은 행간을 피합니다.
- 라이트 모드에서는 미색 배경과 따뜻한 흰색 표면을, 다크 모드에서는 갈색 기운이 아주 옅은 짙은 표면을 사용합니다.
- 랜딩의 넓은 강조 패널은 갈색이나 마젠타로 치우치지 않는 브랜드 레드→코럴→오렌지 그라디언트를 사용합니다.
- 모달과 모바일 bottom sheet의 공통 배경 블러는 `app-modal-backdrop`의 2px을 기준으로 하며, 개별 화면에서 더 강한 블러를 중복 적용하지 않습니다.
- 탭 전환처럼 문서 높이가 달라지는 화면에서도 중앙 정렬 UI가 흔들리지 않도록 최상위 `html`의 `scrollbar-gutter: stable`을 유지합니다.
- 디자인 전용 작업에서 Zustand store, localStorage 스키마, CSV 파서, 채점 로직을 함께 수정하지 않습니다.
- 공통 스타일을 추가할 때 기존 `app-*` 클래스나 UI 컴포넌트를 먼저 확장하고 페이지마다 긴 스타일 문자열을 복제하지 않습니다.
- 테마형 드롭다운은 `src/components/ui/ThemeSelect.tsx`를 사용합니다. 문제 편집, 새 문제 등록, 재풀이 설정 등 앱의 모든 드롭다운은 네이티브 `<select>` 대신 이 컴포넌트를 사용하며, 바깥 클릭, Escape, 방향키, Home/End, Enter/Space 조작을 유지합니다. 화살표는 고정 크기 박스의 중심축에서만 회전하도록 유지합니다.
- 활성 문제 풀이 화면은 `app-focus-page`를 사용합니다. 이 범위에서는 그라디언트, hover 이동·축소, 위치/크기 transition, animation, smooth scroll을 추가하지 않습니다. 기본 CTA는 단색 red-600, hover는 red-700을 사용하며 색상·테두리 전환만 90ms로 짧게 허용합니다.
- 문제풀이·오답 확인·전체 확인·책갈피 확인 화면은 동일한 `app-focus-page` 상단 바 높이와 콘텐츠 시작 간격을 사용합니다. 문제풀이 상단 우측 버튼은 고정 폭이나 균등 분할을 적용하지 않고 텍스트 너비만큼 차지한 상태로 우측 정렬합니다.
- 과목 순서 변경은 브라우저 기본 `draggable` 대신 전용 드래그 손잡이와 Pointer Events를 사용합니다. 카드 본문은 모바일 스크롤을 유지하고, 손잡이에서만 `touch-action: none`과 텍스트 선택 방지를 적용하며 키보드 위·아래 이동도 지원합니다.
- 활성 문제 풀이의 상단 헤더는 타이머·세션명·중단·제출 기능만 유지하는 압축 높이를 사용합니다. 헤더나 바깥 여백을 불필요하게 키워 문제 카드의 세로 영역을 줄이지 않습니다.
- 데스크톱 상단의 `일시 중단`·`제출 및 종료` 버튼 그룹은 OMR 열과 동일한 220px 폭을 사용하고 두 버튼이 그룹 안을 균등하게 채웁니다. 모바일에서는 고정 폭을 해제하고 콘텐츠 너비에 맞춰 축소합니다.
- `제출 및 종료` 시 미응답 문항이 있으면 남은 개수를 표시하는 확인 모달을 먼저 띄웁니다. 미응답이 없으면 바로 제출하고, 확인 모달에서 취소하면 풀이 상태를 유지합니다.
- 데스크톱 풀이 화면에서 문제 카드와 OMR 높이를 서로 독립시킵니다. OMR은 사용 가능한 시험 화면 높이(`calc(100vh - 112px)`)를 유지하고 목록만 내부 스크롤합니다. 문제 카드는 OX 420px, 단답형 360px, 5지선다 560px을 기본 최소 높이로 사용하되 콘텐츠 분량에 따라 최대 화면 높이까지 늘어나고, 이를 넘으면 문제 본문만 스크롤합니다.
- OX 선택지 안의 `다음 문제로` 버튼은 선택지의 `top/right/bottom`에 동일한 8px 여백을 사용합니다. 중앙 정렬용 transform으로 상하 여백이 달라지지 않게 합니다.
- 전체 문제·책갈피·오답 복기 화면의 하단 이동 영역에도 `app-focus-page` 범위를 적용해 실제 문제 풀이 화면과 동일한 단색 CTA와 정적인 hover 규칙을 유지합니다.
- 랜딩의 문제 풀이 미리보기는 실제 CBT의 상단 제어, 문제 카드, 선택지, OMR, 하단 이동 구조와 상태를 기준으로 유지합니다. 장식용 브라우저 프레임이나 실제 풀이에 없는 결과·해설 UI를 임의로 추가하지 않습니다.
- 랜딩의 핵심 풀이 소개에는 실제 문제 카드 UI를 간략화해 사용하고, 보조 기능 카드는 한눈에 구분되는 아이콘 중심으로 압축합니다. 미리보기는 장식용이며 실제 사용자 흐름과 혼동되지 않도록 비활성 상태로 표시합니다.
- 사용 설명의 CSV 샘플 다운로드는 `public/samples/`에 둡니다. 루트 `samples/`는 개발·수동 테스트용이며 배포 산출물에 자동 포함되지 않습니다. 박스형 5지선다는 `박스1`, `박스2`… 열과 `선택지1`~`선택지5`를 구분하고, 단답형은 입력값의 정확한 문자열 일치 규칙을 설명합니다.

## 작업 전 확인해야 할 명령어

저장소 구조 확인:

```bash
rg --files
```

스크립트 확인:

```bash
sed -n '1,220p' package.json
```

라우팅 확인:

```bash
sed -n '1,220p' src/App.tsx
```

주요 타입 확인:

```bash
sed -n '1,260p' src/types/test.ts
```

CSV 관련 작업 전 확인:

```bash
sed -n '1,320p' src/lib/csv.ts
```

상태 저장 관련 작업 전 확인:

```bash
sed -n '1,280p' src/store/useTestStore.ts
sed -n '1,220p' src/store/useSettingsStore.ts
```

## 변경 후 실행해야 할 검증 명령어

기본 검증:

```bash
npm test
npm run build
```

개발 서버 확인:

```bash
npm run dev
```

빌드 결과 미리보기:

```bash
npm run preview
```

린트:

```bash
npm run lint
```

현재 `package.json`에는 `lint` 스크립트가 없습니다. 린트 검증은 “확인 필요”로 표시하거나, 별도 작업으로 ESLint 설정을 추가해야 합니다.

## 수정 시 주의할 파일과 패턴

- `src/lib/csv.ts`: CSV 업로드/다운로드, Excel 인코딩, 샘플 CSV와 직접 연결됩니다. 헤더 호환성을 깨지 않게 조심하세요.
- `src/types/test.ts`: localStorage에 저장되는 세션 구조와 연결됩니다. 필드 변경 시 기존 저장 데이터 호환성을 검토하세요.
- `src/store/useTestStore.ts`: 세션 생성, 과목 CRUD, 세션-과목 매핑, 답안 저장, 오답노트, 북마크, 백업/복원 동작의 중심입니다.
- `src/components/cbt/CbtSolveScreen.tsx`: 풀이 UX, 타이머, OMR, 단답형 입력, 정답 보기, 책갈피 기능이 모여 있습니다.
- `src/index.css`: 랜딩 스타일과 앱 공통 `app-*` 디자인 토큰/컴포넌트 클래스가 함께 있습니다. 공통 색상이나 표면을 바꿀 때 라이트·다크 모드를 함께 확인하세요.
- `src/components/ui/BrandMark.tsx`: `public/favicon.svg`를 사용하는 공통 로고입니다. 헤더와 푸터에서 동일한 자산을 유지하세요.
- `src/pages/ResultPage.tsx`: 재풀이, CSV 다운로드, 결과 요약 액션이 많아 회귀 가능성이 큽니다.
- `src/pages/SubjectListPage.tsx`: `/dashboard` 과목 목록 화면입니다. 과목 관리, 표지 색상 선택, 과목 카드 드래그 순서 변경, 환경설정, 전체 데이터 백업/복원/초기화가 이 페이지에 있습니다. 과목 삭제는 세션 삭제가 아니라 매핑 삭제로 처리해야 합니다.
- `src/pages/DashboardPage.tsx`: `/dashboard/:subjectId` 과목별 세션 대시보드입니다. 새 문제 등록과 편집 시 세션-과목 매핑이 맞는지 확인하세요. 전체 데이터 백업/복원 UI는 이 페이지에 두지 않습니다.
- `public/404.html` 및 `index.html`: GitHub Pages SPA 새로고침 대응 스크립트가 들어 있습니다. 라우팅/배포 변경 시 함께 확인하세요.
- `vite.config.ts`: GitHub Pages 기본 도메인과 커스텀 도메인 운영 방식에 따라 `base` 설정 영향이 큽니다.
- `public/CNAME`: 현재 커스텀 도메인 `lawsolver.haryun.io`가 설정되어 있습니다. 기본 GitHub Pages URL로 운영할 때는 이 파일과 DNS 상태를 확인하세요.

## 환경변수와 시크릿 취급

현재 필수 환경변수는 없습니다.

이 프로젝트는 프론트엔드 전용 앱이므로 빌드된 JS가 사용자에게 그대로 전달됩니다. API 키, 토큰, 개인정보, 서버용 시크릿을 코드나 `.env`에 넣지 마세요. Vite 환경변수를 추가해야 한다면 클라이언트에 공개되어도 되는 값만 `VITE_` 접두사로 사용하세요.

## 배포

GitHub Actions 워크플로우는 `.github/workflows/deploy-pages.yml`입니다.

- 트리거: `main` 브랜치 push, 수동 실행
- 설치: `npm ci`
- 빌드: `npm run build`
- 산출물: `dist`
- 배포 대상: GitHub Pages

SPA 라우트 새로고침은 `public/404.html`과 `index.html`의 redirect restore 스크립트로 처리합니다.

## localStorage 마이그레이션과 백업

`law-solver-storage`는 Zustand persist `version: 2`를 사용합니다.

- `sessions`: 문제 세션과 답안
- `subjects`: 사용자가 만든 과목 목록, 표지 색상, 표시 순서
- `sessionSubjectMap`: `sessionId -> subjectId` 매핑

기존 v1 데이터는 `sessions`만 있었기 때문에 마이그레이션 시 `subjects: []`, `sessionSubjectMap: {}`로 보정합니다. 즉 기존 문제는 모두 `과목 없음`으로 표시됩니다.

백업/복원은 특정 과목 단위가 아니라 전체 데이터베이스 단위입니다. 백업 복원은 두 형식을 모두 지원해야 합니다.

- 구형: `TestSession[]`
- 신형: `{ app, version, exported_at, sessions, subjects, sessionSubjectMap }`

복원 시 존재하지 않는 sessionId 또는 subjectId를 가리키는 매핑은 버려야 합니다.

## 커밋/PR 작성 권장 형식

커밋 메시지는 변경 의도가 바로 보이게 짧게 작성합니다.

예시:

```txt
docs: update project setup and agent guide
fix: handle csv export encoding for excel
feat: add dashboard backup restore
test: cover question ordering modes
```

PR에는 다음을 포함하는 것을 권장합니다.

- 변경 요약
- 사용자 흐름 영향
- 실행한 검증 명령어와 결과
- 스크린샷 또는 화면 변경 설명
- localStorage 데이터 구조 변경 여부
- 배포 설정 변경 여부

## 작업 원칙

- 문서 작업은 실제 파일과 설정을 읽은 뒤 반영합니다.
- 큰 리팩터링은 문서 정리 작업과 섞지 않습니다.
- README와 샘플 CSV의 설명이 실제 파서 동작과 맞는지 확인합니다.
- 브라우저 저장소 의존 기능은 백업/복원 UX와 데이터 손실 가능성을 함께 고려합니다.
- GitHub Pages 관련 수정은 커스텀 도메인과 프로젝트 경로 배포의 차이를 명확히 확인한 뒤 진행합니다.
