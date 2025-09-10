-- 에이전시 소유자에게 에이전시 생성
-- 사용자 ID를 확인하고 해당 사용자에게 에이전시 생성

-- 1. 먼저 해당 사용자의 ID를 확인
SELECT id, email, display_name, role 
FROM users 
WHERE email = 'shinfamily2023@gmail.com';

-- 2. 해당 사용자에게 에이전시 생성 (위 쿼리 결과의 id를 사용)
INSERT INTO agencies (owner_id, name, description, created_at)
SELECT 
    id as owner_id,
    display_name || '의 에이전시' as name,
    '자동 생성된 에이전시입니다.' as description,
    NOW() as created_at
FROM users 
WHERE email = 'shinfamily2023@gmail.com' 
AND role = 'agency_owner'
AND NOT EXISTS (
    SELECT 1 FROM agencies WHERE owner_id = users.id
);

-- 3. 생성된 에이전시 확인
SELECT a.*, u.email, u.display_name 
FROM agencies a
JOIN users u ON a.owner_id = u.id
WHERE u.email = 'shinfamily2023@gmail.com';
