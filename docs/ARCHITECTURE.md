# 구조와 데이터 흐름

이 문서는 프론트 구현을 변경할 때의 출발점입니다. 디자인 구현은 [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), 실행과 검증은 [MAINTENANCE.md](MAINTENANCE.md)를 함께 확인하세요.

## 저장소 경계

| 영역 | 원본과 변경 위치 | 저장 위치 |
| --- | --- | --- |
| 사용자가 올린 CSV, 과목, 답안, 풀이 기록 | 이 저장소의 `src/store/useTestStore.ts` | 브라우저 IndexedDB |
| 테마와 글꼴 | `src/store/useSettingsStore.ts` | localStorage |
| 계정과 이용권, 온라인 문제, 온라인 풀이 | 비공개 서버의 API와 DB | Supabase |
| 사용자가 실행한 오프라인 클라우드 백업 | 프론트 암호화와 서버 `backup-api` | 암호문만 비공개 Storage |
| 미니 앱 데이터 | 각 `src/mini-apps/<app-id>/` | 앱별 메모리 또는 localStorage |

오프라인 원본 문제와 답안을 서버에 자동으로 올리지 않습니다. Premium 온라인 답안과 학습 기록은 계정에 연결해 서버에 저장합니다. GA4에는 두 방식의 문제 본문, 답안, 점수, 학습 기록을 보내지 않습니다. 미니 앱 데이터는 전체 JSON 백업에 포함되지 않습니다.

서버의 비공개 CSV, 관리자 값, 비밀키를 프론트 저장소에 복사하지 마세요. 서버 계약을 바꿀 때는 서버의 `docs/API.md`, `docs/AUTHORIZATION.md`, `docs/FRONTEND_INTEGRATION.md`부터 수정합니다.

## 앱 실행

`src/main.tsx`가 BrowserRouter와 React StrictMode를 시작합니다. `src/App.tsx`는 전역 watcher, SEO, 분석, 라우트를 조합합니다.

- `src/app/AppWatchers.tsx`: 테마와 글꼴 반영, 계정 초기화, 탭 복귀와 네트워크 복구 시 조용한 계정 갱신
- `src/app/AppRoutes.tsx`: 모든 URL과 화면 연결, 랜딩 외 화면의 지연 로딩, 오프라인 데이터 준비가 필요한 경로 지정
- `src/app/AppRouteBoundary.tsx`: 화면 모듈 로딩과 렌더링 실패 시 복구 안내
- `src/app/RouteAnchorScroll.tsx`: 지연 로딩된 화면의 앵커 위치로 이동

라우트 경로가 바뀌면 화면 경계를 다시 만듭니다. 같은 종류의 화면에서 과목 ID나 풀이 ID가 바뀌어도 이전 화면의 로컬 상태가 남지 않습니다. 검색 파라미터 변경은 이 경계를 다시 만들지 않아 계정 화면의 탭 전환 상태를 유지합니다.

`OfflineDataHydrationGate`는 `/settings`, `/dashboard`, `/dashboard/:subjectId`, `/dashboard/:subjectId/problem-sets/:problemSetId`, `/solve/:sessionId`, `/result/:sessionId`, `/wrong/:sessionId`, `/review/:sessionId`에서 사용합니다. 이 화면들은 저장소 초기화와 이전이 끝나기 전 데이터를 읽거나 수정할 수 없습니다. 랜딩, 계정, 온라인 학습, 미니 앱은 오프라인 저장소 장애 때문에 막히지 않습니다.

새 화면이 오프라인 store를 읽거나 변경한다면 라우트에 이 gate를 적용하세요. Premium 화면에 오프라인 store 접근을 추가해 이 경계를 우회하지 마세요.

## Premium client

화면과 store는 `src/lib/premiumApi.ts`를 공개 진입점으로 사용합니다. 기존 export 이름을 유지해 구현 파일을 이동해도 호출부가 영향을 받지 않도록 합니다.

| 파일 | 책임 |
| --- | --- |
| `src/lib/premium/types.ts` | 서버 응답과 요청의 TypeScript 계약 |
| `client.ts` | 공개 Supabase 설정과 단일 client |
| `auth.ts` | 로그인, 로그아웃, Auth 구독, 세션 갱신 공유 |
| `transport.ts` | JWT 요청, 401 재시도, 공통 응답 envelope 확인 |
| `errors.ts` | 안정적인 오류 코드와 사용자 안내 |
| `account.ts` | 계정, 상품 목록, 주문, 프로모션 코드 |
| `learning.ts` | 과목과 문제 세트, 풀이와 결과 API |
| `backup.ts` | 백업 메타데이터와 암호문 전송 |

`transport.ts`는 인증 실패에 한해서 최초 요청의 body와 멱등키를 유지해 한 번 재시도합니다. 네트워크 오류나 결제 실패를 자동 반복하지 않습니다. 동시에 필요한 세션 갱신은 같은 Promise를 사용합니다. 응답의 envelope를 확인하되 TypeScript 타입만으로 서버 데이터 전체가 런타임 검증되는 것은 아닙니다. 계약 변경 시 서버 테스트와 프론트 소비부 테스트를 함께 추가하세요.

컴포넌트에서 원문 `error.message`를 표시하지 않습니다. `getPremiumErrorMessage`로 사용자가 다시 시도하거나 계정 상태를 확인할 수 있는 안내를 만듭니다.

## 조회와 변경

`usePremiumResource`는 과목 목록 안의 문제 조회, 문제별 세션 조회, 결과 조회에서 사용합니다. `useCallback`으로 고정한 조회 함수와 리소스 key를 전달하세요. key 또는 조회 함수가 바뀌면 이전 데이터를 즉시 숨기고 늦게 도착한 응답을 버립니다. 실패와 빈 목록을 구분하며 `reload`로 다시 조회할 수 있습니다. 변경 후 결과 반영에는 `setData`를 사용하고 과거 리소스의 응답을 현재 화면에 넣지 마세요.

활성 풀이의 변경은 `PremiumSolvePage`가 직렬로 저장합니다. 답안 선택은 화면에 먼저 반영하고 문항을 떠날 때 저장합니다. 실패한 답안과 책갈피는 페이지 메모리에 남겨 다음 저장 시도에 포함합니다. 각 수정의 객체 identity로 저장 완료를 확인하므로 같은 값을 다시 선택해도 오래된 요청이 새 수정 상태를 지우지 않습니다. 중단이나 제출은 대기 중인 저장이 끝나고 남은 변경까지 저장된 뒤 실행합니다. 저장이 실패하면 화면을 유지합니다. 저장 전 새로고침이나 탭 닫기는 메모리의 변경을 복구하지 못하므로 오류 복구 안내에서 새로고침을 자동 실행하지 마세요.

## 풀이 화면의 공통 계약

- `CbtSolveScreen`이 오프라인과 Premium 문제 카드, OMR, 선택, 이동, 중단, 제출 UI를 공유합니다.
- `premiumSession.ts`가 서버 구조를 기존 화면용 TestSession으로 변환합니다.
- `useOfflineSession`은 현재 문제 원본과 세션 기록만 선택하고 `materializeOfflineSession`으로 같은 화면 계약을 만듭니다. 조합한 문항 배열은 영구 저장하지 않습니다.
- `SessionPageContext`의 adapter가 `ResultPage`, `WrongAnswersPage`, `ReviewAllPage`에 이동 경로, 재풀이, 오답 노트 저장 동작을 제공합니다.
- Premium 정답과 해설은 현재 문항의 별도 조회나 제출 결과에서만 받습니다. Premium 콘텐츠에는 CSV 내보내기를 제공하지 않습니다.
- Premium 채점은 서버가 수행합니다. 프론트 채점 결과를 서버의 정답 판정으로 사용하지 마세요.

## 저장 호환성

오프라인 저장은 DB `law-solver-offline`, object store `persisted-state`, key `law-solver-storage`를 사용합니다. 레거시 localStorage의 같은 key는 정상 이전과 영구 저장 확인 뒤 제거합니다. 환경설정 key `law-solver-settings`는 그대로 유지합니다.

저장 구조 변경은 `offlineDataStorage.ts`, `useTestStore.ts`, `dashboardBackup.ts`와 기존 버전 fixture를 함께 검토하세요. 복구와 초기화는 영구 저장 성공 뒤 메모리 상태를 바꿉니다. IndexedDB 쓰기 실패를 성공 안내로 덮거나 기존 데이터를 먼저 지우지 마세요.

v4는 `problemSets`에 원본 문항을, `sessions`에 문항 참조와 학습 기록을 보관합니다. CSV 등록과 세션 생성을 분리하며 구형 세션은 문제 하나와 세션 하나로 이전합니다. 로컬 hydration과 파일 복구, 복호화된 클라우드 백업은 같은 검증 경계를 사용합니다. 날짜와 재풀이 참조, 백업 개수의 의미는 [OFFLINE_DATA_MODEL.md](OFFLINE_DATA_MODEL.md)에 정리되어 있습니다.
