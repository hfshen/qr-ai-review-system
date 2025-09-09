-- users 테이블에 points_balance 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

-- points_balance 컬럼 추가
alter table users add column if not exists points_balance integer default 0;

-- 기존 사용자들의 포인트를 0으로 초기화
update users set points_balance = 0 where points_balance is null;
