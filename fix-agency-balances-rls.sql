-- agency_balances 테이블의 RLS 정책 수정

-- 1. 현재 RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'agency_balances';

-- 2. 에이전시 소유자가 자신의 에이전시 잔액을 조회할 수 있도록 정책 추가
DROP POLICY IF EXISTS "Agency owners can view their own balances" ON agency_balances;
CREATE POLICY "Agency owners can view their own balances" ON agency_balances
    FOR SELECT
    USING (agency_id IN (
        SELECT a.id FROM agencies a
        JOIN users u ON a.owner_id = u.id
        WHERE u.auth_id = auth.uid() 
        AND u.role = 'agency_owner'
    ));

-- 3. 관리자가 모든 에이전시 잔액을 조회할 수 있도록 정책 추가
DROP POLICY IF EXISTS "Admins can view all agency balances" ON agency_balances;
CREATE POLICY "Admins can view all agency balances" ON agency_balances
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE auth_id = auth.uid() 
        AND role = 'admin'
    ));

-- 4. 시스템이 에이전시 잔액을 관리할 수 있도록 정책 추가
DROP POLICY IF EXISTS "System can manage agency balances" ON agency_balances;
CREATE POLICY "System can manage agency balances" ON agency_balances
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. 생성된 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'agency_balances';
