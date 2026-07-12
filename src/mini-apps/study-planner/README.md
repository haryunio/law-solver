# 스터디 플래너 (`study-planner`)

## 목표

과목별 공부 계획과 오늘 할 일을 가볍게 관리하는 기기 로컬 플래너입니다.

## 첫 번째 버전

- 과목별 할 일 생성·수정·완료·삭제
- 목표 날짜와 오늘 보기
- 완료된 항목 접기와 간단한 진행 표시
- 기기 내 자동 저장과 전체 JSON 내보내기/가져오기

## 제외 범위

- 캘린더 서비스 연동, 알림 push, 협업과 계정 동기화
- Law Solver 문제 세션의 자동 변경

## 데이터 방향

저장 key는 `law-solver-mini-app:study-planner:v1`을 사용합니다. 기존 Law Solver 과목을 활용할 경우 `useTestStore`를 직접 변경하지 않고 읽기 전용 연결을 먼저 정의합니다. 과목명과 일정은 GA4에 보내지 않습니다.

## 출시 조건

날짜 경계, CRUD, 저장 migration, import/export 테스트와 모바일·다크 모드 확인 후 `/apps/study-planner`에 연결합니다.
