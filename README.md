# law-solver

별도 서버 없이 브라우저에서 동작하는 로스쿨 문제 풀이 웹앱입니다. CSV 파일을 업로드해 CBT 방식으로 문제를 풀고, 채점 결과 확인, 오답 복기, 오답노트 작성, 재풀이, CSV 내보내기까지 브라우저 안에서 처리합니다.

License: CC BY-NC-ND  
(c) 2026 Haryun all rights reserved

## Screenshots

| 문제풀이 페이지 | 힌트 보기 |
| --- | --- |
| ![Solve page](docs/page_1.png) | ![Hint view](docs/page_2.png) |

| 풀이 결과 | 오답 정리 |
| --- | --- |
| ![Result page](docs/page_3.png) | ![Wrong answer review](docs/page_4.png) |

## 주요 기능

- 랜딩 페이지, 과목 목록, 과목별 문제 풀이 대시보드
- 과목 추가/편집/삭제, 5종 표지 색상 선택, 드래그 순서 변경, 문제별 과목 배정, `과목 없음` 기본 폴더
- OX, 5지선다, 단답형 CSV 업로드
- 번호 순서, 챕터별 랜덤, 전체 랜덤 풀이 순서 선택
- CBT 풀이 화면, 타이머, OMR, 모바일 Bottom Sheet
- 5지선다 박스형 지문(`박스1`, `박스2`, `box1`, `box2` 등) 표시
- 정답/해설 보기, 책갈피, 일시 중단
- 제출 후 점수, 정답률, OMR 채점표 확인
- 오답 확인, 전체 문항 확인, 책갈피 문항 확인
- 오답노트 작성 및 저장
- 오답만 다시 풀기, 전체 새로 풀기, 책갈피 문제만 다시 풀기
- 전체 결과 CSV, 오답 결과 CSV, 오답노트 CSV 다운로드
- 과목/문제/풀이 기록을 포함한 대시보드 JSON 백업, 복원, 초기화
- 다크 모드와 글꼴 설정
- GitHub Pages 배포 설정과 SPA 새로고침 대응

## 기술 스택

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand + localStorage persist
- Papa Parse
- Vitest

## 디렉터리 구조

```txt
.
├── .github/workflows/deploy-pages.yml  # GitHub Pages 자동 배포 워크플로우
├── docs/                               # README 스크린샷 이미지
├── public/
│   ├── 404.html                        # GitHub Pages SPA redirect
│   └── CNAME                           # 커스텀 도메인: lawsolver.haryun.io
├── samples/                            # 업로드 테스트용 샘플 CSV
├── src/
│   ├── components/
│   │   ├── cbt/                        # CBT 풀이 UI
│   │   ├── review/                     # 리뷰 화면용 재사용 UI
│   │   ├── ui/                         # 브랜드, 모달, 공통 헤더/푸터 UI
│   │   └── upload/                     # CSV 업로드 UI
│   ├── lib/                            # CSV, 정렬, 채점, ID, 시간 유틸 및 테스트
│   ├── pages/                          # 라우트 단위 화면
│   ├── store/                          # Zustand stores
│   ├── types/                          # 공유 타입
│   ├── App.tsx                         # 라우팅 및 테마 watcher
│   └── main.tsx                        # React entry
├── index.html                          # Vite HTML entry, OG meta, SPA redirect restore
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

## 디자인 시스템

Law Solver는 랜딩부터 문제 풀이, 결과, 오답 복기 화면까지 하나의 디자인 시스템을 사용합니다.

- 기본 배경: 눈의 피로를 줄이는 미색 계열
- 표면: 따뜻한 백색 카드와 얇은 중립 테두리
- 브랜드 색상: 레드를 중심으로 한 포인트 컬러
- 강조 그라디언트: 대표 CTA와 진행률에서만 레드→주황→오렌지 사용
- 의미 색상: 정답 emerald, 오답·선택 red, 정답 안내 blue, 책갈피 amber
- 다크 모드: 같은 정보 위계와 대비를 유지하는 짙은 웜 뉴트럴 표면
- 집중 풀이 화면: 단색 레드 CTA와 90ms의 짧은 hover 색상 전환만 사용하며 이동·축소 애니메이션은 제외
- 문제 세션 카드: 흰색 표면과 아주 밝은 회색 결과 확인 영역으로 정보 구획을 분리
- 넓은 강조 패널: 브랜드 레드에서 코럴과 오렌지로 밝게 이어지는 그라디언트
- 모달 배경: 콘텐츠 식별이 가능한 2px의 약한 블러

공통 스타일은 `src/index.css`의 `app-*` 클래스에 정의되어 있습니다. `app-page`, `app-card`, `app-topbar`, `app-button-primary`, `app-button-secondary`, `app-control`, `app-modal-surface` 등을 페이지와 공통 컴포넌트에서 재사용합니다. 그라디언트 버튼은 hover 시 색상만 진해지며, 상승 효과는 단독 CTA에 `app-button-primary-standalone`을 함께 지정한 경우에만 적용됩니다. 로고는 `src/components/ui/BrandMark.tsx`가 `public/favicon.svg`를 참조하므로 파비콘과 앱 내부 브랜드가 항상 동일합니다.

공통 디자인 클래스는 색상, 테두리, 그림자와 상태 표현만 담당합니다. 위치와 크기 같은 레이아웃은 각 화면의 컴포넌트가 소유해, 공통 스타일 변경이 CBT 버튼이나 카드 배치를 덮어쓰지 않도록 합니다. 랜딩의 문제 풀이 예시는 실제 CBT의 상단 제어, 문제 카드, OMR, 하단 이동 구조를 축소해 보여 줍니다.

디자인 리팩터링은 기존 라우트, 화면 배치, 사용자 흐름과 localStorage 데이터 구조를 변경하지 않는 것을 원칙으로 합니다.

## 앱 실행 흐름

- `/`: 랜딩 페이지
- `/dashboard`: 과목 목록, 과목 관리, 환경설정, 전체 데이터 백업/복원/초기화
- `/dashboard/:subjectId`: 과목별 세션 목록, CSV 업로드, 문제 제목/과목 편집
- `/solve/:sessionId`: CBT 풀이
- `/result/:sessionId`: 채점 결과와 재풀이/다운로드 액션
- `/wrong/:sessionId`: 오답 확인 및 오답노트 작성
- `/review/:sessionId`: 전체 문항 또는 책갈피 문항 확인

세션, 과목, 세션-과목 매핑 데이터는 `law-solver-storage` 키로 localStorage에 저장됩니다. 환경설정은 `law-solver-settings` 키로 저장됩니다.

`과목 없음`은 실제 과목 객체로 저장하지 않습니다. 세션-과목 매핑이 없는 세션을 `과목 없음`으로 표시합니다.

## 설치 방법

```bash
npm install
```

CI나 재현 가능한 설치가 필요할 때는 lockfile 기준으로 설치합니다.

```bash
npm ci
```

## 환경변수 설정

현재 코드베이스에는 필수 환경변수가 없습니다. `.env` 파일도 확인되지 않았습니다.

환경변수를 추가해야 하는 기능을 만들 때는 Vite 관례에 따라 클라이언트에 노출 가능한 값만 `VITE_` 접두사를 사용하세요. 비밀키나 서버 전용 시크릿은 이 프로젝트의 프론트엔드 번들에 넣으면 안 됩니다.

## 개발 서버 실행

```bash
npm run dev
```

기본 접속 주소는 Vite 기본값인 `http://localhost:5173`입니다.

## 빌드와 배포

프로덕션 빌드:

```bash
npm run build
```

로컬에서 빌드 결과 미리보기:

```bash
npm run preview
```

GitHub Pages 배포:

- `.github/workflows/deploy-pages.yml`이 `main` 브랜치 push 또는 수동 실행(`workflow_dispatch`) 시 동작합니다.
- 워크플로우는 `npm ci`, `npm run build` 후 `dist`를 Pages artifact로 업로드합니다.
- `public/CNAME`에 `lawsolver.haryun.io`가 설정되어 있습니다.
- `public/404.html`과 `index.html`의 redirect restore 스크립트로 GitHub Pages에서 SPA 라우트 새로고침 404를 우회합니다.

## 데이터 백업/복원

최상위 과목 대시보드의 `데이터 관리`에서 수행하는 백업/복원은 과목별이 아니라 전체 데이터베이스 단위입니다. 백업은 다음 데이터를 하나의 JSON으로 저장합니다.

- 문제 세션과 유저 답안
- 과목 목록
- 과목별 표지 색상과 표시 순서
- 세션-과목 매핑
- 오답노트와 책갈피

현재 백업 포맷은 객체 형태입니다.

```json
{
  "app": "law-solver",
  "version": 2,
  "exported_at": "2026-07-01T00:00:00.000Z",
  "sessions": [],
  "subjects": [],
  "sessionSubjectMap": {}
}
```

이전 버전의 배열 형태 백업도 복원할 수 있습니다. 구형 백업을 복원하면 모든 세션은 `과목 없음`으로 들어갑니다.

## 테스트와 린트

테스트:

```bash
npm test
```

Watch 모드:

```bash
npm run test:watch
```

린트:

```bash
npm run lint
```

현재 `package.json`에는 `lint` 스크립트가 없습니다. 필요하면 ESLint 설정과 함께 추가해야 합니다.

## CSV 형식

업로드는 UTF-8(BOM 포함/미포함), EUC-KR(CP949) CSV를 자동 감지해 읽습니다. 다운로드 CSV는 Excel 호환을 위해 UTF-8 BOM과 CRLF 줄바꿈으로 생성합니다.

### OX

```csv
번호,챕터,문제,정답,해설,출처
```

- `정답`: `O` 또는 `X`

### 5지선다

```csv
번호,챕터,문제,선택지1,선택지2,선택지3,선택지4,선택지5,정답,해설,출처
```

- `정답`: `1`부터 `5`
- `선택지` 대신 `지문`, `선지`, `choice`, `option` 계열 헤더도 일부 호환됩니다.
- 박스형 지문은 `박스1`, `박스2` 또는 `box1`, `box2` 같은 헤더로 추가할 수 있습니다.

### 단답형

```csv
번호,챕터,문제,정답,해설,출처
```

- `정답`: 문자열 그대로 비교합니다.

개발·수동 테스트용 샘플은 `samples/` 디렉터리에 있습니다. 랜딩에서 내려받는 배포용 샘플은 `public/samples/`에 있으며 OX, 일반 5지선다, 박스형 5지선다, 단답형을 각각 제공합니다.

## 현재 알려진 제한사항 / TODO

- 서버가 없으므로 모든 데이터는 사용자의 브라우저 localStorage에만 저장됩니다. 브라우저 데이터 삭제, 다른 기기 사용, 시크릿 모드에서는 데이터가 유지되지 않을 수 있습니다.
- 중요한 풀이 기록은 대시보드 JSON 백업 또는 CSV 다운로드로 별도 보관해야 합니다.
- 과목 삭제 시 문제 세션은 삭제되지 않고 `과목 없음`으로 이동합니다.
- 단답형 채점은 현재 문자열 일치 기반입니다. 띄어쓰기, 대소문자, 동의어 처리 같은 정규화는 제한적입니다.
- `npm run lint`는 아직 제공되지 않습니다. 린트 도입이 필요하면 별도 설정이 필요합니다.
- `public/CNAME`은 `lawsolver.haryun.io` 기준입니다. GitHub 기본 도메인(`https://haryunio.github.io/law-solver/`)으로만 운영할 경우 CNAME과 Vite base 설정을 함께 점검해야 합니다.

## 확인한 명령어

- `npm test`: 통과, 3개 테스트 파일 / 9개 테스트
- `npm run build`: 통과
