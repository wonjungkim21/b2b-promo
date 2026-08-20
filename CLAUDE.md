# B2B-promo 프로젝트의 최상위 지침

##반드시 준수할 최우선 지침

- 모든 대화는 한국어로 할것
- 오버엔지니어링 금지

##개발할때의 다음 사항을 준수할것

- 안드레 카파시의 CLAUDE.md
- https://raw.githubusercontent.com/multica-ai/andrej-karpathy-skills/refs/heads/main/CLAUDE.md

## docs/ 디렉토리 문서 참조

이 저장소의 `docs/`에는 서로 완전히 별개인 두 애플리케이션의 산출물이 함께 있다. 작업 전 어느 앱에 대한 요청인지 먼저 확인할 것.

### 1. b2b-promo (식자재 유통 B2B 프로모션 앱)
- `docs/1-domain-definition.md` — 도메인 정의서 (액터/엔티티/유스케이스/비즈니스 규칙/MVP 범위). 이 앱은 이 문서 1개만 존재하며, 아래 freshmeal-point-event 문서들과 절대 혼동하지 말 것.

### 2. freshmeal-point-event (포인트 기반 이벤트 응모 앱)
문서 체인은 번호 순서대로 서로를 기반 문서로 인용하며 최신 버전으로 유지되어야 한다.

| 파일 | 내용 |
|---|---|
| `docs/2-domain-definition.md` | 도메인 정의서 (액터/엔티티/유스케이스 UC-0~UC-12/비즈니스 규칙 5.1~5.9/MVP 범위) |
| `docs/3-usecase.md` | 유스케이스 다이어그램 (mermaid) |
| `docs/4-PRD.md` | PRD (목표·KPI/기능요구사항·우선순위/기술스택/일정·리소스/Out of Scope) |
| `docs/5-user-scenario.md` | 사용자 시나리오 (Given/When/Then, 정상·예외 흐름) |
| `docs/6-project-principle.md` | 프로젝트 구조 설계 원칙 (레이어/네이밍/테스트/보안 원칙, 프론트·백엔드 디렉토리 구조) |
| `docs/7-arch-diagram.md` | 기술 아키텍처 다이어그램 (mermaid) |
| `docs/8-wireframe.md` (+ `docs/assets/`) | 화면 와이어프레임 |
| `docs/9-erd.md` | ERD (mermaid) |
| `docs/10-schema.sql` | PostgreSQL 17 DDL |
| `docs/11-plan.md` | 개발 실행계획 (DB/BE/FE Task, 의존관계, 완료조건 체크박스) |
| `docs/12-style.md` | UI 스타일 가이드 (컬러/타이포그래피/여백/공통 컴포넌트 스타일, 8-wireframe.md 화면 매핑) |
| `docs/swagger.json` | OpenAPI 3.0.3 API 명세 |

- 각 문서 상단에 버전과 "기반 문서" 목록이 있다. 상위 문서(도메인 정의서 등)를 수정하면, 이를 인용하는 하위 문서들의 버전 라벨과 내용도 함께 점검·갱신할 것.
- 실제 구현 산출물(`backend/`)의 `seed.sql`, `.env.example`은 `docs/10-schema.sql`·`docs/11-plan.md`의 DB Task와 대응한다.
