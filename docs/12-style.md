# 프레시밀 포인트 이벤트 응모(freshmeal-point-event) UI 스타일 가이드

버전: v1.1 (2026-08-20)
기반 문서: `docs/8-wireframe.md` v1.3 (화면 레이아웃), `docs/6-project-principle.md` v1.3 (프론트엔드 디렉토리 구조)
참고 자료: 첨부된 스타벅스 앱 캡처 4종(홈, 리워드, 로그인, What's New 목록) — 실제 색상값은 캡처를 보고 눈대중으로 근사한 것이며 브랜드 자산을 그대로 복제하지 않는다.

## 1. 개요

- 목적: `docs/8-wireframe.md`가 정의한 화면 배치(ASCII)에 실제 색상·타이포그래피·컴포넌트 스타일을 입혀, FE-3(공용 컴포넌트 및 반응형 레이아웃) 이후 구현 작업의 시각적 기준을 제공한다.
- 범위: 색상 팔레트, 타이포그래피, 여백 스케일, 공통 컴포넌트(버튼/인풋/배지/카드/탭/진행바/하단 내비게이션) 스타일만 정의한다. 실제 컴포넌트 코드나 CSS 프레임워크 선택은 이 문서의 범위 밖이다(원칙 4번: 오버엔지니어링 금지, 지금 필요한 값만 정의).
- 톤앤매너: 따뜻한 뉴트럴 배경 위에 선명한 그린 포인트 컬러 하나로 강조하는 방식(캡처 공통 패턴). 회원 등급/포인트처럼 "성취감"을 주는 화면은 그라디언트 히어로 배경을, 로그인/목록처럼 기능 중심 화면은 흰 배경 + 미니멀한 라인 스타일을 사용한다.

## 2. 컬러 팔레트

| 토큰 | HEX | 용도 |
|---|---|---|
| `--color-primary` | `#00754A` | 포인트 컬러. 진행바 채움, 강조 텍스트(등급/포인트 수치), 주요 버튼 배경, 활성 탭 밑줄 |
| `--color-primary-dark` | `#00603C` | 버튼 눌림(active) 상태, 강조 텍스트의 어두운 변형 |
| `--color-primary-tint` | `#E3F3EC` | 초록 배지 배경, 연한 강조 영역 |
| `--color-accent-gold` | `#B99A5B` | 사용자 이름 등 개인화 강조 텍스트, Gold 등급 배지 배경 |
| `--color-hero-from` | `#FBD9C8` | 히어로/프로모 배너 그라디언트 시작(연한 살구색) |
| `--color-hero-to` | `#FDEDE4` | 히어로/프로모 배너 그라디언트 끝 |
| `--color-text-primary` | `#1A1A1A` | 본문/제목 텍스트 |
| `--color-text-secondary` | `#767676` | 설명/캡션/비활성 텍스트, placeholder |
| `--color-border` | `#E5E5E1` | 인풋 밑줄, 리스트 구분선, 카드 테두리 |
| `--color-surface` | `#FFFFFF` | 기본 배경 |
| `--color-surface-muted` | `#F5F5F3` | 정보성 배너/카드의 은은한 배경(진행바 트랙 포함) |
| `--color-track` | `#E0E0DC` | 진행바(progress bar)의 빈 트랙 |

- 강조는 항상 그린(`--color-primary`) 한 가지로 통일한다. 배지(Gold/Green 등급칩)처럼 예외적으로 골드가 필요한 곳 외에는 두 번째 강조색을 새로 만들지 않는다.
- 상태 배지(EventStatusBadge)는 팔레트를 재사용한다: `진행중` = `--color-primary` 배경 + 흰 텍스트, `예정` = `--color-surface-muted` 배경 + `--color-text-secondary` 텍스트, `종료` = `--color-border` 배경 + `--color-text-secondary` 텍스트(윤곽선만, 채도 낮게).

## 3. 타이포그래피

- 폰트: 시스템 기본 산세리프(`-apple-system, "Apple SD Gothic Neo", "Pretendard", sans-serif`). 별도 웹폰트 로드는 하지 않는다(오버엔지니어링 금지, 로딩 비용 없음).
- 굵기 스케일은 3단계만 쓴다: `regular(400)` / `semibold(600)` / `bold(700)`. 화면마다 제목은 항상 `bold`, 본문은 `regular`, 강조 수치·라벨은 `semibold` 이상.

| 스타일 토큰 | 크기 | 굵기 | 용도 (캡처 근거) |
|---|---|---|---|
| `--text-display` | 28px / line-height 1.3 | bold | 히어로 카피("○○님과 함께 Dream Away") |
| `--text-title` | 24px / 1.3 | bold | 화면 제목("Starbucks® Rewards", "로그인", "What's New") |
| `--text-section` | 19px / 1.4 | bold | 섹션 헤더("추천 메뉴", "멤버십 등급", "등급별 혜택") |
| `--text-stat` | 40px / 1.0 | bold | 강조 수치(포인트 "9 / 30★") — 정수부는 `--color-text-primary`, 단위/보조 숫자는 `--color-primary` |
| `--text-body` | 16px / 1.5 | regular | 본문, 리스트 타이틀, 인풋 값 |
| `--text-caption` | 13px / 1.4 | regular | 날짜, 보조 설명, placeholder |
| `--text-label` | 14px / 1.4 | semibold | 탭 라벨, 하단 내비게이션 라벨, 배지 텍스트 |

## 4. 여백/레이아웃

- 기준 스페이싱 단위: `4px` 배수(`4/8/12/16/24/32`). 화면 좌우 기본 패딩은 모바일 `20px`, 데스크탑 콘텐츠는 최대 폭 `960px`로 중앙 정렬(`docs/6-project-principle.md`의 반응형 원칙과 동일한 767px/768px 2단계 브레이크포인트를 그대로 따른다).
- 카드/리스트 아이템 사이 간격은 `12px`, 섹션과 섹션 사이는 `32px`.
- 모서리 둥글기: 버튼/배지/프로모 배너 = `24px`(알약형에 가깝게), 원형 썸네일 = `50%`, 리스트 썸네일/일반 카드 = `12px`.

## 5. 컴포넌트 스타일

### 5.1 버튼 (Button)
- **주요 버튼(고정형)**: 화면 하단에 고정, 좌우 폭 100%, 모서리 각짐(둥글기 없음), 배경 `--color-primary`, 텍스트 흰색 `--text-body` bold. 예: 로그인 화면의 "로그인하기".
- **알약형 버튼(Pill)**: 텍스트만큼만 폭을 차지, 모서리 둥글기 `24px`. 배경이 채워진 형(`Delivers` 배송 버튼)과 테두리만 있는 아웃라인형(`별 히스토리`, 배경 흰색 + `--color-primary` 테두리/텍스트) 두 종류만 쓴다.
- 버튼은 이 두 종류로 통일하고, 화면마다 새 버튼 스타일을 만들지 않는다.

### 5.2 인풋 (Input)
- 박스형 테두리를 쓰지 않고 밑줄(underline)만 사용한다: 기본 `1px solid --color-border`, 포커스 시 `2px solid --color-primary`.
- placeholder는 `--color-text-secondary`, 좌우 패딩 없이 텍스트가 화면 좌측 여백에 바로 붙는 미니멀한 형태(로그인 화면의 "아이디"/"비밀번호" 참고).

### 5.3 진행바 (Progress Bar) — PointBalanceBadge / UC-5 최대 응모 가능 횟수 표시에 재사용
- 트랙: 높이 `8px`, 배경 `--color-track`, 모서리 완전 둥글게(`pill`).
- 채움: 배경 `--color-primary`, 트랙과 동일한 둥글기, 채움 비율만큼 폭 조절.
- 채움 위/아래에 상태 문구(예: "Gold Level까지 21개의 별이 남았습니다")를 `--text-caption`으로 배치.

### 5.4 배지/칩 (Badge)
- 등급/상태 칩: 좌우 패딩 `8px`, 상하 `2px`, 모서리 둥글기 `6px`, `--text-label` 크기, 배경색은 등급/상태에 따라 팔레트의 tint 컬러 사용(2.의 EventStatusBadge 규칙 참조).
- 개인화 텍스트(사용자 이름)만 굵은 골드 컬러로 강조하고, 나머지 문장은 `--color-text-primary` 유지 — 문장 전체를 색칠하지 않는다(캡처의 "덥덥아이티님을 위한 추천 메뉴" 패턴).

### 5.5 탭 (Tab)
- **밑줄 탭(Underline Tab)**: 여러 서브메뉴 전환(예: "My Rewards / How it works")에 사용. 활성 탭은 `--color-text-primary` bold + 하단 `2px --color-text-primary` 밑줄, 비활성은 `--color-text-secondary`, 밑줄 없음.
- **구분선 탭(Divider Tab)**: 단순 필터 전환(예: "Welcome ¦ Green ¦ Gold")에 사용. 활성 항목만 `--color-primary` bold, 비활성은 `--color-text-secondary`, 항목 사이는 얇은 세로선(`|`)으로 구분.

### 5.6 리스트 아이템 (List Row) — EventCard, MyApplicationsPage 카드, What's New형 목록에 재사용
- 좌측 썸네일(정사각/원형 중 정보 성격에 따라 선택 — 메뉴 추천처럼 감성적인 이미지는 원형, What's New처럼 정보성 리스트는 모서리 둥근 사각형) + 우측 텍스트 블록(제목 `--text-body` bold, 보조정보 `--text-caption` gray) 구조를 기본으로 한다.
- 아이템 사이는 얇은 구분선(`1px --color-border`) 또는 `--color-surface-muted` 배경의 카드 형태 중 하나로 통일하고 화면 내에서 혼용하지 않는다.

### 5.7 히어로/프로모 배너 (Hero Banner)
- 배경: `--color-hero-from` → `--color-hero-to` 선형 그라디언트(위→아래), 위에 구름 등 은은한 장식 요소를 얹을 수 있으나 텍스트 가독성을 해치지 않는 저채도로 제한한다.
- 위에는 `--text-display` bold 카피, 아래로 진행바+수치 형태의 요약 정보를 배치한다(freshmeal의 이벤트 목록 상단 PointBalanceBadge 영역에 이 패턴을 적용할 수 있다).

### 5.8 하단 내비게이션 (Bottom Navigation)
- 아이콘(위) + 라벨(아래) 수직 배치, 5개 이하 항목. 활성 항목은 아이콘·라벨 모두 `--color-primary`, 비활성은 `--color-text-secondary`.
- 데스크탑(768px 이상)에서는 하단 고정 대신 상단 내비게이션으로 전환한다(`docs/6-project-principle.md`의 반응형 원칙, `docs/8-wireframe.md` 2.3절 데스크탑 뷰와 동일한 접근).

## 6. 화면 매핑 (참고)

| `docs/8-wireframe.md` 화면 | 적용할 스타일 |
|---|---|
| 2.1/2.2 회원가입·로그인 | 5.2 인풋(밑줄형) + 5.1 주요 버튼(하단 고정, 각진 풀폭) |
| 2.3 이벤트 목록 | 3.의 상태 배지 + 5.6 리스트 아이템(카드형) + 5.8 하단 내비게이션 |
| 이벤트 상세(UC-3~7) | 5.3 진행바(최대 응모 가능 횟수/미리보기) + 5.1 알약형 버튼(응모 확정) |
| 내 응모 내역(UC-8) | 5.6 리스트 아이템(카드형, 종료 이벤트 포함 시 상태 배지를 회색조로 표시) |
| 관리자 화면(UC-9~12) | 5.5 구분선 탭(상태 필터) + 5.6 리스트 아이템(표/리스트 겸용) |

## 7. 변경 이력

| 버전 | 일자 | 변경 내용 |
|---|---|---|
| v1.0 | 2026-08-20 | 초안 작성. 첨부된 스타벅스 앱 캡처 4종(홈/리워드/로그인/What's New)을 참고해 컬러 팔레트, 타이포그래피, 여백, 공통 컴포넌트(버튼/인풋/진행바/배지/탭/리스트/히어로/하단내비) 스타일 정의 및 `docs/8-wireframe.md` 화면과의 매핑표 작성 |
| v1.1 | 2026-08-20 | BE-1~BE-9 실제 구현 반영 정합성 재검토: 프론트엔드가 아직 미착수 상태라 본 문서 내용 자체는 변경 없음, 기반 문서 라벨만 구조 설계 원칙 v1.3으로 정정 |
