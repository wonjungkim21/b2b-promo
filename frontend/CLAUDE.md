# 프론트앤드앱 개발을 위한 지침

## 기술 스택 (반드시 준수, 출처: docs/4-PRD.md 7장)

- **프레임워크**: React 19
- **전역 상태관리**: Zustand — 로그인 토큰, UI 상태(모달 열림 등) 등 순수 클라이언트 상태만 담당한다. 서버에서 온 데이터(이벤트 목록/포인트 잔액/응모 내역 등)의 캐시 용도로 쓰지 않는다.
- **서버 상태/통신**: TanStack Query — 이벤트 목록/상세, 포인트 잔액, 응모 내역 등 서버 데이터는 전부 TanStack Query 훅을 통해서만 접근한다. 화면 컴포넌트가 API를 직접 호출하지 않는다.
- **백엔드 연동 대상**: Node.js + Express, PostgreSQL 17 (ORM 미사용, `docs/swagger.json` API 명세 기준으로 연동)
- **인증 방식**: JWT 기반 Access Token(짧은 만료) + Refresh Token(긴 만료) 조합. Access Token은 API 요청 인증에, Refresh Token은 Access Token 재발급에 사용한다.
- 위 스택 외 새 프레임워크/상태관리 라이브러리(Redux, Recoil, SWR 등)를 임의로 추가하지 않는다.

## 참조 문서 (freshmeal-point-event)

| 문서 이름 | 파일 | 설명 |
|---|---|---|
| PRD | [4-PRD.md](../docs/4-PRD.md) | 목표·KPI, 기능요구사항·우선순위, 기술스택(React 19 + Zustand + TanStack Query), 일정 |
| 사용자 시나리오 | [5-user-scenario.md](../docs/5-user-scenario.md) | UC-0~UC-12 Given/When/Then, 정상·예외 흐름 |
| 프로젝트 구조 설계 원칙 | [6-project-principle.md](../docs/6-project-principle.md) | 레이어/네이밍/테스트/보안 원칙, 프론트엔드 디렉토리 구조(6장) |
| 기술 아키텍처 다이어그램 | [7-arch-diagram.md](../docs/7-arch-diagram.md) | 기술 아키텍처 다이어그램 (mermaid) |
| 화면 와이어프레임 | [8-wireframe.md](../docs/8-wireframe.md) | 화면 레이아웃(ASCII), 반응형 브레이크포인트 원칙 |
| UI 스타일 가이드 | [12-style.md](../docs/12-style.md) | 컬러/타이포그래피/여백/공통 컴포넌트 스타일, 와이어프레임 화면 매핑 |
| 개발 실행계획 | [11-plan.md](../docs/11-plan.md) | FE Task(FE-1~FE-9)와 완료조건 |
| API 명세 | [swagger.json](../docs/swagger.json) | OpenAPI API 명세 (백엔드 연동 시 참조) |
