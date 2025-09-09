-- 데이터베이스 완전 수정 스크립트
-- Supabase SQL Editor에서 실행하세요

-- 1. users 테이블에 points_balance 컬럼 추가
alter table users add column if not exists points_balance integer default 0;

-- 2. 기존 사용자들의 포인트를 0으로 초기화
update users set points_balance = 0 where points_balance is null;

-- 3. auth_id에 unique constraint 추가 (ON CONFLICT를 위해 필요)
-- 먼저 기존 constraint가 있는지 확인하고 없으면 추가
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

-- 5. 새로운 RLS 정책 생성
create policy "Users can view their own profile" on users
  for select using (auth.uid() = auth_id);

create policy "Users can update their own profile" on users
  for update using (auth.uid() = auth_id);

create policy "Users can insert their own profile" on users
  for insert with check (auth.uid() = auth_id);

-- 6. 개발용 정책 (모든 사용자가 읽기 가능)
create policy "Allow all users to read profiles" on users
  for select using (true);

-- 7. 관리자 정책 (auth.users 테이블 직접 사용으로 무한 재귀 방지)
create policy "Admins can view all users" on users
  for select using (
    exists (
      select 1 from auth.users 
      where id = auth.uid() 
      and raw_user_meta_data->>'role' = 'admin'
    )
  );

create policy "Admins can update all users" on users
  for update using (
    exists (
      select 1 from auth.users 
      where id = auth.uid() 
      and raw_user_meta_data->>'role' = 'admin'
    )
  );
