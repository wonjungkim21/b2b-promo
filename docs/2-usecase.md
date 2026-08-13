# freshmeal-point-event Use Case Diagram

`docs/2-domain-definition.md`의 2장(핵심 액터), 3장(핵심 도메인 엔티티), 4장(유스케이스 목록)을 기반으로 작성한 유스케이스 다이어그램이다.

- 액터: 사용자(User), 관리자(Admin) — 2장
- 유스케이스: UC-0~UC-12 — 4장 (괄호 안은 관련 핵심 엔티티, 3장)
- 두 액터 모두 인증(로그인) 후에만 시스템을 이용할 수 있다(2장).

```mermaid
flowchart LR
    User(("사용자"))
    Admin(("관리자"))

    subgraph SYS["freshmeal-point-event"]
        UC1(["UC-1 로그인/인증"])

        subgraph UserUC["사용자 기능"]
            UC0(["UC-0 회원가입<br/>(User)"])
            UC2(["UC-2 진행중/예정 이벤트 목록 조회<br/>(Event)"])
            UC3(["UC-3 이벤트 상세 조회<br/>(Event)"])
            UC4(["UC-4 보유 포인트 조회<br/>(User.pointBalance)"])
            UC5(["UC-5 응모 가능 횟수 확인<br/>(User.pointBalance)"])
            UC6(["UC-6 응모 횟수 선택 및<br/>사용/잔여 포인트 미리보기"])
            UC7(["UC-7 응모 확정<br/>(EventApplication, PointTransaction)"])
            UC8(["UC-8 내 응모 내역 조회<br/>(EventApplication)"])
        end

        subgraph AdminUC["관리자 기능"]
            UC9(["UC-9 이벤트 등록<br/>(Event)"])
            UC10(["UC-10 이벤트 수정<br/>(Event)"])
            UC11(["UC-11 이벤트 상태 변경<br/>(Event.status)"])
            UC12(["UC-12 이벤트별 응모 현황 조회<br/>(EventApplication)"])
        end
    end

    User --> UC0
    User --> UC1
    Admin --> UC1

    UC0 -. precedes .-> UC1

    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8

    Admin --> UC9
    Admin --> UC10
    Admin --> UC11
    Admin --> UC12

    UC2 -. include .-> UC3
    UC5 -. include .-> UC4
    UC6 -. include .-> UC5
    UC7 -. include .-> UC6
    UC10 -. include .-> UC9
```

## 참고

- UC-7(응모 확정)은 3장 EventApplication/PointTransaction 엔티티 갱신과 직결되며, 도메인 정의서 5.1/5.2/5.3/5.7/5.8/5.9 규칙의 적용을 받는다.
- UC-9/UC-10(이벤트 등록/수정)은 동일한 Event 필수/선택 필드 유효성 규칙(3.2)을 공유한다.
