# FreshMeal 포인트 이벤트 응모 (freshmeal-point-event)

보유 포인트로 진행 중인 이벤트에 응모하는 B2B 프로모션 웹 애플리케이션입니다.

## Demo Site

- 프론트엔드: https://honghak-123-fe.vercel.app
- 백엔드 API: https://honghak-123-be.vercel.app (헬스체크: `/health`)

## 문서

개발 과정에서 작성한 `docs/` 디렉토리의 문서입니다. 번호 순서대로 서로를 기반 문서로 인용합니다.

| # | 문서 | 내용 |
|---|---|---|
| 2 | [도메인 정의서](docs/2-domain-definition.md) | 액터/엔티티/유스케이스/비즈니스 규칙/MVP 범위 |
| 3 | [유스케이스 다이어그램](docs/3-usecase.md) | 유스케이스 다이어그램 (mermaid) |
| 4 | [PRD](docs/4-PRD.md) | 목표·KPI, 기능요구사항·우선순위, 기술스택, 일정·리소스, Out of Scope |
| 5 | [사용자 시나리오](docs/5-user-scenario.md) | Given/When/Then 정상·예외 흐름 |
| 6 | [프로젝트 구조 설계 원칙](docs/6-project-principle.md) | 레이어/네이밍/테스트/보안 원칙, 프론트·백엔드 디렉토리 구조 |
| 7 | [기술 아키텍처 다이어그램](docs/7-arch-diagram.md) | 기술 아키텍처 다이어그램 (mermaid) |
| 8 | [와이어프레임](docs/8-wireframe.md) | 화면 와이어프레임 |
| 9 | [ERD](docs/9-erd.md) | ERD (mermaid) |
| 10 | [DB 스키마](docs/10-schema.sql) | PostgreSQL 17 DDL |
| 11 | [개발 실행계획](docs/11-plan.md) | DB/BE/FE Task, 의존관계, 완료조건 체크박스 |
| 12 | [UI 스타일 가이드](docs/12-style.md) | 컬러/타이포그래피/여백/공통 컴포넌트 스타일 |
| - | [API 명세 (Swagger)](docs/swagger.json) | OpenAPI 3.0.3 |

## 테스트용 사용자 계정

`backend/seed.sql` 기준 계정입니다. 모든 계정의 비밀번호는 `password123`입니다.

| 이름 | 로그인 ID | 역할 | 용도 |
|---|---|---|---|
| 관리자 | `admin@freshmeal.test` | admin | 이벤트 등록/수정/상태변경, 응모 현황 조회 |
| 박풍족 | `user-high@freshmeal.test` | user | 다회 응모 케이스 확인용 |

신규 가입 시에는 `pointBalance` 초기값으로 5,000이 자동 지급됩니다.

## 간략한 테스트 시나리오

1. **회원가입/로그인**: `/signup`에서 새 계정을 만들면 5,000P가 지급되고, 로그인하면 이벤트 목록으로 이동한다.
2. **이벤트 조회**: 이벤트 목록에서 진행중/예정 이벤트만 노출되는지 확인하고, 상세보기에서 이벤트 정보와 최대 응모 가능 횟수(보유 포인트 ÷ 1,000)를 확인한다.
3. **응모**: `user-high@freshmeal.test`로 로그인해 이벤트 상세에서 응모 횟수를 선택하고 확정하면 포인트가 차감되고 누적 응모 정보가 표시된다.
4. **응모 내역**: 우측 상단 응모 내역(🧾) 아이콘에서 방금 응모한 내역이 조회되는지 확인한다.
5. **관리자 기능**: `admin@freshmeal.test`로 로그인해 이벤트를 새로 등록하고, 상태를 예정 → 진행중 → 종료로 변경한 뒤 해당 이벤트의 응모 현황(전체 응모 횟수/참여자 수)을 조회한다.

더 상세한 시나리오와 예외/엣지케이스는 [`docs/5-user-scenario.md`](docs/5-user-scenario.md)와 [`e2e/`](e2e/) 디렉토리의 E2E 테스트 리포트를 참고하세요.
