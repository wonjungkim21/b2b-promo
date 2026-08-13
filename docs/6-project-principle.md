# 프레시밀 포인트 이벤트 응모(freshmeal-point-event) 구조 설계 원칙

버전: v1.2 (2026-08-13)
기반 문서: `docs/2-domain-definition.md` v1.5, `docs/3-usecase.md` v1.1, `docs/4-PRD.md` v1.4, `docs/5-user-scenario.md` v1.1

## 0. 이 문서의 목적

3일/1인 개발 바이브코딩 실습 MVP를 실제로 구현할 때 그대로 따라갈 수 있는 구조 설계 원칙을 정의한다. 엔터프라이즈급 아키텍처 이론이 아니라, 이 기간·인력 제약 안에서 "지킬 수 있는" 규칙만 담는다. 신규 추상화·레이어·설정값은 지금 필요할 때만 추가하고, "나중을 위해" 미리 만들지 않는다.

## 1. 최상위 원칙

1. **관심사 분리** — 화면(UI), 상태(전역/서버 상태), API 통신, 도메인 규칙, DB 접근을 서로 다른 레이어에 둔다. 한 파일/함수가 여러 관심사를 동시에 다루지 않는다.
2. **단일 책임** — 함수/모듈 하나는 한 가지 이유로만 바뀐다. 라우터는 요청/응답만, 서비스는 비즈니스 규칙만, DB 접근 코드는 쿼리만 책임진다.
3. **도메인 규칙은 한 곳에** — 도메인 정의서 5장(5.1~5.9)의 규칙은 백엔드 서비스 레이어에만 존재한다. 프론트엔드는 이 규칙을 복제하지 않고 서버 응답을 그대로 신뢰하며, 사용자 경험을 위한 사전 검증(미리보기 등)만 별도로 가볍게 수행한다(2.1 참조).
4. **3일/1인 개발 실용주의** — 지금 이 MVP 범위(PRD 4~6장, 도메인 정의서 6장)에 없는 기능을 위한 확장 포인트(인터페이스, 플러그인 구조, 설정 테이블 등)를 만들지 않는다. 필요해지면 그때 추가한다(YAGNI).
5. **1개 구현만 필요하면 추상화하지 않는다** — DB 드라이버는 pg 하나만 쓰므로 Repository 인터페이스/ORM 추상 레이어를 두지 않는다. 쿼리 함수를 직접 호출한다.
6. **오류는 있는 그대로 실패한다** — 방어적으로 모든 경우의 수를 미리 처리하려 하지 말고, 도메인 정의서 5장에 명시된 예외만 명시적으로 처리한다. 명시되지 않은 예외는 공통 에러 핸들러(5장 참조)가 500으로 처리한다.

## 2. 의존성/레이어 원칙

### 2.1 프론트엔드 레이어와 의존 방향

```
화면(Pages/Components) → 서버 상태 훅(TanStack Query) → API 클라이언트(axios/fetch 래퍼) → 백엔드
화면(Pages/Components) → 전역 상태(Zustand store)
```

- 화면 컴포넌트는 API를 직접 호출하지 않는다. 반드시 TanStack Query 훅(`useEventList`, `useApplyEvent` 등)을 통해서만 서버 데이터에 접근한다.
- Zustand는 **서버에서 온 데이터의 캐시 용도로 쓰지 않는다.** 서버 상태(이벤트 목록, 포인트 잔액, 응모 내역 등)는 전부 TanStack Query가 관리한다. Zustand는 로그인 토큰, UI 상태(모달 열림 등) 등 순수 클라이언트 상태만 담당한다.
- 응모 횟수 미리보기(UC-6, 사용 예정 포인트/잔여 포인트 계산)처럼 서버 왕복 없이 즉시 보여줘야 하는 값은 화면 컴포넌트 또는 작은 유틸 함수에서 클라이언트 계산으로 처리하되, 이 계산 결과는 참고용 미리보기일 뿐이며 실제 차감 여부·최종 값은 항상 서버(UC-7 응모 확정 API)가 재검증한다(5.2, 5.3 규칙은 서버가 최종 판단).

### 2.2 백엔드 레이어와 의존 방향

```
Router → Controller → Service → DB 접근 함수(Query) → pg Pool
                ↑
          도메인 규칙(5.1~5.9)은 Service에만 위치
```

- **Router**: URL/HTTP 메서드와 Controller 함수를 연결만 한다. 로직 없음.
- **Controller**: 요청(req)에서 값을 꺼내 검증(형식 검증만, 예: 타입/필수값)하고 Service를 호출한 뒤 응답(res)을 만든다. 비즈니스 규칙 판단은 하지 않는다.
- **Service**: 도메인 정의서 5장의 모든 비즈니스 규칙이 위치하는 유일한 레이어.
  - 5.1(상태 제약), 5.2(포인트 부족/불변식), 5.3(응모 횟수 유효성), 5.4(누적 응모) 판단은 Service 함수 안에서 수행한다.
  - 5.7(트랜잭션 원자성): pointBalance 차감·PointTransaction 생성·EventApplication 갱신은 Service 함수 하나가 pg 트랜잭션(`BEGIN`/`COMMIT`/`ROLLBACK`)으로 묶어 처리한다. Query 레이어는 트랜잭션 경계를 모르며, Service가 넘겨준 커넥션/클라이언트로만 쿼리를 실행한다.
  - 5.8(멱등성): idempotencyKey 중복 여부 확인 및 기존 결과 반환도 같은 트랜잭션 안에서 Service가 처리한다(유니크 제약 위반을 Service가 감지해 기존 PointTransaction을 조회·반환).
  - 5.9(동시 요청): `SELECT ... FOR UPDATE`로 User row(및 필요 시 EventApplication row)를 잠그는 처리도 Service의 트랜잭션 함수 안에 위치한다. 별도의 락 매니저나 큐 시스템은 만들지 않는다(PRD 10장 리스크 참조, row lock만으로 결과 기준 충족).
- **Query(DB 접근)**: 순수 SQL 실행 함수만 둔다. `pg` 드라이버를 직접 사용하며 ORM을 두지 않는다(PRD 7장). 하나의 함수는 하나의 SQL 문(또는 트랜잭션 내 한 단계)만 담당한다.
- 의존 방향은 위에서 아래로만 흐른다. 역방향 호출(예: Query가 Service를 호출) 금지. Controller가 Query를 직접 호출하는 것도 금지(항상 Service를 거친다).

### 2.3 도메인 규칙과 인프라 코드의 분리

- JWT 검증, CORS, 요청 로깅, 에러 핸들링 같은 인프라 코드는 Express 미들웨어로 분리하고 Service/Query 코드에 섞지 않는다.
- 도메인 상수(1,000포인트 = 응모 1회, 이벤트 status 3종 등)는 Service 레이어 내 상수 모듈 하나(`domain/constants.js` 등)에 모아두고 하드코딩을 흩뿌리지 않는다.

## 3. 코드/네이밍 원칙

- **엔티티명**: 도메인 정의서 3장과 동일하게 `User`, `Event`, `EventApplication`, `PointTransaction`을 그대로 사용한다(축약/별칭 금지).
- **JS/TS 변수·함수명**: 카멜케이스(`pointBalance`, `applyToEvent`, `getEventDetail`).
- **DB 테이블/컬럼명**: 스네이크케이스(`users`, `event_applications`, `point_transactions`, `point_balance`, `total_count`, `idempotency_key`). 테이블명은 엔티티의 복수형 스네이크케이스로 통일한다.
- **파일명**: 백엔드는 레이어 접미사를 붙인다 — `event.router.js`, `event.controller.js`, `event.service.js`, `event.queries.js`. 프론트엔드 컴포넌트는 파스칼케이스(`EventDetailPage.tsx`), 훅은 `use` 접두사 카멜케이스(`useEventDetail.ts`).
- **API 엔드포인트**: 케밥/소문자 복수형 REST 경로(`/api/events`, `/api/events/:id/applications`, `/api/me/applications`). 유스케이스 번호(UC-n)는 코드 주석/커밋 메시지에서 트레이스 태그로만 인용하고 경로명에는 넣지 않는다.
- **불리언 변수**: `is`/`has` 접두사(`isApplyEnabled`).
- 도메인 규칙을 구현하는 코드에는 관련 규칙 번호를 주석으로 남긴다. 예: `// 5.2 포인트 부족 검증`, `// 5.9 row lock`.

## 4. 테스트/품질 원칙

3일/1인 개발이므로 전체 커버리지를 목표로 하지 않는다. 아래 범위만 테스트하고 나머지는 수동 확인으로 충분하다.

- **반드시 자동 테스트**: UC-7 응모 확정 Service 함수 하나.
  - 정상 응모(5.4 누적 갱신 포함)
  - 포인트 부족 거부(5.2)
  - 진행중이 아닌 이벤트 응모 거부(5.1)
  - 잘못된 응모 횟수 거부(5.3)
  - 동일 idempotencyKey 재요청 시 재차감 없음(5.8)
  - (가능하면) 동시 요청 2건을 병렬로 호출해 pointBalance가 음수가 되지 않고 순차 처리와 동일한 결과가 나오는지(5.9) 최소 1개 시나리오
- **선택**: 이벤트 상태 전이 검증(UC-11, 역방향/건너뛰기 금지) 단위 테스트.
- **테스트 안 함**: UI 컴포넌트 스냅샷, 단순 CRUD(이벤트 등록/조회) 해피패스, 로그인/회원가입의 정상 케이스 등은 수동 확인으로 대체하고 자동 테스트를 강제하지 않는다.
- 테스트 프레임워크는 이미 선택한 스택 외 새 도구를 들이지 않는다(예: 백엔드는 Node 내장 `node:test` 또는 최소 설정의 Jest 중 하나만 선택해 고정).

## 5. 설정/보안/운영 원칙

- **환경변수**: DB 접속정보, JWT 시크릿(Access/Refresh 각각), 포트, CORS 허용 origin은 `.env`로 관리하고 저장소에 커밋하지 않는다(`.env.example`만 커밋). `process.env` 접근은 앱 시작 시 하나의 설정 모듈(`config.js`)에서 읽어 검증하고, 나머지 코드는 이 모듈만 참조한다.
- **JWT**: Access Token 만료는 짧게(예: 15~30분), Refresh Token은 길게(예: 7~14일) 설정하고 시크릿은 서로 다른 값을 사용한다. Refresh Token은 DB(User와 연결된 별도 컬럼 또는 테이블)에 저장해 로그아웃 시 폐기할 수 있게 한다(PRD 10장 리스크 반영). 구체적 만료 시간 값은 구현 시 상수 하나로 고정한다.
- **CORS**: 프론트엔드 개발/배포 origin만 허용 목록에 명시한다. `*` 와일드카드는 쓰지 않는다.
- **에러 핸들링**: Express 공통 에러 핸들러 미들웨어 하나로 통일한다. 도메인 규칙 위반(5.1~5.3 등)은 Service가 명시적 에러 타입/코드로 던지고, 공통 핸들러가 이를 받아 4xx + 사용자 메시지로 변환한다. 그 외 예기치 못한 에러는 500과 일반 메시지로 응답하고 서버 로그에는 상세 스택을 남긴다.
- **로깅**: 요청 단위 로그(메서드/경로/상태코드/응답시간) 1줄과, 에러 발생 시 스택 트레이스만 남긴다. 별도 로깅 인프라(ELK 등)는 도입하지 않고 콘솔 출력으로 충분하다.
- **비밀번호**: bcrypt 등으로 해시 저장(평문 저장 금지). 별도 정책(복잡도 규칙 등)은 MVP 범위에서 강제하지 않는다.

## 6. 프론트엔드 디렉토리 구조 (React 19 + Zustand + TanStack Query)

```
frontend/
├─ src/
│  ├─ main.tsx                  # 앱 진입점, QueryClientProvider 설정
│  ├─ App.tsx                   # 라우터 정의
│  ├─ pages/                    # 화면 단위 (PRD 4.1 화면 목록과 1:1 대응)
│  │  ├─ SignupPage.tsx         # UC-0
│  │  ├─ LoginPage.tsx          # UC-1
│  │  ├─ EventListPage.tsx      # UC-2
│  │  ├─ EventDetailPage.tsx    # UC-3~7 (상세/포인트/응모)
│  │  ├─ MyApplicationsPage.tsx # UC-8
│  │  └─ admin/
│  │     ├─ AdminEventListPage.tsx    # UC-9 목록 진입점
│  │     ├─ AdminEventFormPage.tsx    # UC-9/UC-10 등록·수정 공용
│  │     └─ AdminEventStatsPage.tsx   # UC-12
│  ├─ components/               # 여러 화면에서 재사용하는 UI 조각
│  │  ├─ PointBalanceBadge.tsx  # UC-4 공통 노출 영역
│  │  ├─ EventCard.tsx
│  │  └─ EventStatusBadge.tsx
│  ├─ features/                 # 도메인 단위 API 훅 + 클라이언트 타입
│  │  ├─ auth/
│  │  │  ├─ useLogin.ts         # TanStack Query mutation
│  │  │  └─ authApi.ts          # fetch 함수
│  │  ├─ events/
│  │  │  ├─ useEventList.ts
│  │  │  ├─ useEventDetail.ts
│  │  │  ├─ useApplyEvent.ts    # UC-7 mutation (멱등키 생성 포함)
│  │  │  └─ eventsApi.ts
│  │  └─ applications/
│  │     ├─ useMyApplications.ts
│  │     └─ applicationsApi.ts
│  ├─ stores/                   # Zustand: 클라이언트 상태만
│  │  └─ authStore.ts           # accessToken, currentUser role 등
│  ├─ lib/
│  │  ├─ apiClient.ts           # axios/fetch 공통 설정(baseURL, 인터셉터)
│  │  └─ queryClient.ts
│  └─ utils/
│     └─ pointCalc.ts           # 응모 횟수 미리보기 계산(UC-6, 서버 재검증 전제)
├─ .env.example
└─ package.json
```

## 7. 백엔드 디렉토리 구조 (Node.js + Express + pg, ORM 미사용)

```
backend/
├─ src/
│  ├─ index.js                  # 서버 부트스트랩
│  ├─ app.js                    # Express 앱 설정(미들웨어 등록)
│  ├─ config/
│  │  └─ config.js              # 환경변수 로드/검증
│  ├─ db/
│  │  └─ pool.js                # pg Pool 인스턴스 (단일 커넥션 풀)
│  ├─ middlewares/
│  │  ├─ auth.middleware.js     # JWT 검증
│  │  ├─ error.middleware.js    # 공통 에러 핸들러
│  │  └─ cors.middleware.js
│  ├─ domain/
│  │  ├─ constants.js           # POINTS_PER_APPLY=1000, EVENT_STATUS 등
│  │  └─ errors.js              # 도메인 에러 클래스(InsufficientPointsError 등)
│  ├─ auth/
│  │  ├─ auth.router.js         # UC-0, UC-1
│  │  ├─ auth.controller.js
│  │  ├─ auth.service.js
│  │  └─ auth.queries.js
│  ├─ users/
│  │  ├─ users.router.js        # UC-4 (내 포인트 조회)
│  │  ├─ users.controller.js
│  │  ├─ users.service.js
│  │  └─ users.queries.js
│  ├─ events/
│  │  ├─ events.router.js       # UC-2, UC-3, UC-9~11
│  │  ├─ events.controller.js
│  │  ├─ events.service.js      # 5.1, 3.2 상태전이 규칙
│  │  └─ events.queries.js
│  ├─ applications/
│  │  ├─ applications.router.js       # UC-5~8, UC-12
│  │  ├─ applications.controller.js
│  │  ├─ applications.service.js      # 5.2~5.9 핵심 트랜잭션 로직
│  │  └─ applications.queries.js      # EventApplication/PointTransaction 쿼리
│  └─ tests/
│     └─ applications.service.test.js # 4장 필수 테스트 항목
├─ .env.example
└─ package.json
```

- `applications.service.js`가 이 프로젝트에서 가장 중요한 파일이다. UC-7 응모 확정의 5.1~5.9 규칙 전부가 여기 모인다.
- 각 도메인 폴더(`events/`, `applications/` 등)는 router→controller→service→queries 4파일 패턴을 동일하게 반복한다. 폴더 구조 자체가 2장의 레이어 원칙을 강제한다.

## 8. 변경 이력

| 버전 | 일자 | 변경 내용 |
|---|---|---|
| v1.0 | 2026-08-13 | 초안 작성 (docs/2-domain-definition.md, docs/3-usecase.md, docs/4-PRD.md, docs/5-user-scenario.md 기반 최상위 원칙/레이어 원칙/네이밍/테스트/설정·보안/프론트·백엔드 디렉토리 구조) |
| v1.1 | 2026-08-13 | docs 전체 정합성 검토 반영: 1장의 잘못된 절 참조("3장 참조" → "2.1 참조") 수정 |
| v1.2 | 2026-08-13 | docs 전체 정합성 재검토 반영: 기반 문서 라벨을 도메인 정의서 v1.5, PRD v1.4, 사용자시나리오 v1.1로 정정 |
