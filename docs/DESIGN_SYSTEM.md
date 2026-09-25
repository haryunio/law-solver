# Law Solver 디자인 시스템

이 문서는 프론트 화면을 만들거나 고칠 때 확인하는 구현 기준입니다. 화면별 정보 순서와 학습 흐름은 유지하면서 색상, 상태 표현, 공통 동작을 재사용합니다. 프로젝트 전체 규칙은 [AGENTS.md](../AGENTS.md), 진입점과 주요 기능은 [README.md](../README.md)를 함께 읽으세요.

## 1. 파일과 책임

| 위치 | 책임 |
| --- | --- |
| `src/index.css` | 라이트와 다크 토큰, 공통 `app-*` 시각 클래스, 랜딩 전용 장식, 접근성 관련 모션 규칙 |
| `src/components/ui/` | 도메인과 무관하게 재사용하는 버튼, 대화상자, 헤더, 푸터, 입력과 상태 UI |
| `src/components/landing/` | 랜딩 기능 카드, CSV 가이드, 장식용 풀이 미리보기 |
| `src/components/cbt/CbtSolveScreen.tsx` | 오프라인과 온라인이 공유하는 실제 문제 풀이 화면 |
| `src/components/premium/PremiumLoadingStates.tsx` | 온라인 화면의 실제 배치를 따르는 로딩 스켈레톤 |
| `src/pages/` | 화면의 폭, 그리드, 카드 배치, 여백과 반응형 구성 |
| `src/pages/DesignSystemPage.tsx` | `/debug/designsystem`에서 실제 공통 컴포넌트와 상호작용을 확인하는 페이지 |
| `src/mini-apps/<app-id>/` | 해당 미니 앱만 사용하는 화면과 기능 |

공통 CSS는 색상, 테두리, 그림자, 전환을 담당합니다. 카드의 `display`, `position`, `width`, `height`, `overflow`는 호출하는 컴포넌트의 Tailwind 클래스에 둡니다. `app-page`, `app-spinner`처럼 이름 자체가 화면이나 특정 형태를 뜻하는 기존 클래스에는 그 형태에 필요한 규칙이 들어 있습니다. 이 예외를 일반 카드나 버튼 시각 클래스에 확대하지 않습니다.

두 화면 이상이 같은 행동과 접근성 동작을 사용하면 공통 컴포넌트로 묶습니다. 겉모양만 비슷한 도메인 로직을 하나의 큰 컴포넌트로 합치지 않습니다. 미니 앱은 서로의 내부 파일을 가져오지 않습니다.

글꼴은 환경설정에서 Pretendard, Noto Sans KR, 나눔고딕, 나눔명조를 선택합니다. 기본은 Pretendard이며 선택은 `law-solver-settings`에 저장됩니다. Noto Sans KR은 Google Fonts의 가변 글꼴(100~900)을 `display=swap`으로 불러옵니다. 새 글꼴을 추가할 때는 `FontFamily`, 설정 목록, `ThemeWatcher`의 클래스 제거 목록, Tailwind 글꼴 설정과 `index.html`의 폰트 로딩을 함께 갱신합니다.

## 2. 색상과 표면 토큰

토큰의 원본은 `src/index.css`의 `:root`와 `html.dark`입니다. 다크 모드는 같은 토큰의 값을 바꾸며, 토큰을 사용하는 곳마다 다크 색상을 반복하지 않습니다.

| 토큰 | 용도 |
| --- | --- |
| `--app-bg`, `--app-bg-soft` | 화면의 미색 배경과 보조 배경 |
| `--app-surface`, `--app-surface-solid` | 일반 카드와 불투명 입력/모달 표면 |
| `--app-surface-muted` | 카드 안의 보조 설명 영역 |
| `--app-surface-problem` | 문제 카드와 세션 목록의 순백색 표면 |
| `--app-surface-neutral`, `--app-border-neutral` | 진행률, 시간, 점수 같은 중립 정보 상자 |
| `--app-surface-landing` | 랜딩 단계 카드와 기능 카드의 공통 표면 |
| `--app-border`, `--app-border-strong` | 카드 경계와 입력 요소 경계 |
| `--app-text`, `--app-muted` | 기본 글자와 보조 글자 |
| `--app-red`, `--app-red-dark`, `--app-orange` | 브랜드 강조 |
| `--app-primary-gradient` | 대표 버튼에 사용하는 레드에서 오렌지로 이어지는 그라디언트 |
| `--app-emphasis-gradient` | 랜딩의 넓은 강조 패널에 사용하는 레드, 코럴, 오렌지 그라디언트 |
| `--app-focus-color`, `--app-focus-hover` | 정적인 단색 행동의 기본과 hover 색상 |
| `--app-ring` | 입력 포커스 링 |
| `--app-shadow`, `--app-shadow-hover` | 일반 카드의 기본과 hover 그림자 |
| `--app-modal-overlay`, `--app-modal-shadow` | 대화상자 배경과 그림자 |

정답은 emerald, 오답과 선택 상태는 red, 정답 안내는 blue, 책갈피는 amber를 유지합니다. Premium은 `PremiumBadge`의 금색 체크 배지를 사용합니다. 일반 상태를 Premium과 비슷한 금색 태그로 표시하지 않습니다.

곡률은 GNB의 외곽을 기준으로 세 단계로 정리합니다.

| 토큰 | 값 | 적용 대상 |
| --- | --- | --- |
| `--app-radius-card` | 16px | GNB, 카드, 세션 행, 모달, 토스트 |
| `--app-radius-control` | 12px | 버튼, 입력, 드롭다운 트리거 |
| `--app-radius-inset` | 12px | 회차, 통계, 내부 정보 박스, 메뉴 표면 |
| `--app-radius-tag` | 8px | 유형, 상태, 날짜 태그, 메뉴 항목 |
| `--app-radius-circle` | 9999px | 원형 메뉴와 아바타의 기준. 기존 원형 유틸 유지 |

`src/app/standardUi.ts`가 지정한 일반 탐색 경로에만 `StandardUiScope`가 적용됩니다. 랜딩, 홈, 과목/문제/세션 목록, 계정, 설정, 미니 앱 목록, 디자인 시스템 페이지가 대상입니다. 실제 풀이, 결과, 모든 복기와 개별 미니 앱에는 적용하지 않습니다. 기존 Tailwind 곡률은 제외 화면의 호환값으로 남기고 일반 화면에서만 공통 CSS가 덮어씁니다. `Dialog`와 `Toast`는 React context로 포털에 같은 범위를 전달합니다.

`app-card`, `app-modal-surface`, `app-neutral-box`, `app-subtle-surface`, `app-button-*`, `app-control`, `app-select-*`는 역할에 맞는 곡률을 자동 적용합니다. 개별 표면에는 `app-radius-card`, `app-radius-control`, `app-radius-inset`, `app-radius-tag`를 사용합니다. 하단 CTA는 `app-result-link` 또는 `app-radius-card-bottom`으로 아래쪽 모서리만 16px을 적용합니다. 원형 메뉴와 아바타, 스위치, 작은 상태점은 원형을 유지합니다. 책은 `app-radius-book`으로 왼쪽 6px과 오른쪽 16px을 사용하고, 라벨의 오른쪽 아래만 `app-radius-book-label`로 12px을 적용해 책등 형태를 유지합니다.

## 3. 공통 클래스 선택

| 클래스 | 적용할 곳 |
| --- | --- |
| `app-page` | 랜딩을 제외한 일반 화면의 가장 바깥 영역 |
| `app-card` | 주요 콘텐츠 카드와 OMR 패널 |
| `app-problem-card` | 문제 카드와 세션 목록의 표면 보정. 필요하면 `app-card`와 함께 사용 |
| `app-subtle-surface` | 카드 안의 보조 설명이나 설정 묶음 |
| `app-neutral-box` | 결과 지표, 진행률, 시간, 점수 |
| `app-topbar` | 풀이와 복기 화면의 상단 바 |
| `app-control` | input과 textarea의 공통 표면과 포커스 |
| `app-result-link` | 문제 카드 하단의 세션 목록 이동 영역 |
| `app-modal-backdrop`, `app-modal-surface` | 대화상자와 모바일 bottom sheet |
| `app-progress-gradient` | 작은 진행률 영역 |
| `app-focus-page` | 학습 화면의 단색 CTA와 정적인 상호작용 범위 |

기존 화면과의 호환을 위해 `src/index.css`에 `.app-page .bg-white` 등 Tailwind 표면을 토큰으로 맞추는 규칙이 남아 있습니다. 새 화면에서 이 암묵적 보정에 의존하지 말고 표의 클래스 중 용도가 맞는 것을 직접 지정하세요. 이 호환 규칙을 제거할 때는 영향을 받는 기존 화면을 먼저 명시적 클래스로 옮긴 후 라이트와 다크 화면을 확인해야 합니다.

## 4. 버튼

일반 폼과 대화상자 행동은 `src/components/ui/Button.tsx`를 사용합니다.

```tsx
<Button onClick={onCancel}>취소</Button>
<Button
  variant="primary"
  pending={saving}
  pendingLabel="저장하는 중"
  onClick={save}
>
  저장하기
</Button>
```

| 속성 | 기본값과 동작 |
| --- | --- |
| `variant` | `secondary`. `primary`, `danger`, `success`도 지원 |
| `size` | `md`. 좁은 상품 카드에는 `sm`을 지정해 패딩과 글자 크기를 함께 조정 |
| `type` | `button`. 폼 제출 버튼은 `type="submit"`을 직접 지정 |
| `pending` | `false`. 진행 중에는 클릭을 막고 `aria-busy`와 인라인 스피너 표시 |
| `pendingLabel` | `처리 중`. 사용자가 기다리는 작업을 구체적으로 적기 |
| `className` | 화면에서 정하는 너비, 배치, 추가 여백 |
| 기타 props | 표준 HTML 버튼 속성과 ref 전달 |

기본 크기는 `rounded-lg px-4 py-2.5 text-sm font-semibold`입니다. 페이지 이동에는 React Router `Link`를 유지합니다. 링크를 버튼으로 감싸거나 버튼 안에 링크를 넣지 않습니다. 링크와 기존 특수 크기 버튼에는 다음 공통 시각 클래스를 사용할 수 있습니다.

| 클래스 | 용도 |
| --- | --- |
| `app-button-primary` | 대표 행동. hover에서 배경만 한 단계 진하게 표시 |
| `app-button-primary-standalone` | 독립 CTA나 페이지 우상단 대표 관리 CTA의 제한적인 상승 효과 |
| `app-button-secondary` | 중립 보조 행동 |
| `app-button-danger` | 삭제나 제출 확인처럼 주의가 필요한 단색 red 행동 |
| `app-button-success` | 성공 의미가 필요한 단색 emerald 행동 |

버튼 묶음, 카드 하단, 풀이 하단, 결과 페이지에는 standalone modifier를 추가하지 않습니다. `app-focus-page`에서는 primary 버튼이 단색 red로 바뀌고 이동 효과가 없어집니다. disabled 버튼에 hover 효과를 새로 추가하지 않습니다.

## 5. 대화상자

일반 중앙 대화상자는 `src/components/ui/Dialog.tsx`를 사용합니다. 열린 동안만 컴포넌트를 마운트합니다. 제목과 본문, 버튼의 배치는 호출하는 화면이 구성합니다.

```tsx
const titleId = useId();

{open ? (
  <Dialog
    labelledBy={titleId}
    onClose={saving ? undefined : close}
    surfaceClassName="max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto rounded-2xl border p-6"
  >
    <h2 id={titleId}>문제 제목 수정</h2>
    {/* 입력과 행동 버튼 */}
  </Dialog>
) : null}
```

`Dialog`가 담당하는 동작은 다음과 같습니다.

- `document.body`에 포털을 만들어 카드의 overflow와 stacking context 영향을 피합니다.
- `role="dialog"`, `aria-modal`과 제목/설명 연결을 제공합니다.
- 열린 뒤 첫 번째 활성 입력 요소로 포커스를 옮기고 Tab과 Shift+Tab을 대화상자 안에서 순환시킵니다. 입력 요소가 없으면 패널에 포커스를 둡니다.
- 외부로 이동한 포커스를 현재 대화상자로 되돌립니다.
- 가장 위의 대화상자에서만 Escape를 처리합니다. `onClose`를 생략하면 Escape와 바깥 영역 클릭으로 닫히지 않습니다.
- 열린 대화상자가 남아 있는 동안 배경 스크롤을 잠급니다. 마지막 대화상자가 닫히면 원래 overflow 값으로 복원합니다.
- 닫힌 뒤 여전히 존재하는 원래 요소로 포커스를 돌려줍니다. 중첩된 경우 아래 대화상자의 포커스와 스크롤 잠금을 유지합니다.
- 원래 렌더 위치가 `app-focus-page` 안에 있으면 포털에도 그 범위를 적용합니다.

`labelledBy`는 필수입니다. 같은 화면에 여러 인스턴스가 생길 수 있으면 `useId()`를 사용하세요. `describedBy`는 짧은 설명 문단의 ID를 연결할 때 사용합니다. `surfaceClassName`을 지정하면 패널의 최대 폭, 최대 높이와 내부 스크롤도 함께 정합니다. 바깥 레이어의 기본 우선순위는 `z-[100]`이며 `className`으로 조정할 수 있습니다.

현재 `ConfirmDialog`, `LegalDocumentModal`, `CsvGuideDialog`가 이 기반을 사용합니다. 단순 확인은 `ConfirmDialog`를 먼저 선택하고, 약관 문서는 `LegalDocumentModal`을 사용합니다. `ConfirmDialog`에서 취소가 있는 작업은 `onCancel`을 반드시 전달하세요. 취소가 없는 단순 안내는 기존 계약대로 닫기와 확인이 같은 `onConfirm`을 호출합니다. 저장 중에는 `pending`을 전달해 확인과 닫기를 모두 잠급니다.

기존 bottom sheet와 복합 입력 모달에는 화면 전용 구조도 남아 있습니다. 수정할 때 공통 `Dialog`로 옮길 수 있지만, 파일 업로드나 암호화 백업처럼 작업 중 닫기를 막거나 메모리를 지워야 하는 동작까지 자동으로 대체하지 않습니다. 각 화면의 완료, 실패, 취소 경로를 먼저 확인하세요.

## 6. 기존 공통 컴포넌트

| 컴포넌트 | 사용 기준 |
| --- | --- |
| `BrandMark` | 브랜드 이미지. 화면마다 로고를 다시 만들지 않음 |
| `DashboardHeaderTitle` | 과목, 문제 대시보드와 결과 화면 GNB |
| `LandingHeader`, `LandingFooter` | 랜딩과 `/apps`의 공통 내비게이션 |
| `MiniAppHeader`, `MiniAppHeaderView` | 개별 미니 앱의 sticky GNB와 설정을 변경하지 않는 갤러리 예시 |
| `AppFooter` | 앱 내부 화면 푸터 |
| `ThemeSelect` | 앱의 모든 드롭다운. 네이티브 select로 교체하지 않음 |
| `ProfileAvatar` | 이름 이니셜과 이름 해시 기반의 안정적인 팔레트 |
| `PremiumBadge` | Premium의 공통 금색 체크 표시 |
| `IconCloseButton` | 접근 가능한 이름과 동일한 모양의 닫기 버튼 |
| `RichTextContent` | 문제와 해설의 제한적 HTML 및 일반 텍스트 줄바꿈 |
| `Toast` | 일시적인 성공, 오류, 경고, 안내 |
| `AsyncLoading`의 컴포넌트 | 스피너, 버튼 진행 상태, 화면 작업 오버레이 |
| `BookCover`, `BookGrid` | 오프라인 과목, 온라인 과목, 구매 상품의 책 표지와 반응형 책장 |
| `SubjectBookCard` | 과목 이동 링크와 오프라인 과목 통계를 BookCover에 연결 |
| `CourseProductCard` | 책 표지 아래 별도 가격, 이용 조건, 구매 CTA 영역 |
| `SessionListItem` | 온라인과 오프라인의 얇은 풀이 세션 목록과 우측 CTA |
| `ProblemSetCardMetadata` | 문제 유형, 문항 수, 세션 수를 동일한 높이의 세 칸에 표시 |
| `TimestampTag` | 등록, 생성, 마지막 풀이 시각을 공통 날짜 형식으로 표시 |
| `ActionMenu` | 문제와 세션의 편집, 이름 변경, 삭제 메뉴 및 키보드 이동 |

`ThemeSelect`를 사용할 때 바깥 클릭, Escape, 방향키, Home/End, Enter/Space 동작을 유지합니다. `RichTextContent`를 통하지 않고 문제 문자열을 HTML로 주입하지 않습니다. HTML 표는 카드 폭에 맞추고 셀 안의 글자는 모바일 12px, 데스크톱 13px을 기준으로 유지합니다.

## 7. 레이아웃과 모션

대시보드 GNB는 모바일에서 액션을 2열 전체 너비로 표시하고 `sm` 이상에서는 텍스트 폭의 버튼을 우측 정렬합니다. `md`(768px) 이상에서는 제목과 액션을 한 줄에 표시합니다. 액션은 줄바꿈하거나 줄어들지 않고, 남은 너비 안에서 긴 제목에 말줄임표를 적용하며 전체 제목은 title 속성에 보존합니다. `md` 미만에서는 제목 축소와 액션의 하단 배치를 함께 적용합니다. 두 줄인 `sm` 구간은 가로 구분선 위아래에 카드 패딩만큼 여백을 두고, `md`부터 구분선과 추가 여백을 없앱니다. 갤러리의 상단 내비게이션 예시에서 제목을 바꾸고 화면 폭을 조절해 확인할 수 있습니다.

과목 목록과 과목 이용권 상품은 `BookCover`와 `BookGrid`를 공유합니다. 모바일 2열에서 시작해 `sm` 3열, `md` 4열, `lg` 5열, `xl` 6열로 늘리며 표지 높이는 224px로 유지합니다. 표지의 상단과 책등에는 팔레트 그라데이션을 남기고 제목과 통계는 단색 표면에 표시합니다. 긴 제목은 3줄까지, 하단 정보가 많은 온라인 과목은 2줄까지 표시하며 전체 제목은 title 속성으로 보존합니다. 표지 컴포넌트는 이동을 직접 수행하지 않고 호출부가 링크나 관리 동작을 연결합니다.

오프라인 `SubjectBookCard`의 전체 개수는 등록된 문제 수입니다. 풀이 중과 채점 완료는 그 문제들에 속한 세션 수입니다. 과목 관리의 드래그 손잡이, 키보드 이동과 모바일 스크롤은 기존 동작을 유지합니다. 온라인 과목도 같은 높이와 열 배치를 사용하며 공통 Premium 배지와 서버가 제공한 이용 기한을 표시합니다. 로딩 스켈레톤도 이 책장 배치를 따릅니다.

상품은 `CourseProductCard`로 책 표지와 하단 구매 영역을 구분합니다. 하단의 별도 카드에 금액, 이용 기간, 풀이 횟수와 구매 CTA를 모읍니다. 구매 가능 여부와 결제 처리는 계정 페이지가 소유하고 이 컴포넌트는 전달받은 상태만 표시합니다. 결제 수단 선택은 기존 `PurchaseMethodModal`을 사용합니다.

과목 안의 문제는 `app-card app-problem-card` 카드로 표시합니다. 제목 아래 16px 간격을 두고 `ProblemSetCardMetadata`가 유형, 문항 수, 세션 수를 한 줄에 배치합니다. 세 정보 박스는 높이 44px, 유형 태그는 높이 24px이며 모든 내용을 세로 중앙에 정렬합니다. 각 박스의 이름은 왼쪽, 유형 태그와 개수는 오른쪽에 맞춥니다. 유형과 문항 박스는 내용이 들어갈 최소 너비를 확보하고, 진행 중 개수가 들어가는 세션 박스에 더 넓은 폭을 배분합니다. 하단의 중립 회색 이동 영역은 최소 48px로 유지하고 CTA를 오른쪽에 둡니다. 오프라인 등록 시각은 이 영역의 왼쪽에 `TimestampTag`로 표시하며, 좁은 화면에서는 자연스럽게 줄을 나눕니다. 카드 위에 등록한 문제 수나 전체 문항 수를 별도 문장으로 반복하지 않습니다.

`ProblemSetCardMetadata`는 전체 세션 수 옆에 `(2 풀이 중)`처럼 완료되지 않은 세션 수를 회색으로 표시합니다. 오프라인은 `in-progress`, 온라인은 `in_progress`와 `paused`를 포함합니다. 온라인은 세션이 있는 문제의 기존 세션 요약 API로 전체 수와 진행 중 수를 함께 집계하며 답안이나 문제 본문은 조회하지 않습니다. 문제 카드, 스켈레톤, 갤러리는 1024px 이상에서 2열, 그 아래에서 1열을 사용합니다. 카드 열 수는 GNB 전환 기준과 별도로 유지합니다. 과목 책장의 열 수는 별도 기준을 유지합니다.

세션은 온라인과 오프라인 모두 `SessionListItem`을 사용합니다. 데스크톱에서 회차 박스는 56px 정사각형으로 표시하며 진행도, 시간, 점수와 CTA도 높이 56px로 맞춥니다. 회차, 태그 줄, 통계와 CTA의 하단을 같은 수평선에 맞춥니다. 태그가 여러 줄로 늘어도 이 하단 정렬을 유지하며 원형 메뉴는 통계와 CTA의 세로 중앙에 맞춥니다. 바깥 위아래 여백은 16px이며 기본 행 높이는 테두리를 포함해 90px입니다. 긴 태그가 줄을 바꾸면 콘텐츠에 맞춰 행이 늘어납니다. CTA 폭은 모바일 96px, `sm` 이상 112px로 고정해 완료 상태나 버튼 문구가 바뀌어도 통계 열이 움직이지 않게 합니다. 회차 오른쪽에는 제목과 풀이 방식, 상태, 순서 태그를 표시하며 제목과 태그 사이에 8px 간격을 둡니다. 태그 높이는 날짜를 포함해 24px입니다. 모든 화면 너비에서 왼쪽 회차와 오른쪽 제목/태그의 두 열을 유지합니다. 태그는 제목 아래 같은 열 안에서만 줄바꿈하며 회차 아래 전체 폭으로 분리하지 않습니다. `lg` 미만에서는 통계와 CTA만 다음 줄로 내려갑니다. 모바일 회차는 제목과 태그 묶음의 세로 중앙에, 관리 메뉴는 제목 줄의 중앙에 배치합니다. 관리 메뉴는 정원형 버튼입니다. 목록에서는 데스크톱 28px, 모바일 32px 크기로 세로 중앙에 맞추고 문제 카드에서는 32px 크기를 사용합니다. 로딩 스켈레톤도 같은 배치를 따릅니다.

`TimestampTag`는 브라우저의 현지 시각을 `YYYY.MM.DD HH:mm` 형식으로 표시합니다. 세션에서는 마지막 풀이 시각을 우선 표시하고 기록이 없으면 생성 시각을 표시합니다. 세션 날짜에만 `hideYearOnSmallScreens`를 적용해 `sm` 미만에서는 연도를 숨기고 `MM.DD HH:mm`으로 표시합니다. 전체 날짜는 `time`의 접근성 이름과 툴팁에 남깁니다. 문제 카드의 등록 날짜는 기존 전체 형식을 유지합니다. 툴팁에는 생성 시각과 마지막 풀이 시각을 함께 제공하며, 오프라인의 빈 마지막 풀이 기록은 툴팁에서 명시합니다. 온라인 API에 없는 시각은 만들지 않습니다. 오프라인 이름 변경과 삭제는 `ActionMenu`에 모으며 별도 하단 버튼 줄을 추가하지 않습니다. 문제 카드도 같은 메뉴를 사용합니다. 메뉴는 방향키, Home/End, Escape와 닫힌 뒤 포커스 복귀를 지원합니다.

결과 화면은 지표, 문제 확인, 다시 풀기의 세 카드를 2:1:1 비율로 사용합니다. 결과 통계는 작은 표로, 상세 분석은 아래 전체 폭으로 표시합니다. 모바일에서도 문제 확인과 다시 풀기 버튼의 크기를 축소하지 않습니다.

풀이와 복기 화면은 장식보다 문제의 가독성을 우선합니다. 헤더 높이, 카드와 OMR의 독립 높이, 하단 이동은 기존 `CbtSolveScreen`과 복기 페이지를 기준으로 유지합니다. OMR 문항 수가 적다고 문제 카드와 같은 높이로 강제 확장하지 않습니다. 활성 풀이에서는 그라디언트, smooth scroll, 위치/크기 transition과 animation을 추가하지 않습니다. 상태 색상은 90ms 전환만 허용합니다.

내부 페이지 진입 효과는 `src/app/RouteEntrance.tsx`의 허용 경로에서만 사용합니다. `/home`, 오프라인과 온라인의 과목 목록, 문제 목록, 세션 목록, 결과 조회가 대상입니다. `/solve`, `/wrong`, `/review`와 온라인의 `/premium/attempts`, `/premium/wrong`, `/premium/review`에는 적용하지 않습니다. 계정, 설정, 미니 앱도 이 효과의 대상이 아닙니다. 랜딩은 기존 `landing-fade-up`의 700ms, 22px 이동과 미리보기의 120ms 지연을 그대로 유지합니다.

`RouteEntrance`는 `Suspense` 안에서 배치용 박스 없이 렌더링합니다. GNB는 페이지 이동 즉시 바뀌고 페이지 배경, 푸터와 모달도 애니메이션 대상에서 제외합니다. GNB를 포함한 너비 컨테이너에는 효과를 적용하지 않습니다. 그리드나 리스트에 `app-content-stagger`를 지정하면 직계 카드와 행만 아래에서 올라오며 나타납니다. 빈 상태나 결과 분석처럼 하나의 영역은 `app-content-enter`를 사용합니다. 온라인 스켈레톤은 제외하며 실제 데이터가 도착해 목록이 마운트될 때 등장 효과를 적용합니다.

메인은 360ms/12px, 과목 목록은 320ms/10px, 문제 목록은 280ms/8px, 세션 목록은 240ms/6px, 결과 조회는 280ms/8px입니다. 온라인과 오프라인은 같은 단계를 공유합니다. 여러 항목은 DOM 순서대로 20ms씩 차이를 주되 6번째부터는 100ms로 제한합니다. 긴 목록 때문에 나중 항목이 오랫동안 보이지 않는 일이 없어야 합니다. `backwards`는 등장 전의 짧은 간격에만 적용하며 종료 후 opacity나 transform을 남기지 않습니다. 카드 hover는 등장 후 기존 방식으로 동작합니다.

페이지 이동과 클릭은 애니메이션 완료를 기다리지 않습니다. 퇴장 애니메이션, JS 타이머, 클릭 잠금이나 필터를 추가하지 않습니다. 검색 조건, 앵커, 페이지 내부 상태 변경으로 화면을 다시 마운트하지 않습니다. 실제 풀이 화면인 `app-focus-page`는 CSS에서도 제외하고 랜딩에는 내부 페이지 효과를 중복 적용하지 않습니다.

환경설정(`/settings`)과 계정(`/account`)은 240ms/6px의 콘텐츠 진입 효과를 사용합니다. 탭 바와 콘텐츠만 표시 효과를 적용하며 GNB와 푸터는 정적으로 유지합니다. `TabContentMotion`은 탭 순서에 따라 오른쪽 또는 왼쪽 8px에서 160ms 동안 이동합니다. 최초 진입에는 가로 효과를 적용하지 않고, 탭 전환 뒤에는 세로 진입 효과를 중복 재생하지 않습니다. 계정 URL의 탭 변경과 뒤로 가기, 로그인/회원가입 전환에도 같은 규칙을 적용합니다. 패널을 강제로 다시 마운트하거나 대기 시간을 두지 않으며 기존 입력값을 유지합니다. 빠른 전환은 이전 애니메이션을 취소하고, 애니메이션 API가 없거나 동작 줄이기를 사용하면 즉시 전환합니다.

`prefers-reduced-motion`에서는 페이지 진입, 로딩과 랜딩 진입 애니메이션을 멈추고 hover의 이동도 없앱니다. 중앙 정렬 레이아웃이 탭 전환마다 흔들리지 않도록 `html`의 `scrollbar-gutter: stable`을 유지합니다.

## 8. 랜딩과 문구

`LandingHeader`는 랜딩과 미니 앱 목록에서 같은 스크롤 반응형 GNB를 사용합니다. 최상단에서는 전체 폭의 72px 바를 유지하고, 48px보다 아래로 스크롤하면 64px 높이의 플로팅 카드로 전환합니다. 다시 16px 이내로 올라오면 원래 형태로 돌아갑니다. 플로팅 표면은 공통 16px 곡률, 표면 색, 테두리와 그림자를 사용합니다. 데스크톱 상단 여백은 12px, 모바일은 8px이며 기기의 상단 안전 영역을 더합니다. 원래 헤더 높이를 빈 공간으로 유지해 본문 위치가 바뀌지 않고, 투명한 주변 영역은 아래 콘텐츠의 클릭을 막지 않습니다. 앵커 이동은 100px의 상단 여유를 두며, 동작 줄이기 설정에서는 형태 전환을 즉시 적용합니다.

랜딩은 첫 소개, 지원 기능, CSV 사용 단계, 주요 기능, 온라인 학습과 백업 및 미니 앱 소개, 마지막 CTA 순서를 유지합니다. 온라인 학습과 백업 및 미니 앱은 주요 기능 카드와 간격을 둔 독립 섹션으로 표시합니다. 내용별 수정 위치는 다음과 같습니다.

| 내용 | 수정 위치 |
| --- | --- |
| 제목, 소개, CSV 사용 단계, 마지막 CTA | `src/pages/LandingPage.tsx` |
| 재사용 기능 카드 | `src/components/landing/LandingFeatureCard.tsx` |
| 온라인 학습, 수동 백업, 미니 앱 소개 | `src/components/landing/LandingServiceFeatures.tsx` |
| CSV 헤더, 예시, 샘플 다운로드 | `src/components/landing/CsvGuideDialog.tsx` |
| 장식용 오프라인 풀이 미리보기 | `src/components/landing/LandingSolvePreview.tsx` |
| 검색과 공유 메타데이터 | `src/lib/seo.ts` |
| 미니 앱 이름, 상태, route, Premium 여부 | 각 앱의 manifest와 `src/mini-apps/catalog.ts` |

랜딩의 미니 앱 링크는 catalog에서 출시 상태와 route가 있는 앱만 가져옵니다. 랜딩에 별도의 앱 이름/주소 목록을 만들지 않습니다. 풀이 미리보기는 실제 CTA나 입력처럼 조작되지 않도록 유지하고, 실제 풀이 화면에 없는 결과나 해설을 장식으로 추가하지 않습니다.

안내 문구는 아래 경계를 지킵니다.

- 오프라인 CSV 문제와 풀이 기록은 기본적으로 현재 브라우저에 저장합니다. 무료 오프라인 시작에 회원가입을 요구하지 않습니다.
- 온라인 문제는 활성 Premium 회원권과 해당 과목 이용권이 필요하며, 답안과 풀이 기록을 계정에 연결해 서버에 저장합니다. 온라인 문제나 결과를 CSV로 내보낼 수 있다고 안내하지 않습니다.
- 클라우드 백업은 사용자가 직접 실행할 때 오프라인 전체 JSON을 암호화해 보관합니다. 자동 동기화라고 소개하지 않습니다. 미니 앱 데이터는 이 백업 범위에서 제외됩니다.
- 결제 수단은 현재 `PurchaseMethodModal`과 서버가 제공하는 상태를 기준으로 설명합니다. 비활성 또는 준비 중 수단을 사용할 수 있다고 홍보하지 않습니다.
- 짧고 자연스러운 한국어로 사용자의 행동과 결과를 적습니다. 중간점으로 명사를 이어 붙이거나 em dash, 말줄임, 인위적인 대조 문장을 사용하지 않습니다.

## 9. 검증 방법

`/debug/designsystem`을 직접 열면 토큰과 실제 버튼, 폼, 카드, 세션 목록, 메뉴, 대화상자, 토스트와 등장 효과를 확인할 수 있습니다. 이 페이지로 가는 서비스 메뉴는 만들지 않습니다. 검색 색인과 사이트맵, GA4 페이지뷰에서도 제외하고 직접 접속용 정적 앱 셸만 생성합니다. 데모 상호작용은 페이지 메모리만 바꾸며 실제 학습 데이터, 계정, 결제와 백업을 사용하지 않습니다. 공통 UI를 변경할 때 갤러리와 이 문서를 함께 갱신하세요.

공통 컴포넌트에 동작을 추가하면 해당 동작을 직접 검증합니다. `Dialog.test.tsx`는 포커스 순환, Escape, 원래 요소 복원, 중첩 대화상자, 저장 중 닫기 제한과 스크롤 복원을 확인합니다. UI 표현만 바꾸는 경우 구현을 그대로 복사한 테스트를 만들지 않습니다.

```bash
npm test
npm run build
npm run dev
```

로컬 개발 서버는 `http://127.0.0.1:5164`를 사용합니다. 운영 DB 연결 확인은 별도로 `npm run dev:production`의 5174 포트를 사용하며 디자인 확인을 위해 운영 데이터를 수정하지 않습니다.

브라우저에서 다음 상태를 확인하세요.

1. 390px 모바일, 768px 태블릿, 1280px 데스크톱의 카드 배치와 문구 줄바꿈
2. 라이트와 다크 모드의 배경, 글자 대비, CTA와 Premium 배지
3. 긴 제목, 빈 상태, 로딩, 오류, 진행 중 버튼
4. CSV 가이드의 가로 넘침, 샘플 링크, Escape와 닫기 버튼
5. 대화상자에 Tab으로 진입하고 순환한 뒤 닫았을 때의 포커스 복원
6. 풀이와 복기 화면의 정적인 CTA, OMR, 헤더 높이와 모바일 이동 버튼
7. 변경한 공개 경로의 직접 접속과 새로고침

공통 토큰을 바꾸면 그 토큰을 사용하는 랜딩뿐 아니라 대시보드, 문제 카드, 결과, 대화상자도 함께 봅니다. 테스트와 브라우저 확인 결과는 해당 변경의 PR에 기록합니다.

개별 미니 앱은 `MiniAppHeader`로 본문 흐름에 헤더 자리를 유지합니다. 랜딩 전용 `landing-nav-*` 클래스는 직접 재사용하지 않습니다. 640px 미만은 제목과 액션 두 줄, 그 이상은 한 줄이며 앱 제목만 말줄임표로 처리합니다. 본문 앵커에는 `mini-app-anchor`를 사용합니다. 전체 화면 iframe은 자체 헤더를 유지합니다. 자세한 기준은 [미니 앱 가이드](../src/mini-apps/README.md#헤더와-화면-배치)를 따릅니다.
