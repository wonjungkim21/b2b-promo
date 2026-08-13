-- freshmeal-point-event 개발용 시드 데이터
-- 기반 문서: docs/11-plan.md DB-2, docs/10-schema.sql
-- 반복 실행 가능: 상단에서 5개 테이블을 초기화(TRUNCATE ... RESTART IDENTITY CASCADE)한 뒤 새로 채운다.
-- 비밀번호는 pgcrypto의 bcrypt(bf)로 해시하여 저장한다. 모든 계정의 평문 비밀번호는 "password123"이다.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

TRUNCATE TABLE refresh_tokens, point_transactions, event_applications, events, users
    RESTART IDENTITY CASCADE;

-- =========================================================
-- users: 관리자 1명 + 사용자 3명 (포인트 부족/충분 케이스 재현)
-- =========================================================
INSERT INTO users (name, login_id, password_hash, role, point_balance) VALUES
    ('관리자', 'admin@freshmeal.test',   crypt('password123', gen_salt('bf')), 'admin', 0),
    ('김부족', 'user-low@freshmeal.test', crypt('password123', gen_salt('bf')), 'user',  800),   -- 1,000 미만: 응모 불가 케이스(도메인 5.2, 시나리오 3.6-2)
    ('이보통', 'user-mid@freshmeal.test', crypt('password123', gen_salt('bf')), 'user',  2000),  -- 2회 응모 가능
    ('박풍족', 'user-high@freshmeal.test',crypt('password123', gen_salt('bf')), 'user',  5500);  -- 5회 응모 가능(도메인 예시와 동일 값)

-- =========================================================
-- events: 예정/진행중/종료 각 1건 이상
-- =========================================================
INSERT INTO events (title, image_url, start_at, end_at, prize_description, status) VALUES
    ('여름 특가 이벤트',   NULL, now() - interval '5 days',  now() + interval '10 days', '스타벅스 기프티콘', '진행중'),
    ('재구매 포인트 2배', NULL, now() - interval '1 days',  now() + interval '5 days',  NULL,               '진행중'),
    ('가을 신메뉴 이벤트', NULL, now() + interval '10 days', now() + interval '20 days', '신메뉴 시식권',     '예정'),
    ('봄맞이 이벤트',     NULL, now() - interval '60 days', now() - interval '30 days', '봄맞이 할인쿠폰',   '종료');

COMMIT;
