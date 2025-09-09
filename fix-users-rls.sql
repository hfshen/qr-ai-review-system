-- RLS 정책 수정 스크립트
-- Supabase SQL Editor에서 실행하세요

-- 기존 users 테이블 정책 삭제
drop policy if exists "Users can view their own profile" on users;
drop policy if exists "Users can update their own profile" on users;
drop policy if exists "Users can insert their own profile" on users;
drop policy if exists "Admins can view all users" on users;
drop policy if exists "Admins can update all users" on users;

-- 새로운 users 테이블 정책 생성 (무한 재귀 방지)
create policy "Users can view their own profile" on users
  for select using (auth.uid() = auth_id);

create policy "Users can update their own profile" on users
  for update using (auth.uid() = auth_id);

create policy "Users can insert their own profile" on users
  for insert with check (auth.uid() = auth_id);

-- 관리자 정책은 auth.users 테이블을 직접 사용하여 무한 재귀 방지
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
