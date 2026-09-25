# Mini Apps

`src/mini-apps/`는 Law Solver 안에서 독립적으로 실행되는 작은 학습 도구의 기능 경계입니다. 미니 앱 목록 UI는 `catalog.ts`를 읽으며, 각 앱의 구현과 문서는 해당 앱 폴더가 소유합니다.

첫 번째 미니 앱은 `lbti/`의 **LBTI: 로스쿨생 MBTI 테스트**입니다. 네 지표, 16개 유형, 30개 문항과 유형별 결과 화면을 제공합니다.

`legal-ethics-17/`은 **제17회 법조윤리시험 가답안**을 표와 문항별 핵심 해설로 제공하는 읽기 전용 단일 페이지 앱입니다.

`hoban-course-registration/`은 **호반대학교 수강신청 연습** 화면에서 강좌번호·자동입력방지 문자 조회와 최대 21학점 신청·삭제를 연습하는 브라우저 메모리 기반 미니 앱입니다.

## 기본 구조

```txt
src/mini-apps/
├── catalog.ts                 # /apps 목록에 노출할 앱과 순서
├── types.ts                   # 공통 manifest 타입
└── app-id/
    ├── manifest.ts            # 이름, 설명, 상태, 아이콘, 출시 경로
    ├── README.md              # 목표, MVP, 데이터와 출시 조건
    ├── AppPage.tsx            # 출시할 때 추가하는 라우트 화면
    ├── components/            # 이 앱에서만 쓰는 UI
    ├── lib/                   # 이 앱의 순수 도메인 로직
    ├── store/                 # 필요한 경우에만 앱 전용 Zustand store
    └── *.test.ts              # 로직과 마이그레이션 테스트
```

앱 폴더는 영문 kebab-case의 안정적인 ID를 사용합니다. 폴더명, manifest의 `id`, URL slug, 저장소 namespace를 동일하게 맞춥니다.

## 새 앱 추가 순서

1. `src/mini-apps/<app-id>/`를 만들고 `README.md`에 문제, 대상 사용자, MVP, 제외 범위, 데이터 구조를 먼저 적습니다.
2. `manifest.ts`를 만들고 `MiniAppDefinition`을 `satisfies`로 검증합니다. `/apps` 카드에 표시되는 `description`은 공백과 문장부호를 포함해 40자 이하로 작성합니다.
3. `catalog.ts`에 manifest를 추가합니다. 기획 단계에서는 `coming-soon`으로 두고 `route`는 설정하지 않습니다.
4. 구현 파일은 앱 폴더 안에 둡니다. 두 앱 이상에서 재사용되는 UI만 `src/components/ui/`, 도메인과 무관한 순수 유틸만 `src/lib/`로 올립니다.
5. 출시할 때 `AppPage.tsx`와 `/apps/<app-id>` 라우트를 추가하고 manifest에 `route`와 출시 상태를 설정합니다.
6. 페이지뷰나 행동 이벤트를 추가하면 `src/lib/analytics.ts`에서 허용값을 타입으로 제한하고 루트 `README.md`, `AGENTS.md`, 개인정보처리방침을 함께 갱신합니다.
7. `npm test`와 `npm run build`를 실행합니다.

## 앱 경계 규칙

- 미니 앱은 `useTestStore`의 문제 세션을 직접 수정하지 않습니다. 기존 문제 데이터가 필요하면 읽기 전용 selector 또는 명시적인 공유 API를 먼저 설계합니다.
- 전역 테마와 글꼴은 `useSettingsStore`를 재사용할 수 있습니다.
- 기기 로컬 데이터는 `law-solver-mini-app:<app-id>:v1` 키를 사용합니다. 버전을 올릴 때 migration과 테스트를 함께 추가합니다.
- 미니 앱 데이터는 현재 Law Solver JSON 백업에 자동 포함되지 않습니다. 백업 범위를 넓히려면 기존/신형 백업 호환성과 복원 검증을 함께 설계합니다.
- 앱끼리 서로의 store, component, 내부 lib를 직접 import하지 않습니다. 공용화가 필요하면 의존 방향을 검토한 뒤 루트 공통 영역으로 이동합니다.
- 사용자 입력, 학습 기록, 앱 내부 ID를 URL이나 GA4에 보내지 않습니다.
- 모든 manifest의 `description` 40자 제한은 `catalog.test.ts`에서 함께 검증합니다.
- 서버와 비밀키가 없는 현재 구조를 유지합니다. 브라우저에 공개되면 안 되는 값은 미니 앱 코드에 넣지 않습니다.
- `/apps` 목록은 랜딩과 동일한 `LandingHeader`, `LandingFooter`, `landing-page`, `landing-container`를 사용합니다. 개별 앱 화면도 기존 디자인 시스템과 접근성 규칙을 따릅니다.

## 상태 의미

- `coming-soon`: 목록에 소개만 하며 링크를 제공하지 않습니다.
- `beta`: 경로를 연결할 수 있지만 시험 기능임을 화면에 표시합니다.
- `available`: 일반 사용 가능한 상태입니다.

상태만 바꾸어 출시하지 말고, route 등록, 새로고침 동작, 모바일/다크 모드, 데이터 마이그레이션, 분석 문서를 함께 확인합니다.

## 헤더와 화면 배치

- `/`와 `/apps`만 `LandingHeader`의 스크롤 플로팅 GNB를 사용합니다. 개별 미니 앱에서 `landing-nav-wrap`, `landing-nav-surface`, `landing-nav-inner`, `landing-nav-placeholder`를 직접 조합하거나 일부만 가져오지 마세요. 이 클래스는 고정 위치, 클릭 처리, 배경과 자리 보존이 한 세트인 랜딩 내부 구현입니다.
- 일반 미니 앱은 `src/components/ui/MiniAppHeader.tsx`의 `MiniAppHeader`를 사용합니다. `title`, `label`을 지정하고 앱 제목을 홈 링크로 만들 때만 `titleTo`를 제공합니다. 앱 전용 메뉴는 children으로 전달합니다. 브랜드, 테마 전환, `/apps`로 나가기는 공통 컴포넌트가 담당합니다.
- `MiniAppHeader`는 문서 흐름에 높이를 확보하는 sticky 헤더입니다. 별도 placeholder나 본문의 수동 top 여백을 추가하지 말고, 상위 레이아웃에 스크롤을 가로채는 `overflow: hidden/auto`를 넣지 마세요. 기본 부모는 `app-page flex min-h-screen flex-col`을 사용합니다.
- 640px 미만은 브랜드와 앱 제목을 첫 줄, 액션을 둘째 줄에 표시합니다. 그 이상은 한 줄로 표시하며 긴 앱 제목만 말줄임표로 처리합니다. 브랜드와 나가기 버튼은 축소하거나 숨기지 않습니다. 상단 기기 안전 영역은 헤더가 담당합니다.
- 헤더 아래에서 이동하는 앵커 대상에는 `mini-app-anchor`를 적용합니다. 모바일은 144px, 640px 이상은 96px에 기기의 상단 안전 영역을 더해 제목이 헤더에 가려지지 않도록 합니다.
- 수강신청 연습처럼 전체 화면 iframe을 사용하는 앱은 자체 헤더를 유지합니다. 외부 React 헤더를 중복 추가하지 않습니다.
- 디자인 시스템 예시는 저장된 설정을 바꾸지 않는 `MiniAppHeaderView`에 페이지 메모리의 버튼 상태와 콜백을 전달합니다. 테마 버튼의 아이콘과 접근성 이름만 전환하고 실제 색상은 현재 앱 테마를 따릅니다.

헤더 변경 시 `/apps`, LBTI의 소개/테스트/유형/결과, 법조윤리 가답안과 전체 화면 iframe의 경계를 점검합니다. 320px, 640px, 데스크톱에서 본문 겹침, 메뉴 클릭, 스크롤 추적, 앵커 이동, 라이트/다크 모드를 확인합니다.
