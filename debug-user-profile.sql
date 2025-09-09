-- 사용자 프로필 강제 생성 및 확인 스크립트
-- Supabase SQL Editor에서 실행하세요

-- 1. 현재 users 테이블의 모든 데이터 확인
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;

-- 2. auth.users 테이블과 비교 (인증된 사용자들)
SELECT 
  au.id as auth_id,
  au.email,
  au.created_at as auth_created_at,
  u.id as user_id,
  u.display_name,
  u.role,
  u.created_at as profile_created_at
FROM auth.users au
LEFT JOIN users u ON u.auth_id = au.id
ORDER BY au.created_at DESC;

-- 3. 특정 사용자 프로필 강제 생성 (auth_id를 실제 값으로 변경하세요)
-- INSERT INTO users (auth_id, email, display_name, role)
-- VALUES ('c7467824-ee7c-44d3-aee1-d10a764be00e', 'lolovely.ceo@gmail.com', 'Hongbeom Shin', 'admin')
-- ON CONFLICT (auth_id) DO UPDATE SET
--   email = EXCLUDED.email,
--   display_name = EXCLUDED.display_name,
--   role = EXCLUDED.role,
--   updated_at = NOW();
