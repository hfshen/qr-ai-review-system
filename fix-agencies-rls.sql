-- agencies 테이블의 RLS 정책 확인 및 수정

-- 1. 현재 RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'agencies';

-- 2. agencies 테이블의 RLS 상태 확인
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'agencies';

-- 3. 에이전시 소유자가 자신의 에이전시를 조회할 수 있도록 정책 추가
DROP POLICY IF EXISTS "Agency owners can view their own agencies" ON agencies;
CREATE POLICY "Agency owners can view their own agencies" ON agencies
    FOR SELECT
    USING (owner_id IN (
        SELECT id FROM users 
        WHERE auth_id = auth.uid() 
        AND role = 'agency_owner'
    ));

-- 4. 에이전시 소유자가 자신의 에이전시를 생성할 수 있도록 정책 추가
DROP POLICY IF EXISTS "Agency owners can create their own agencies" ON agencies;
CREATE POLICY "Agency owners can create their own agencies" ON agencies
    FOR INSERT
    WITH CHECK (owner_id IN (
        SELECT id FROM users 
        WHERE auth_id = auth.uid() 
        AND role = 'agency_owner'
    ));

-- 5. 관리자가 모든 에이전시를 조회할 수 있도록 정책 추가
DROP POLICY IF EXISTS "Admins can view all agencies" ON agencies;
CREATE POLICY "Admins can view all agencies" ON agencies
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE auth_id = auth.uid() 
        AND role = 'admin'
    ));

-- 6. 생성된 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'agencies';
