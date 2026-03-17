# law-solver
브라우저(localStorage)만으로 동작하는 법학 문제 풀이 웹앱입니다.  
CSV 업로드 → CBT 풀이 → 채점 결과/오답 복기 → 답안 포함 CSV 다운로드까지 지원합니다.

## Tech Stack
- React (Functional Components, Hooks)
- TypeScript
- Tailwind CSS
- Zustand + localStorage persist
- Papa Parse (CSV 파싱/내보내기)
- Vite

## 주요 기능
- 대시보드
  - 세션 목록 조회
  - 새 문제 등록(CSV 업로드)
  - 풀이 순서 선택(번호 순서 / 챕터별 랜덤 / 전체 랜덤)
  - 이어풀기 / 결과보기 / 삭제
- CBT 풀이 화면
  - 상단 타이머(00:00 카운트업)
  - OX 또는 5지선다 선택
  - 이전/다음 문항 이동
  - OMR 번호판 클릭 이동
  - 모바일 OMR Bottom Sheet
- 제출/채점 결과
  - 소요 시간, 정답률, 정답 개수 표시
  - 오답 확인하기 이동
  - CSV 다운로드(`my_answer` 열 추가)
  - OMR 채점표(문제번호 | 나의 답 | 정답, 정오 색상)
- 오답 확인 화면
  - 틀린 문제만 필터링
  - 내가 고른 답(빨강), 실제 정답(파랑), 해설/출처 표시
  - 이전/다음 오답 이동

## 로컬 실행 방법
1. 의존성 설치
```bash
npm install
```
2. 개발 서버 실행
```bash
npm run dev
```
3. 브라우저 접속
- 기본: `http://localhost:5173`

## 빌드 / 테스트
- 프로덕션 빌드
```bash
npm run build
```
- 테스트
```bash
npm test
```

## 사용 방법
1. 홈 대시보드에서 `새 문제 등록` 클릭
2. 세션 제목 입력 후 문제 타입 선택 (`OX` 또는 `5지선다`)
3. CSV 업로드 후 `등록 후 풀이 시작`
4. 문제 풀이 중 상단 `제출 및 종료` 클릭 시 자동 채점
5. 결과 화면에서 `오답 확인하기` 또는 `CSV로 다운로드` 선택

## CSV 형식
### OX
헤더 예시:
```csv
번호,문제,정답,해설 (Optional),출처 (Optional)
```
- `정답`: `O` 또는 `X`

### 5지선다
헤더 예시:
```csv
번호,문제,선택지1,선택지2,선택지3,선택지4,선택지5,정답,해설,출처
```
- `정답`: `1`~`5`

프로젝트 루트에 샘플 파일(`OX_sample.csv`, `5지선다_sample.csv`)을 두고 바로 테스트할 수 있습니다.

## 인코딩 주의사항
- 업로드: UTF-8(BOM 포함/미포함), EUC-KR(CP949) CSV를 자동 감지해 읽습니다.
- 다운로드: Excel 호환을 위해 UTF-8 BOM + CRLF로 저장합니다.

## 프로젝트 구조
```txt
src/
  components/
    cbt/CbtSolveScreen.tsx
    upload/CsvUploadPanel.tsx
  lib/
    csv.ts
    session.ts
    time.ts
  pages/
    DashboardPage.tsx
    SolvePage.tsx
    ResultPage.tsx
    WrongAnswersPage.tsx
  store/
    useTestStore.ts
  types/
    test.ts
```
