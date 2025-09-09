-- 간단한 RLS 정책 설정 (개발용)
-- Supabase SQL Editor에서 실행하세요

-- 1. users 테이블에 points_balance 컬럼 추가
alter table users add column if not exists points_balance integer default 0;

-- 2. 기존 사용자들의 포인트를 0으로 초기화
update users set points_balance = 0 where points_balance is null;

-- 3. auth_id에 unique constraint 추가
do $$
begin
    if not exists (
        select 1 from information_schema.table_constraints 
        where constraint_name = 'users_auth_id_unique' 
        and table_name = 'users'
    ) then
        alter table users add constraint users_auth_id_unique unique (auth_id);
    end if;
end $$;

-- 4. 모든 기존 users 테이블 정책 삭제
do $$
declare
    pol record;
begin
    for pol in 
        select policyname 
        from pg_policies 
        where tablename = 'users' 
        and schemaname = 'public'
    loop
        execute format('drop policy if exists %I on users', pol.policyname);
    end loop;
end $$;

-- 5. 간단한 RLS 정책 생성 (개발용 - 모든 작업 허용)
create policy "Allow all operations on users" on users
  for all using (true) with check (true);

-- 6. RLS 활성화 확인
alter table users enable row level security;
