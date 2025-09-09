-- RLS 완전 비활성화 및 정책 정리
-- Supabase SQL Editor에서 실행하세요

-- 1. users 테이블의 RLS 완전 비활성화
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. 기존 모든 정책 삭제
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Allow all users to read profiles" ON users;
DROP POLICY IF EXISTS "Allow auth_id based queries" ON users;
DROP POLICY IF EXISTS "Allow auth_id based updates" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to read all profiles" ON users;

-- 3. RLS 상태 확인
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- 4. 현재 사용자 프로필 확인
SELECT 
  auth_id,
  email,
  display_name,
  role,
  created_at
FROM users 
ORDER BY created_at DESC;
