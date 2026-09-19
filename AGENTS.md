# AGENTS.md

이 문서는 Codex 및 다른 AI 코딩 에이전트가 `law-solver` 저장소에서 작업할 때 따라야 할 프로젝트 지침입니다.

## 프로젝트 개요

`law-solver`는 React 기반 로스쿨 문제 풀이 앱입니다. 오프라인 CSV 문제와 설정은 기본적으로 브라우저에 저장하고, Premium 계정·결제·온라인 학습과 사용자가 직접 실행한 암호화 클라우드 백업은 비공개 `law-solver-server` Supabase 백엔드를 사용합니다.

오프라인 문제 풀이 데이터는 브라우저 IndexedDB를 사용합니다. 환경설정과 미니 앱별 로컬 데이터는 기존 localStorage를 사용합니다.

- 오프라인 DB/object store/key: `law-solver-offline` / `persisted-state` / `law-solver-storage`
- 레거시 세션 저장 key: `law-solver-storage` (첫 정상 접속 시 IndexedDB로 안전 이전 후 삭제)
- 환경설정 저장 key: `law-solver-settings` (localStorage)

## 연관 저장소와 변경 경계

- 프론트는 이 저장소, 비공개 Supabase 백엔드는 형제 폴더 `../law-solver-server`에서 관리합니다.
- API·DTO·RLS·결제·문제 콘텐츠 변경은 서버 저장소가 소유합니다. `../law-solver-server/docs/API.md`, `AUTHORIZATION.md`, `FRONTEND_INTEGRATION.md`를 먼저 갱신한 뒤 프론트 client와 UI를 맞추세요.
- 프론트는 공개 Supabase URL과 publishable key만 사용합니다. 서버의 CSV 콘텐츠, migration용 관리자 값, `service_role`, 결제·SMTP secret을 이 저장소로 복사하지 마세요.
- 로컬 실행 포트는 DB 대상에 따라 고정합니다. `npm run dev:local`과 기본 `npm run dev`는 로컬 Supabase를 바라보는 `127.0.0.1:5164`, `npm run dev:production`은 운영 Supabase를 바라보는 `127.0.0.1:5174`입니다. 운영용 명령은 `hosted` Vite mode와 `.env.hosted.local`을 사용하고 포트가 점유되면 임의 포트로 이동하지 않아야 합니다.
- 두 저장소에 걸친 변경은 각각 검증하고 별도 커밋으로 남깁니다. 한 저장소의 커밋에 다른 저장소 파일을 포함하거나 두 저장소의 배포를 암묵적으로 묶지 마세요.
- 프론트는 `develop`을 통합 기준으로 하고 Premium 장기 작업은 `feature/premium`에서 진행합니다. 서버는 `develop`에서 통합하고 안정 상태만 `main`으로 반영합니다. 서버는 PR CI를 실행하며 운영 배포는 별도 확인과 GitHub Environment 승인을 요구하는 수동 workflow를 사용합니다.

## Git 브랜치와 릴리즈 규칙

- 문구·문서·버전처럼 범위가 작고 위험이 낮은 수정은 별도 작업 브랜치를 만들지 않고 `develop`에 직접 커밋·푸시할 수 있습니다.
- 상당한 기능 추가, 구조 변경, 여러 파일에 걸친 고위험 수정은 `develop`에서 목적이 드러나는 작업 브랜치를 분기하고 PR로 `develop`에 통합한 뒤 작업 브랜치를 삭제합니다. Premium 장기 작업은 `feature/premium`을 사용합니다.
- 운영 `main`에는 직접 커밋하거나 푸시하지 않습니다. 검증된 `develop`만 PR로 `main`에 병합합니다.
- 릴리즈할 때 현재 범위와 무관한 작업 브랜치를 함께 병합하지 마세요. 특히 `feature/premium`은 해당 릴리즈에 Premium 변경을 포함하기로 명시된 경우에만 `develop`에 병합합니다.
- 소규모 수정의 프론트 릴리즈 순서는 `develop` 직접 커밋·푸시, `npm test`와 `npm run build` 확인, `develop`에서 `main`으로 PR·병합, `main` 병합 커밋 태깅과 GitHub Release 발행입니다. 큰 기능은 그 전에 작업 브랜치 푸시와 `develop` PR·병합·브랜치 삭제 단계를 추가합니다.
- 태그와 GitHub Release 이름은 동일한 `vX.Y.Z` 형식의 버전 문자열만 사용합니다. `Law Solver vX.Y.Z`, `Release Law Solver vX.Y.Z`처럼 제품명이나 설명을 릴리즈 이름에 붙이지 마세요.
- 릴리즈 태그는 해당 버전의 `main` 병합 커밋을 가리켜야 합니다. 이미 발행한 태그를 이동하거나 재사용하지 말고, 명시적인 정정 요청이 있을 때만 기존 릴리즈 메타데이터를 수정합니다.
- 서버 저장소 변경은 프론트 릴리즈에 암묵적으로 포함하지 않고 서버 저장소의 별도 브랜치·PR·검증·배포 절차를 따릅니다.

## 기술 스택

- React 18 + Functional Components + Hooks
- TypeScript strict mode
- Vite
- Tailwind CSS
- React Router
- Zustand + persist middleware
- Supabase JavaScript Client
- Papa Parse
- Google Analytics 4 (`gtag.js`)
- Vitest

## 주요 디렉터리별 역할

```txt
src/App.tsx
```

전역 기능을 조합합니다. 라우트와 화면 지연 로딩은 `src/app/AppRoutes.tsx`, 테마와 계정 watcher는 `src/app/AppWatchers.tsx`, 화면 오류 복구는 `src/app/AppRouteBoundary.tsx`가 담당합니다. Premium 온라인 라우트는 `/premium`, `/premium/courses/:courseId`, `/premium/courses/:courseId/problem-sets/:problemSetId`, `/premium/attempts/:attemptId`, `/premium/results/:attemptId`, `/premium/wrong/:attemptId`, `/premium/review/:attemptId`이며 동적 ID를 메타데이터나 분석에 보내지 않습니다. 출시된 미니 앱은 `/apps/:appId` 아래에 추가하며 현재 `/apps/lbti`, `/apps/legal-ethics-17`, `/apps/hoban-course-registration`을 제공합니다.

```txt
src/pages/
```

라우트 단위 화면입니다. 랜딩, 미니 앱 목록, 과목 목록, 과목별 대시보드, 풀이 결과, 오답 확인, 전체 리뷰 페이지가 들어 있습니다.

```txt
src/components/
```

재사용 UI 컴포넌트입니다. CBT 풀이 화면, CSV 업로드 패널, 리뷰용 선택지 표시 컴포넌트, 공통 모달/버튼 UI가 들어 있습니다. `src/components/analytics/PageViewTracker.tsx`는 React Router 이동에 따른 정규화 페이지뷰를 전송합니다.

```txt
src/mini-apps/
```

Law Solver 안에서 독립적으로 실행되는 미니 앱 영역입니다. `catalog.ts`는 `/apps` 목록의 단일 출처이고, 각 `<app-id>/` 폴더는 manifest, 기능 코드, 테스트, 개발 문서를 소유합니다. 자세한 생성 순서와 경계 규칙은 `src/mini-apps/README.md`를 따릅니다.

```txt
src/store/
```

Zustand store입니다. 문제 원본, 세션별 풀이 기록, 과목 상태는 `useTestStore.ts`, 다크 모드와 글꼴 설정은 `useSettingsStore.ts`, 온라인 계정·이용권 상태는 `useAccountStore.ts`에서 관리합니다.

```txt
src/lib/
```

CSV 파싱/다운로드, Premium API client, GA4 이벤트, SEO 정책, 채점, 정렬, 답안 표시, ID 생성, 시간 포맷 등 도메인 유틸입니다. `premiumApi.ts`는 공개 진입점을 유지하고 `src/lib/premium/`의 타입, 인증, 통신, 오류, 계정, 학습, 백업 모듈을 연결합니다. 관리자 key를 사용하지 않습니다.

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
- 브라우저 API 사용 시 호환성을 고려합니다. 예: `crypto.randomUUID()` 직접 호출 대신 `src/lib/id.ts`의 `createId()` 사용.
- Premium API는 `src/lib/premiumApi.ts`를 통해 호출하고, IndexedDB의 오프라인 `law-solver-storage`와 Supabase Auth·온라인 학습 데이터를 섞지 마세요.
- Premium 오프라인 클라우드 백업은 자동 동기화하지 않습니다. 사용자가 명시적으로 실행할 때 `DashboardBackupData` 전체 JSON을 브라우저에서 gzip 압축하고 8자 이상 비밀번호 기반 PBKDF2-SHA256·AES-256-GCM으로 암호화한 뒤 `backup-api`의 signed Storage 경로로 전송하세요. 비밀번호·키·평문을 API, IndexedDB, localStorage, 로그, 분석에 남기지 마세요.
- 클라우드 백업은 암호화 최종본 15MB, 원본 JSON 30MB, 백업·복구 각각 하루 5회 정책을 UI와 서버 응답 기준으로 안내합니다. 복구 암호문은 열린 모달 메모리에만 캐시해 비밀번호 오입력을 재시도하고, 로그아웃·새로고침·모달 종료 시 버립니다. 복호화·구조 검증과 사용자 최종 확인 전에는 현재 데이터를 변경하지 마세요.
- 개인정보 안내에서는 오프라인과 Premium 온라인 학습을 구분하세요. 사용자가 업로드한 오프라인 CSV의 문제·답안·풀이 기록은 브라우저에만 남지만, Premium 온라인 문제의 문항별 답안·진행 상태·결과·책갈피·오답 노트·재풀이 기록은 기능 제공을 위해 서버에 저장됩니다. “문제와 답안을 보내지 않는다”는 문구는 GA4 분석 전송 제한으로만 설명하고 Premium 서버 저장까지 부정하지 마세요.
- 이용권 CTA는 `PurchaseMethodModal`을 사용해 무통장입금·토스페이먼츠·프로모션 코드를 한곳에서 표시합니다. 미구현 수단은 준비 중으로 비활성화하고, 프로모션 코드는 모달 내부 전환 뒤 `promotion-api`로 사용합니다. 성공 후 `account-api`를 새로 조회해 이용권과 결제내역을 함께 갱신하세요.
- Premium 회원권 카드에는 현재 이용 상태와 활성 이용권의 시작 일자, 예약 연장분까지 포함한 최종 종료 예정 일자를 함께 표시합니다. 만료·취소 이용권은 기간 계산에서 제외하고, 예약 이용권만 있는 상태를 현재 이용 중으로 표시하지 마세요.
- 결제내역은 서버가 발급한 결제 식별번호, 상품, 결제수단, 금액, 구매일시만 표시합니다. 프로모션 코드 원문, provider key, Auth token을 프론트 상태·로그·분석에 저장하거나 전송하지 마세요.
- 결제번호는 서버가 발급한 비순차 `LS-YY########` 문자열을 그대로 표시합니다. 숫자를 재정렬·재계산하거나 거래량을 추정할 수 있는 증가값으로 대체하지 마세요.
- Premium 화면에는 Supabase Auth, Edge Function, 결제사, 네트워크의 원문 `error.message`를 직접 표시하지 않습니다. `getPremiumErrorMessage`에서 안정적인 오류 code·HTTP status를 행동 가능한 한국어 안내로 변환하고, 화면별 fallback도 사용자가 다음에 할 일을 포함해야 합니다.
- Supabase Auth 구독은 초기 계정 API보다 먼저 등록해 첫 조회가 실패해도 `TOKEN_REFRESHED`를 놓치지 않게 합니다. 장시간 유휴 탭이 다시 보이거나 포커스를 얻거나 네트워크가 복구되면 계정 상태를 레이아웃 로딩 없이 다시 동기화하세요. 인증 API가 401을 반환하면 session을 강제 갱신한 뒤 최초 요청의 body와 멱등키를 그대로 유지해 한 번만 재시도하며, 이 과정에서 활성 풀이의 로컬 답안 상태를 초기화하지 마세요.
- Premium 활성 문제풀이는 별도 화면을 만들지 말고 `src/components/cbt/CbtSolveScreen.tsx`에 서버 상태 adapter를 연결합니다. 문제 카드, 박스형 지문, 선지, OMR, 모바일 OMR, 책갈피, 이동 버튼과 중단·제출 모달은 오프라인 CSV 풀이와 같은 컴포넌트·레이아웃을 유지하세요. Premium 콘텐츠와 풀이 결과에는 CSV 다운로드 버튼이나 export 동작을 제공하지 않습니다. 선지 선택은 로컬 상태에 먼저 반영하고 이전·다음·OMR 이동, 중단·제출 시 떠나는 문항만 서버에 저장합니다. `?`는 현재 문항의 정답·해설만 지연 조회하며 기본 attempt DTO에 전체 정답을 섞지 않습니다.
- Premium 과목 화면은 구매한 문제 세트를 카드로 표시합니다. 카드 본문에는 제목만 표시하고 서버 `description` 통문자열을 UI 메타데이터처럼 파싱하거나 반복 노출하지 마세요. Premium 표시는 `src/components/ui/PremiumBadge.tsx`의 금색 체크 배지만 사용하고 화면별 변형 태그를 만들지 않습니다. 서버의 구조화된 단일 `question_type`으로 OX·5지선다·단답형 태그 하나를 만들고, `혼합형`이나 여러 유형 태그를 만들지 않습니다. 문제 유형, 전체 문항 수와 현재 사용자의 풀이 세션 수는 `ProblemSetCardMetadata`의 같은 높이인 세 칸에 한 줄로 표시합니다. 카드 하단의 중립 회색 `풀이 세션 보기` 링크를 선택하면 해당 문제의 세션 목록으로 이동합니다. 구매나 목록 조회만으로 세션을 자동 생성하지 말고, 빈 목록의 `새로 문제 풀이 시작하기`를 사용자가 누를 때 첫 세션을 생성하세요. 세션은 얇은 카드형 목록으로 회차·첫 풀이/새로 풀기/전체 다시 풀기/오답 풀기/책갈피 풀기·진행 상태·진행도·시간·점수를 표시하고, 재풀이는 원본을 덮어쓰지 않는 새 세션으로 누적합니다.
- Premium 결과·오답 확인·전체 확인은 별도 UI를 만들지 말고 `ResultPage`, `WrongAnswersPage`, `ReviewAllPage`에 서버 session adapter를 연결합니다. 재풀이 제목·풀이 순서·책갈피와 오답 노트도 서버에 보존하세요.
- 로그인 프로필 아바타는 `ProfileAvatar`를 사용합니다. 표시 이름의 첫 글자를 이니셜로 쓰고 이름 해시로 정한 팔레트가 사용자에게 안정적으로 유지되도록 하며 화면마다 임의 색상이나 고정 `LS` 문구를 만들지 마세요.
- 프론트에는 Supabase URL과 publishable key만 둘 수 있습니다. `service_role`/secret key, DB 비밀번호와 Toss secret key는 금지합니다.
- CSV 헤더 호환성은 `src/lib/csv.ts`의 `normalize`, `getValue` 흐름을 기준으로 확장합니다.
- 오프라인 5지선다 정답은 단일 1~5, 쉼표로 나열한 복수정답, 단독 `0`을 허용합니다. 복수정답은 하나만 골라도 맞고, `0`은 미응답까지 항상 정답입니다. `0,1` 같은 혼합 형식은 거부합니다. 정답 파싱은 `normalizeChoiceAnswer`, 채점은 `isCorrectAnswer`와 `isCorrectQuestion`을 재사용하며 문자열 직접 비교를 다시 추가하지 마세요. `hasNoCorrectChoice`로 정답 없음 표시를 구분해 다섯 선지를 모두 정답 선지로 강조하지 않습니다. 결과에서 정답 없음은 정답 수에만 집계하고 오답 확인, 오답 재풀이, 오답 CSV에서 제외합니다. 단답형의 쉼표나 `0`은 기존 정확한 문자열 일치로 처리합니다. 사용자 선택은 여전히 한 개이며 저장 형식은 v4의 문자열을 유지합니다.
- 새 문제 등록은 CSV 파일을 첫 입력으로 배치합니다. 파일 선택 시 확장자를 제거하고 특수문자를 공백으로 바꾼 파일명을 문제 제목으로 제안하며, 선택지 헤더와 정답 값으로 5지선다·OX·단답형을 판별할 수 있을 때만 문제 타입을 자동 변경합니다. 판별 실패 시 사용자의 현재 선택을 유지합니다.
- CSV를 여러 개 선택하면 선택 개수와 자동 제목/유형 안내를 담은 확인 모달을 먼저 표시합니다. 일괄 등록은 파일마다 기존 읽기, 제목 생성, 유형 판별, 파서를 재사용하고 모든 파일 검증 후 `createProblemSets`로 한 번에 반영합니다. 유형을 판별할 수 없거나 오류가 있는 파일이 있으면 해당 파일을 안내하고 아무 문제도 등록하지 않습니다. 판별 불가 파일은 단일 등록에서 유형을 지정하게 안내하세요. 빈 자동 제목은 선택 순서에 따라 `새 문제 1`처럼 부여합니다. 일괄 등록 후에는 현재 과목 문제 목록에 머물며 성공 Toast를 표시하고 풀이 세션을 자동 생성하지 않습니다. 파일명, 제목, 선택 개수를 분석에 보내지 않습니다.
- 문제·보기·선지·해설에 포함된 제한적 HTML은 `src/components/ui/RichTextContent.tsx`로 렌더링합니다. 표·줄바꿈·문단·목록·기본 강조와 셀 병합만 허용하고, 스크립트·외부 콘텐츠·폼·이벤트 속성·임의 스타일은 제거합니다. HTML이 없는 일반 텍스트의 CRLF·LF·Unicode 줄 구분자는 명시적인 줄바꿈 요소로 변환합니다. 문제 본문과 선지는 한국어 문자 간 좌우맞춤을 사용합니다. 표에는 강제 최소 너비나 별도 가로 스크롤을 적용하지 않고 문제 카드 너비에 맞추며, 표 내부 글자는 모바일 12px·데스크톱 13px을 기준으로 합니다. 문제 문자열을 `dangerouslySetInnerHTML`로 직접 주입하지 마세요.
- IndexedDB 또는 localStorage 데이터 구조를 바꿀 때는 기존 사용자 데이터와 마이그레이션 영향을 고려합니다.
- `과목 없음`은 저장되는 subject가 아니라 문제의 `subject_id`가 `null`인 상태입니다. `NO_SUBJECT_ID`는 라우팅/UI용 sentinel로만 사용하세요.
- GA4 이벤트는 페이지 컴포넌트에서 `window.gtag`를 직접 호출하지 말고 `src/lib/analytics.ts`의 `trackEvent`, `trackPageView`를 사용하세요.
- 새 GA4 이벤트나 파라미터를 추가할 때는 `AnalyticsEventMap`에 타입을 먼저 정의하고 README, AGENTS, 개인정보처리방침을 함께 갱신하세요.
- 라우트별 title, description, canonical, robots와 소셜 메타데이터는 페이지 컴포넌트에서 직접 수정하지 말고 `src/lib/seo.ts`와 `src/components/seo/RouteMetadata.tsx`를 사용하세요.
- 공개 라우트를 추가하거나 삭제할 때는 `INDEXABLE_PATHS`, `STATIC_APP_SHELL_PATHS`, sitemap 생성 결과와 README를 함께 갱신하세요. 세션·과목·문항 ID가 포함되는 학습 화면은 색인 대상이나 사이트맵에 넣지 마세요.

## 미니 앱 개발 규칙

- 앱 폴더는 `src/mini-apps/<app-id>/`에 만들고 영문 kebab-case를 사용합니다. 폴더명, manifest `id`, URL slug, 저장 namespace를 일치시키세요.
- 모든 앱은 `manifest.ts`와 앱별 `README.md`에서 시작합니다. README에 목표, MVP, 제외 범위, 데이터 구조, 출시 조건을 구현 전에 기록하세요.
- `/apps` 카드의 이름, 설명, 아이콘, 상태, route는 페이지에 하드코딩하지 말고 앱의 manifest와 `catalog.ts`에서 관리하세요. 카드 설명은 공백과 문장부호를 포함해 40자 이하로 작성합니다.
- 앱 전용 component, lib, store, type은 앱 폴더 안에 둡니다. 두 앱 이상이 실제로 공유하는 UI만 `src/components/ui/`, 도메인과 무관한 순수 유틸만 `src/lib/`로 이동하세요.
- 앱끼리 서로의 내부 파일을 직접 import하지 마세요. 공통 계약이 필요하면 루트 공통 영역에 작은 타입 또는 API를 정의합니다.
- 전역 테마·글꼴은 `useSettingsStore`를 재사용할 수 있지만, 미니 앱이 `useTestStore`의 문제 세션을 직접 수정해서는 안 됩니다. 기존 데이터를 사용할 때는 읽기 전용 selector나 명시적인 공유 API를 먼저 설계하세요.
- 기기 로컬 저장 key는 `law-solver-mini-app:<app-id>:v1`을 사용합니다. 버전 변경 시 migration과 테스트를 추가하고 기존 `law-solver-storage`에 앱 데이터를 섞지 마세요.
- 미니 앱 데이터는 현재 전체 JSON 백업 범위 밖입니다. 백업/복원에 포함하려면 구형 백업 호환성, 손상 데이터 검증, 앱별 migration을 함께 구현하세요.
- 기획 단계에는 `status: "coming-soon"`과 route 없는 manifest를 사용합니다. 출시 시 `App.tsx`에 `/apps/<app-id>`를 등록하고 manifest의 `route` 및 상태를 함께 변경하세요.
- 새 앱 화면도 `app-page`, `app-card`, `app-topbar`, `BrandMark`, `AppFooter`, `ThemeSelect` 등 공통 디자인 시스템과 모바일·다크 모드·키보드 접근성 규칙을 유지하세요.
- `/apps` 미니 앱 목록은 랜딩과 동일한 `LandingHeader`, `LandingFooter`, `landing-page`, `landing-container` 구조를 사용합니다. 별도 GNB를 다시 만들거나 랜딩과 다른 브랜드 내비게이션을 사용하지 마세요.
- 첫 번째 미니 앱은 `src/mini-apps/lbti/`의 `LBTI: 로스쿨생 MBTI 테스트`입니다. 지표·유형은 `data/lbti-framework.json`, 28개 기본 채점 문항·1개 가점 문항·1개 보조 문항은 `data/questions.ko.json`, 제품 범위는 `docs/PRODUCT_PLAN.md`, 작성 기준은 `docs/CONTENT_GUIDE.md`를 단일 원본으로 사용합니다.
- LBTI 소개·테스트·결과·전체 유형 화면과 채점 로직은 모두 `src/mini-apps/lbti/` 안에 둡니다. 결과 공유 URL에는 유형 코드만 사용하고 답변, 축 점수, 진행률이나 내부 ID를 넣지 마세요.
- `src/mini-apps/legal-ethics-17/`은 제17회 법조윤리시험 가답안·해설·40문항 자동채점을 제공하는 단일 페이지 앱입니다. 문항 번호·가답안·쟁점·해설은 `data.ts`를 단일 원본으로 사용하고, 공식 정답 발표 뒤 수정할 때에는 `data.test.ts`의 정답 배열도 함께 갱신하세요. 사용자가 입력한 답안은 저장하거나 분석으로 전송하지 않습니다.
- `src/mini-apps/hoban-course-registration/`은 활성 Premium 회원만 접근할 수 있도록 React 라우트에서 `useAccountStore` 상태를 확인한 뒤 `public/mini-apps/hoban-course-registration/`의 정적 페이지를 전체 화면 iframe으로 실행합니다. 비로그인 또는 Premium 비활성 사용자는 계정 화면으로 안내하는 프론트 모달을 표시하고 `/apps` 카드에는 공통 `PremiumBadge`를 사용합니다. 이 접근 제어는 서버 권한 검증이 아닌 간단한 프론트 진입 제어입니다. `sugang-master`의 기본 화면·이미지·강좌 데이터를 기반으로 하되 프로젝트 전용 중앙 GNB와 10초 챌린지 모드를 제공합니다. 챌린지는 `16:59:50`부터 카운트다운해 `17:00:00`에 로그인을 열고, 정각부터 각 과목 신청 성공까지의 누적 시간을 밀리초 단위로 현재 페이지 메모리에만 기록합니다. 결과에는 분반 포함 전체 과목코드, 담당교수와 마지막 과목 기준 올클리어 시간을 표시합니다.
- 앱 페이지뷰와 행동 이벤트는 `src/lib/analytics.ts`의 정적 허용값으로만 추가합니다. 사용자가 작성한 내용, 학습 기록, 시간·점수·진행률, 앱 내부 ID를 GA4에 보내지 마세요.
- 출시 전 앱별 로직/migration 테스트, `npm test`, `npm run build`, SPA 새로고침을 확인하세요.

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
- `app-toast`, `app-toast-error|success|warning|info`: 문서 흐름과 분리된 상태·오류 토스트 표면
- `app-progress-gradient`: 진행률처럼 제한된 면적의 브랜드 그라디언트

디자인 작업에서는 다음 원칙을 지킵니다.

- 기존 라우트, 레이아웃, 정보 순서, 버튼 위치, 사용자 흐름을 임의로 바꾸지 않습니다.
- `app-button-*`, `app-card` 같은 공통 시각 클래스에는 `position`, `display`, `width`, `height`, `overflow`처럼 배치를 바꾸는 속성을 넣지 않습니다. 위치와 크기는 페이지 컴포넌트의 Tailwind 클래스가 소유하며, 공통 클래스는 색상·테두리·그림자·전환만 담당합니다.
- 대표 CTA와 작은 진행률에만 레드→오렌지 그라디언트를 사용하고, 넓은 문제 본문이나 표 전체에는 사용하지 않습니다.
- 그라디언트 버튼의 기본 `app-button-primary`는 hover 시 배경 레이어만 한 단계 진해지고 위치·크기·글자색·기본 그림자는 유지합니다. 버튼 전체에 `filter`를 적용하면 흰 글자까지 어두워지므로 사용하지 않습니다. 독립 CTA와 페이지 우상단의 대표 관리 CTA에만 `app-button-primary-standalone`을 함께 사용해 상승 효과를 추가합니다. 카드 하단, 풀이 하단, 결과 페이지의 버튼 묶음에는 modifier를 사용하지 않습니다.
- 과목과 과목 이용권 상품은 `BookCover`와 `BookGrid`를 공유하며 표지 높이 224px, 모바일 2열에서 데스크톱 5~6열을 유지합니다. 상품의 금액과 이용 조건, 구매 CTA는 책 표지 아래 `CourseProductCard`의 별도 카드에 표시합니다.
- 문제 카드는 `app-problem-card`의 순백색 표면과 중립 회색 `app-result-link` 이동 영역을 사용합니다. 문제 유형, 문항 수와 세션 수는 `ProblemSetCardMetadata`의 44px 정보 박스 한 줄로 표시하고 오프라인 등록 시각은 하단 이동 영역의 `TimestampTag`에 넣습니다. 문제 아래 풀이 기록은 온라인과 오프라인 모두 `SessionListItem`을 사용합니다. 데스크톱 회차는 56px 정사각형으로 표시하고 통계와 CTA도 높이 56px로 맞춥니다. 위아래 여백은 16px, 제목과 태그 간격은 8px입니다. 회차, 태그 줄, 통계, CTA는 하단을 맞추고 태그가 줄바꿈되어도 유지합니다. 관리 메뉴 버튼은 정원형으로 카드에서는 32px, 목록에서는 데스크톱 28px와 모바일 32px를 사용하고 세로 중앙에 정렬합니다. CTA 폭은 모바일 96px, sm 이상 112px로 통일합니다. 모바일에서도 회차 왼쪽, 제목과 태그 오른쪽의 두 열을 유지합니다. 태그를 회차 아래 전체 폭으로 분리하지 않으며 좁은 화면의 세션 날짜 태그는 연도만 생략합니다. 전체 날짜는 접근성 이름과 툴팁에 보존합니다. 이름 변경과 삭제는 `ActionMenu`에 모으고 하단 버튼 줄을 추가하지 않습니다. 문제 카드에 미색 CTA 표면을 사용하지 않습니다.
- 결과 요약과 문제 세션 카드 안의 진행률·시간·점수 같은 중립 정보 박스는 `app-neutral-box`의 쿨 그레이 표면과 얇은 테두리를 사용합니다. 외부의 미색 페이지 배경과 내부 정보 영역이 섞이지 않도록 `bg-stone-50`만 단독으로 사용하지 않습니다.
- 정답은 emerald, 오답과 선택 상태는 red, 정답 안내는 blue, 책갈피는 amber 의미 색상을 유지합니다.
- 본문과 문제 텍스트는 `word-break: keep-all`을 고려하고, 지나치게 굵은 글자나 좁은 행간을 피합니다.
- 라이트 모드에서는 미색 배경과 따뜻한 흰색 표면을, 다크 모드에서는 갈색 기운이 아주 옅은 짙은 표면을 사용합니다.
- 랜딩의 넓은 강조 패널은 갈색이나 마젠타로 치우치지 않는 브랜드 레드→코럴→오렌지 그라디언트를 사용합니다.
- 모달과 모바일 bottom sheet의 공통 배경 블러는 `app-modal-backdrop`의 2px을 기준으로 하며, 개별 화면에서 더 강한 블러를 중복 적용하지 않습니다.
- 일시적인 성공·오류·경고 안내는 페이지 안에 배너를 삽입하지 말고 `src/components/ui/Toast.tsx`를 사용합니다. Toast는 `document.body` 포털과 `position: fixed`로 렌더링해 메뉴·카드 위치를 바꾸지 않으며, 치명적인 데이터 없음 상태만 기존 전체 화면 empty state로 표시합니다.
- Premium 비동기 화면은 단일 텍스트 로딩 카드나 빈 화면 대신 `AsyncLoading.tsx`, `PremiumLoadingStates.tsx`의 공통 스피너·스켈레톤을 사용합니다. 스켈레톤은 도착 화면의 카드 수와 대략적인 높이를 유지해 레이아웃 이동을 줄이고 `role=status`의 한국어 진행 안내를 제공하세요. 버튼 작업은 기존 너비 안에서 인라인 스피너를 표시하고, 풀이 제출·중단처럼 화면 전체를 잠가야 하는 작업만 고정 오버레이를 사용합니다. `prefers-reduced-motion`과 `app-focus-page`에서는 로딩 애니메이션을 정지합니다.
- 탭 전환처럼 문서 높이가 달라지는 화면에서도 중앙 정렬 UI가 흔들리지 않도록 최상위 `html`의 `scrollbar-gutter: stable`을 유지합니다.
- 디자인 전용 작업에서 Zustand store, IndexedDB/localStorage 스키마, CSV 파서, 채점 로직을 함께 수정하지 않습니다.
- 공통 스타일을 추가할 때 기존 `app-*` 클래스나 UI 컴포넌트를 먼저 확장하고 페이지마다 긴 스타일 문자열을 복제하지 않습니다.
- 테마형 드롭다운은 `src/components/ui/ThemeSelect.tsx`를 사용합니다. 문제 편집, 새 문제 등록, 재풀이 설정 등 앱의 모든 드롭다운은 네이티브 `<select>` 대신 이 컴포넌트를 사용하며, 바깥 클릭, Escape, 방향키, Home/End, Enter/Space 조작을 유지합니다. 화살표는 고정 크기 박스의 중심축에서만 회전하도록 유지합니다.
- 활성 문제 풀이 화면은 `app-focus-page`를 사용합니다. 이 범위에서는 그라디언트, hover 이동·축소, 위치/크기 transition, animation, smooth scroll을 추가하지 않습니다. 기본 CTA는 단색 red-600, hover는 red-700을 사용하며 색상·테두리 전환만 90ms로 짧게 허용합니다.
- 내부 페이지 진입 효과는 `src/app/RouteEntrance.tsx`의 명시적 허용 경로에서 목록의 `app-content-stagger` 직계 항목과 단일 영역의 `app-content-enter`에만 적용합니다. 메인 360ms/12px, 과목 목록 320ms/10px, 문제 목록 280ms/8px, 세션 목록 240ms/6px, 결과 조회 280ms/8px로 아래에서 올라오며 나타납니다. 항목별 시간차는 20ms씩 최대 100ms로 제한합니다. GNB는 즉시 바뀌고 배경, 푸터와 모달도 효과에서 제외합니다. GNB를 포함한 상위 컨테이너에 효과를 붙이지 마세요. 랜딩의 기존 700ms/22px 등장 및 미리보기 120ms 지연은 유지합니다. 실제 풀이와 모든 복기 경로는 제외하며 `prefers-reduced-motion`에서는 끕니다. 애니메이션 완료를 기다리는 이동, JS 타이머, 클릭 잠금을 추가하지 마세요. 종료 후 transform을 남기거나 검색 조건과 앵커 변경으로 재생하지 않습니다.
- 문제풀이·오답 확인·전체 확인·책갈피 확인 화면은 동일한 `app-focus-page` 상단 바 높이와 콘텐츠 시작 간격을 사용합니다. 문제풀이 상단 우측 버튼은 고정 폭이나 균등 분할을 적용하지 않고 텍스트 너비만큼 차지한 상태로 우측 정렬합니다.
- 과목 순서 변경은 브라우저 기본 `draggable` 대신 전용 드래그 손잡이와 Pointer Events를 사용합니다. 카드 본문은 모바일 스크롤을 유지하고, 손잡이에서만 `touch-action: none`과 텍스트 선택 방지를 적용하며 키보드 위·아래 이동도 지원합니다.
- 활성 문제 풀이의 상단 헤더는 타이머·세션명·중단·제출 기능만 유지하는 압축 높이를 사용합니다. 헤더나 바깥 여백을 불필요하게 키워 문제 카드의 세로 영역을 줄이지 않습니다.
- 데스크톱 상단의 `일시 중단`·`제출 및 종료` 버튼 그룹은 OMR 열과 동일한 220px 폭을 사용하고 두 버튼이 그룹 안을 균등하게 채웁니다. 모바일에서는 고정 폭을 해제하고 콘텐츠 너비에 맞춰 축소합니다.
- `제출 및 종료` 시 미응답 문항이 있으면 남은 개수를 표시하는 확인 모달을 먼저 띄웁니다. 미응답이 없으면 바로 제출하고, 확인 모달에서 취소하면 풀이 상태를 유지합니다.
- 데스크톱 풀이 화면에서 문제 카드와 OMR 높이를 서로 독립시킵니다. OX·단답형 OMR은 사용 가능한 시험 화면 높이(`calc(100vh - 112px)`)를 유지합니다. 5지선다 OMR은 문항이 적으면 내용 높이만 사용하고, 문항이 많을 때만 같은 최대 높이에서 목록을 내부 스크롤합니다. 문제 카드는 OX 420px, 단답형 360px, 5지선다 560px을 기본 최소 높이로 사용하되 콘텐츠 분량에 따라 최대 화면 높이까지 늘어나고, 이를 넘으면 문제 본문만 스크롤합니다. 복기 화면의 OMR도 문항 수가 적을 때 그리드 높이에 맞춰 강제로 늘리지 않습니다.
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
sed -n '1,240p' src/app/AppRoutes.tsx
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
- `src/types/test.ts`: IndexedDB에 저장되는 세션 구조와 연결됩니다. 필드 변경 시 기존 저장 데이터 호환성을 검토하세요.
- `src/store/useTestStore.ts`: 문제와 세션 생성, 과목 CRUD, 문제의 과목 연결, 답안 저장, 오답노트, 북마크, 백업/복원 동작의 중심입니다.
- `src/components/cbt/CbtSolveScreen.tsx`: 풀이 UX, 타이머, OMR, 단답형 입력, 정답 보기, 책갈피 기능이 모여 있습니다.
- `src/lib/analytics.ts`: GA4 측정 ID, 이벤트 타입, 운영 도메인 제한, 페이지 경로 정규화가 들어 있습니다. 동적 ID나 학습 성과 데이터가 전송되지 않도록 주의하세요.
- `src/components/analytics/PageViewTracker.tsx`: React Router 경로가 바뀔 때 수동 `page_view`를 전송합니다. 자동 History 페이지뷰와 함께 사용하지 마세요.
- `src/lib/seo.ts`: 공개 색인 경로, 라우트별 title/description, canonical과 비공개 화면의 `noindex` 정책이 들어 있습니다. 공개 URL은 후행 슬래시가 있는 운영 도메인 URL을 canonical로 사용합니다.
- `src/components/seo/RouteMetadata.tsx`: 클라이언트 라우팅 뒤 메타데이터를 갱신합니다. 비공개 화면에는 canonical을 남기지 말고 `noindex`를 유지하세요.
- `src/index.css`: 랜딩 스타일과 앱 공통 `app-*` 디자인 토큰/컴포넌트 클래스가 함께 있습니다. 공통 색상이나 표면을 바꿀 때 라이트·다크 모드를 함께 확인하세요.
- `src/components/ui/BrandMark.tsx`: `public/favicon.svg`를 사용하는 공통 로고입니다. 헤더와 푸터에서 동일한 자산을 유지하세요.
- `src/pages/ResultPage.tsx`: 재풀이, CSV 다운로드, 결과 요약 액션이 많아 회귀 가능성이 큽니다.
- `src/pages/AppHomePage.tsx`: `/home` 서비스 홈입니다. 환경설정, 계정·구독, 온라인 Premium, 오프라인 문제 풀이의 진입점을 제공합니다.
- `src/pages/SettingsPage.tsx`: `/settings` 환경설정 화면입니다. 테마·글꼴과 오프라인 전체 데이터 백업/복원/초기화를 탭으로 관리합니다.
- `src/pages/AccountSubscriptionPage.tsx`, `src/pages/Premium*Page.tsx`: Supabase Auth, 30일 선불 회원권·과목권, 온라인 풀이·결과 흐름입니다. 결제 금액과 학습 권한·채점은 서버 판단을 신뢰하며 프론트에서 재계산하지 마세요.
- `src/pages/SubjectListPage.tsx`: `/dashboard` 오프라인 과목 목록 화면입니다. 과목 관리, 표지 색상 선택, 과목 카드 드래그 순서 변경이 이 페이지에 있습니다. 과목 삭제는 문제와 세션을 유지하고 문제의 `subject_id`를 해제해야 합니다.
- `src/pages/DashboardPage.tsx`: `/dashboard/:subjectId` 과목별 문제 카드 화면입니다. CSV 등록은 문제만 만들며 첫 세션을 자동 생성하지 않습니다. 문제 삭제는 소속 세션도 제거하므로 범위를 확인받아야 합니다. 전체 데이터 백업/복원 UI는 이 페이지에 두지 않습니다.
- `src/mini-apps/catalog.ts`: `/apps`에 노출되는 앱과 순서의 단일 출처입니다. 앱 카드 내용을 `SideAppsPage.tsx`에 다시 하드코딩하지 마세요.
- `src/mini-apps/*/manifest.ts`: 앱 ID, 상태와 출시 route를 관리합니다. `coming-soon` 앱에는 route를 넣지 마세요.
- `public/404.html` 및 `index.html`: GitHub Pages SPA 새로고침 대응 스크립트가 들어 있습니다. 라우팅/배포 변경 시 함께 확인하세요.
- `vite.config.ts`: GitHub Pages 기본 도메인과 커스텀 도메인 운영 방식에 따라 `base` 설정 영향이 큽니다.
- `public/CNAME`: 현재 커스텀 도메인 `lawsolver.haryun.io`가 설정되어 있습니다. 기본 GitHub Pages URL로 운영할 때는 이 파일과 DNS 상태를 확인하세요.

## 환경변수와 시크릿 취급

현재 필수 환경변수는 없습니다.

이 프로젝트의 빌드된 JS는 사용자에게 그대로 전달됩니다. 공개 Supabase URL·publishable key 외의 API 키, 토큰, 개인정보, 서버용 시크릿을 코드나 `.env`에 넣지 마세요. Vite 환경변수에는 클라이언트 공개값만 `VITE_` 접두사로 사용하세요.

GA4 측정 ID `G-DRXS2G7E5F`는 공개 식별자이며 `index.html`과 `src/lib/analytics.ts`에 명시되어 있습니다. 비밀키처럼 `.env`로 숨기지 않으며, 실제 이벤트는 호스트명이 `lawsolver.haryun.io`일 때만 전송합니다.

## Google Analytics 4

GA4는 Google 태그 직접 설치 방식을 사용합니다. `index.html`에서 `send_page_view: false`로 자동 페이지뷰를 끄고 `PageViewTracker`가 다음 유형으로 수동 페이지뷰를 보냅니다.

- `main`: `/`
- `mini_apps`: `/apps`
- `mini_app`: `/apps/mini-app`
- `app_home`: `/home`
- `settings`: `/settings`
- `account`: `/account`
- `premium_dashboard`: `/premium`
- `subject_dashboard`: `/dashboard`
- `problem_dashboard`: `/dashboard/subject`
- `solve`: `/solve`
- `result`: `/result`
- `review`: `/review`

실제 `/dashboard/:subjectId`, `/solve/:sessionId`, `/result/:sessionId`, `/wrong/:sessionId`, `/review/:sessionId` 값과 쿼리 문자열은 GA4에 보내지 않습니다. `/home`, `/settings`, `/account`, `/premium`은 고정된 정규화 경로만 보냅니다. 페이지뷰 설정을 바꿀 때 이 정규화를 유지하세요.

허용된 행동 이벤트는 다음과 같습니다.

- `lbti_result_completed`
- `problem_upload_completed`, `problem_upload_failed`
- `solve_started`, `question_completed`, `solve_paused`, `solve_completed`
- `review_started`, `review_question_viewed`
- `retry_created`

허용된 맞춤 파라미터는 다음 범위로 제한합니다.

- `page_type`
- `lbti_type`: LBTI의 16개 4자 유형 코드
- `question_type`: `ox`, `multiple_choice`, `short_answer`
- `solve_entry`
- `navigation_method`
- `review_type`
- `retry_type`
- `failure_type`

다음 데이터는 이벤트 파라미터, 페이지 URL, 페이지 제목 어느 곳에도 넣지 마세요.

- 문제 본문, 선택지, 해설, 출처, 선택·입력 답안
- 문제 정오 여부, 점수, 진행률, 문항 수, 풀이 시간
- LBTI 질문별 응답, 축별 점수, 진행률, 소요시간
- 과목명, 세션명, CSV 파일명
- subject/session/question ID 또는 이를 유추할 수 있는 값
- IndexedDB와 localStorage의 사용자 데이터 원본

`question_completed`는 답변한 문항을 떠날 때 기록하며 동일한 풀이 방문에서 문항당 한 번만 전송합니다. 답변한 현재 문항은 다른 문항으로 이동하거나 제출·일시 중단할 때 기록합니다. 이 중복 방지 규칙을 유지하세요.

`lbti_result_completed`는 30문항을 모두 완료해 결과를 계산할 때만 전송합니다. 공유 결과 URL 방문이나 전체 유형 탐색은 유형 분포에 포함하지 않으며, `lbti_type` 외에 질문별 응답, 축 점수, 진행률과 소요시간을 보내지 마세요.

GA4 관리 화면의 향상된 측정에서 `브라우저 방문 기록 이벤트에 따른 페이지 변경`은 꺼야 합니다. 활성화하면 수동 페이지뷰와 중복될 수 있습니다. 배포 후 Realtime/DebugView에서 각 이벤트가 한 번만 발생하는지 확인하고, 세부 파라미터를 보고서에서 사용하려면 이벤트 범위 맞춤 측정기준으로 등록합니다.

## Google Search Console과 SEO

Search Console은 도메인 속성 `lawsolver.haryun.io`를 기준으로 사용합니다. `src/lib/seo.ts`가 검색 노출 정책의 단일 출처이며, `RouteMetadata`가 React Router 이동에 맞춰 title, description, canonical, robots, Open Graph와 Twitter 메타데이터를 반영합니다.

색인 대상은 랜딩, 과목 대시보드, 미니 앱 목록, 호반대학교 수강신청 연습, 제17회 법조윤리시험 가답안, LBTI 소개, 전체 유형 목록과 16개 유형별 결과입니다. 서비스 홈, 환경설정, 계정·구독, Premium 대시보드, LBTI 질문 응답, 과목별 문제 대시보드, 풀이·결과·리뷰, 알 수 없는 경로에는 `noindex`를 적용하고 사이트맵에 넣지 않습니다. 동적 학습 ID, 사용자가 입력한 제목이나 문제 내용은 메타데이터, canonical, 소셜 태그와 사이트맵에 넣지 마세요.

`vite.config.ts`의 SEO artifact 플러그인은 빌드 후 다음을 생성합니다.

- `dist/robots.txt`: 전체 크롤링 허용과 사이트맵 위치
- `dist/sitemap.xml`: 색인 대상 정규 URL만 포함
- `dist/apps/**/index.html`: GitHub Pages에서 공개 고정 경로와 LBTI 결과가 직접 요청에도 HTTP 200을 반환하도록 하는 앱 셸
- `public/og-image.png`: Open Graph와 Twitter 공유 카드가 사용하는 넓은 PNG 이미지이며 Vite가 `dist`에 복사

공개 URL canonical은 GitHub Pages 디렉터리 응답과 일치하도록 후행 슬래시를 사용합니다. 새 공개 미니 앱을 출시하면 `getSeoMetadata`, `INDEXABLE_PATHS`, `STATIC_APP_SHELL_PATHS`를 함께 갱신하고 빌드 산출물의 title, canonical, robots 및 HTTP 200 응답을 확인하세요. 배포 후 `robots.txt`와 `sitemap.xml`을 확인하고 Search Console `Sitemaps`에 `sitemap.xml`을 제출합니다.

외부 링크 프리뷰는 `summary_large_image` 카드와 절대 이미지 URL을 사용합니다. 공유 이미지에는 `og:image:secure_url`, 이미지 형식, 실제 크기와 대체 문구를 함께 제공하세요. 제목과 설명 문구에는 중간점, 하이픈, em dash를 사용하지 마세요.

문서 title은 메인에서 `Law Solver`만 사용합니다. 세부 화면은 브랜드명을 앞에 두고 `Law Solver | 대시보드`, `Law Solver | 미니 앱`, `Law Solver | LBTI`, `Law Solver | 문제 풀이`처럼 1뎁스 기능명까지만 표시하세요.

## 배포

GitHub Actions 워크플로우는 `.github/workflows/deploy-pages.yml`입니다.

- 트리거: `main` 브랜치 push, 수동 실행
- 설치: `npm ci`
- 빌드: `npm run build`
- 산출물: `dist`
- 배포 대상: GitHub Pages

SPA 라우트 새로고침은 `public/404.html`과 `index.html`의 redirect restore 스크립트로 처리합니다.

검색에 노출하는 공개 하위 경로는 빌드 시 별도 HTML 앱 셸을 생성하므로 404 fallback에 의존하지 않습니다. Search Console용 `robots.txt`와 `sitemap.xml`도 같은 빌드 단계에서 생성됩니다.

## IndexedDB 마이그레이션과 백업

오프라인 저장과 JSON 백업은 v4를 사용합니다. DB `law-solver-offline`, object store `persisted-state`, key `law-solver-storage`는 유지합니다. 자세한 계약은 [docs/OFFLINE_DATA_MODEL.md](docs/OFFLINE_DATA_MODEL.md)를 먼저 읽으세요.

- `problemSets`: 문제 원본, 소속 과목, 등록과 수정 시각
- `sessions`: 문제 ID, 문항 ID 순서, 답안과 노트와 책갈피, 시간과 결과, 생성과 마지막 풀이와 제출 시각
- `subjects`: 사용자가 만든 과목 목록, 표지 색상, 표시 순서
- `dataUpdatedAt`: 백업 비교용 전체 데이터의 마지막 변경 시각

세션에 원본 문항을 복제하지 마세요. `useOfflineSession`과 `materializeOfflineSession`으로 현재 세션만 화면용 `TestSession`으로 조합합니다. 과목 아래는 문제 카드, 문제 아래는 온라인과 같은 `SessionListItem` 목록을 사용합니다. 새 세션은 사용자 시작 동작에서만 생성하며, 문제 등록만으로 생성하지 않습니다.

기존 배열과 v1부터 v3까지의 세션은 각각 문제 하나와 세션 하나로 이전합니다. 제목이나 본문이 같아도 합치지 않습니다. 기존 세션 ID, 순서, 답안, 노트, 책갈피, 결과와 유효한 과목 연결을 보존합니다. 예전 데이터에 없던 마지막 풀이와 제출 시각은 `null`로 두며 추정하지 않습니다. `sessionSubjectMap`은 이전 시 읽고 v4에는 저장하지 않습니다.

IndexedDB hydration, JSON 복구, 복호화한 클라우드 백업은 `parseDashboardBackup`으로 검증하고 이전합니다. 클라우드에서는 이전 후에도 서버의 개수와 수정 시각을 대조하고 최종 교체 확인을 받습니다. 미래 버전과 손상된 참조를 빈 데이터로 보정하지 마세요.

레거시 localStorage 원본은 IndexedDB transaction commit, readback, hydration, 정규화된 v4 저장 성공 뒤 제거합니다. IndexedDB가 이미 있으면 수정 시각을 비교해 더 최근인 레거시 snapshot을 이전하고, 삭제 직전에도 원본 변경 여부를 확인합니다. 초기화는 빈 v4 snapshot을 저장합니다. hydration 전에는 오프라인 소비 라우트를 렌더링하지 않습니다. 일반 변경은 직렬 저장하고 답안, 책갈피, 제출은 즉시 flush합니다. 복원과 초기화는 영구 저장 성공 뒤 메모리와 UI를 변경합니다. revision 비교로 오래된 탭의 덮어쓰기를 차단하고 충돌 시 새로고침을 안내합니다. 유효한 레거시 원본 없이 IndexedDB가 실패하면 빈 localStorage로 전환하지 않습니다.

v4 문항 수는 문제 원본의 합이며 세션 수와 구분합니다. 서버는 암호문을 보관하므로 내부 JSON v4를 위한 별도 API 변경은 없습니다. 하향 이전은 제공하지 않으므로 구형 앱으로 v4를 읽거나 저장하지 마세요.

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
- IndexedDB/localStorage 데이터 구조 변경 여부
- 배포 설정 변경 여부

## 작업 원칙

- 문서 작업은 실제 파일과 설정을 읽은 뒤 반영합니다.
- 큰 리팩터링은 문서 정리 작업과 섞지 않습니다.
- README와 샘플 CSV의 설명이 실제 파서 동작과 맞는지 확인합니다.
- 브라우저 저장소 의존 기능은 백업/복원 UX와 데이터 손실 가능성을 함께 고려합니다.
- GitHub Pages 관련 수정은 커스텀 도메인과 프로젝트 경로 배포의 차이를 명확히 확인한 뒤 진행합니다.

## 유지보수 기준 문서

- 전체 구조는 `docs/ARCHITECTURE.md`, 디자인 구현은 `docs/DESIGN_SYSTEM.md`, 작업 절차는 `docs/MAINTENANCE.md`에서 관리합니다. `GEMINI.md`는 이 문서를 가리키며 별도 규칙을 복제하지 않습니다.
- 새 오프라인 데이터 사용 화면은 `AppRoutes.tsx`에서 `OfflineDataHydrationGate`를 적용합니다. 계정과 온라인 화면을 오프라인 저장소 초기화에 의존시키지 마세요.
- 온라인 조회는 `usePremiumResource`의 key와 안정적인 `useCallback` 조회 함수를 사용해 이전 응답을 무시하고 오류와 빈 상태를 구분합니다. 실패 화면에는 재시도 동작을 제공합니다.
- Premium 답안과 책갈피는 서버 저장 성공 전까지 미저장 상태를 유지합니다. 저장 실패 시 화면의 답안을 지우거나 중단과 제출을 계속 진행하지 않습니다.
- `npm run verify`가 테스트와 빌드의 공통 진입점입니다. 프론트 CI와 Pages 배포에서 같은 검증을 실행합니다.
- 새 한국어 문구에는 중간점, em dash, 말줄임표, 상투적인 대비 표현을 사용하지 않습니다. 현재 제공하는 기능과 사용자가 할 일을 구체적으로 설명합니다.
