-- freshmeal-point-event DDL (PostgreSQL 17)
-- 버전: v1.0 (2026-08-13)
-- 기반 문서: docs/9-erd.md v1.0 (docs/2-domain-definition.md v1.4, docs/4-PRD.md v1.2)
-- ORM 미사용, pg 드라이버로 직접 실행하는 것을 전제로 작성 (docs/6-project-principle.md)

BEGIN;

-- =========================================================
-- users (도메인 3.1)
-- =========================================================
CREATE TABLE users (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    login_id      VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(10)  NOT NULL,
    point_balance BIGINT       NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_users_login_id UNIQUE (login_id),
    CONSTRAINT ck_users_role CHECK (role IN ('user', 'admin')),
    -- 도메인 5.2: pointBalance는 항상 0 이상이어야 한다.
    CONSTRAINT ck_users_point_balance_non_negative CHECK (point_balance >= 0)
);

-- =========================================================
-- events (도메인 3.2)
-- =========================================================
CREATE TABLE events (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title            VARCHAR(200) NOT NULL,
    image_url        VARCHAR(500),
    start_at         TIMESTAMPTZ  NOT NULL,
    end_at           TIMESTAMPTZ  NOT NULL,
    prize_description TEXT,
    status           VARCHAR(10)  NOT NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT ck_events_status CHECK (status IN ('예정', '진행중', '종료')),
    -- 도메인 3.2: 종료일시는 시작일시보다 이후여야 한다.
    CONSTRAINT ck_events_period CHECK (end_at > start_at)
);

-- 사용자 이벤트 목록 조회(UC-2)는 status 기준으로 자주 필터링된다.
CREATE INDEX idx_events_status ON events (status);

-- =========================================================
-- event_applications (도메인 3.3)
-- =========================================================
CREATE TABLE event_applications (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id           BIGINT      NOT NULL REFERENCES users (id),
    event_id          BIGINT      NOT NULL REFERENCES events (id),
    total_count       INT         NOT NULL DEFAULT 0,
    total_points_used BIGINT      NOT NULL DEFAULT 0,
    last_applied_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- 도메인 3.3/5.4: User-Event 조합당 레코드는 1건만 존재하며, 재응모 시 누적 갱신한다.
    CONSTRAINT uq_event_applications_user_event UNIQUE (user_id, event_id),
    CONSTRAINT ck_event_applications_total_count_positive CHECK (total_count >= 0),
    CONSTRAINT ck_event_applications_total_points_non_negative CHECK (total_points_used >= 0)
);

CREATE INDEX idx_event_applications_user_id ON event_applications (user_id);
CREATE INDEX idx_event_applications_event_id ON event_applications (event_id);

-- =========================================================
-- point_transactions (도메인 3.4)
-- =========================================================
CREATE TABLE point_transactions (
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id               BIGINT      NOT NULL REFERENCES users (id),
    event_id              BIGINT      REFERENCES events (id),
    event_application_id  BIGINT      REFERENCES event_applications (id),
    amount                BIGINT      NOT NULL,
    type                  VARCHAR(20) NOT NULL,
    idempotency_key       VARCHAR(255) NOT NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- 도메인 5.8: 동일 요청 재시도 시 중복 차감 방지.
    CONSTRAINT uq_point_transactions_idempotency_key UNIQUE (idempotency_key),
    -- 도메인 3.4: amount는 항상 양수로 기록(증감 방향은 type으로 판단).
    CONSTRAINT ck_point_transactions_amount_positive CHECK (amount > 0),
    CONSTRAINT ck_point_transactions_type CHECK (type IN ('EVENT_APPLY'))
);

CREATE INDEX idx_point_transactions_user_id ON point_transactions (user_id);

-- =========================================================
-- refresh_tokens (PRD 7장 JWT 인증, 도메인 정의서 범위 밖)
-- =========================================================
CREATE TABLE refresh_tokens (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_refresh_tokens_token_hash UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);

COMMIT;
