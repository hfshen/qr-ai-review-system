-- 간단한 RLS 정책 수정 스크립트 (무한 재귀 방지)
-- Supabase SQL Editor에서 실행하세요

-- 기존 users 테이블 정책 모두 삭제
drop policy if exists "Users can view their own profile" on users;
drop policy if exists "Users can update their own profile" on users;
drop policy if exists "Users can insert their own profile" on users;
drop policy if exists "Admins can view all users" on users;
drop policy if exists "Admins can update all users" on users;
drop policy if exists "Allow all users to read profiles" on users;

-- 기본적인 users 테이블 정책만 생성
create policy "Users can view their own profile" on users
  for select using (auth.uid() = auth_id);

create policy "Users can update their own profile" on users
  for update using (auth.uid() = auth_id);

create policy "Users can insert their own profile" on users
  for insert with check (auth.uid() = auth_id);

-- 모든 사용자가 읽기 가능 (개발용 - 나중에 제거 가능)
create policy "Allow all users to read profiles" on users
  for select using (true);
