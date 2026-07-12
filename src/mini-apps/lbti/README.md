# LBTI: 로스쿨생 MBTI 테스트 (`lbti`)

Law Solver의 첫 번째 미니 앱입니다. 시간과 기억력이 부족한 수험 상황에서 자동으로 내리는 공부 의사결정을 P–T, W–C, R–O, S–D 네 축으로 살펴봅니다.

## 준비된 디렉터리

```txt
lbti/
├── assets/       # 앱 전용 이미지와 정적 자산
├── components/   # LBTI 전용 UI 컴포넌트
├── data/         # 지표·유형·문항 등 구조화된 콘텐츠 JSON
├── docs/         # 제품 기획서와 콘텐츠 작성 기준
├── lib/          # 결과 계산 등 순수 도메인 로직
├── store/        # 필요한 경우에만 사용하는 앱 전용 상태 저장
├── manifest.ts   # /apps 목록 메타데이터
└── README.md     # 확정 명세와 개발 기록
```

## 현재 문서

- `data/lbti-framework.json`: 네 지표, 16개 유형, 문항 예시, 결과 구성, 안전 문구와 출처
- `data/questions.ko.json`: 축당 7개의 기본 문항, S 가점 문항 1개와 보조 문항 1개, 총 30개 문항
- `data/README.md`: JSON 필드와 편집·검증 규칙
- `docs/PRODUCT_PLAN.md`: 제품 정의, 사용자 흐름, 1차 채점안, 화면 범위, 개인정보와 출시 단계
- `docs/CONTENT_GUIDE.md`: 문항·결과문·밈 작성 및 검수 기준

현재 manifest는 `available` 상태입니다. `/apps/lbti` 소개, `/test` 설문, `/types` 전체 유형, `/result/:typeCode` 공유 결과 화면이 모두 이 폴더 안에서 동작합니다. 답변은 서버나 localStorage에 저장하지 않으며 결과 링크에는 유형 코드만 포함합니다.

## 구현 파일

- `LbtiHomePage.tsx`: 소개와 테스트 진입
- `LbtiTestPage.tsx`: 30문항 응답 흐름
- `LbtiResultPage.tsx`: 유형 해석과 링크 공유
- `LbtiTypesPage.tsx`: 16개 유형 탐색
- `components/`: LBTI 전용 레이아웃과 유형 코드 UI
- `lib/lbti.ts`: 채점, 유형 조회, 유사·정반대 유형 계산
- `content.ts`: 유형별 대표 문구와 pole별 결과 콘텐츠
