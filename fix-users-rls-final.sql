-- 완전히 새로운 RLS 정책으로 교체
-- Supabase SQL Editor에서 실행하세요

-- 기존 모든 정책 삭제
drop policy if exists "Users can view their own profile" on users;
drop policy if exists "Users can update their own profile" on users;
drop policy if exists "Users can insert their own profile" on users;
drop policy if exists "Admins can view all users" on users;
drop policy if exists "Admins can update all users" on users;
drop policy if exists "Allow all users to read profiles" on users;
drop policy if exists "Allow auth_id based queries" on users;
drop policy if exists "Allow auth_id based updates" on users;

-- 새로운 간단한 정책들
-- 1. 모든 인증된 사용자가 모든 사용자 프로필을 읽을 수 있음 (개발용)
create policy "Allow authenticated users to read all profiles" on users
  for select using (auth.role() = 'authenticated');

-- 2. 사용자는 자신의 프로필만 업데이트 가능
create policy "Users can update their own profile" on users
  for update using (auth.uid() = auth_id);

-- 3. 사용자는 자신의 프로필만 삽입 가능
create policy "Users can insert their own profile" on users
  for insert with check (auth.uid() = auth_id);

-- 4. 관리자는 모든 사용자 업데이트 가능
create policy "Admins can update all users" on users
  for update using (
    exists (
      select 1 from users 
      where auth_id = auth.uid() 
      and role = 'admin'
    )
  );
