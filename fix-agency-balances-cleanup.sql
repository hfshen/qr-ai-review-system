-- agency_balances 테이블의 중복 RLS 정책 정리

-- 1. 모든 기존 정책 삭제
DROP POLICY IF EXISTS "Admins can view all agency balances" ON agency_balances;
DROP POLICY IF EXISTS "Agency owners can view balances" ON agency_balances;
DROP POLICY IF EXISTS "Agency owners can view their own balances" ON agency_balances;
DROP POLICY IF EXISTS "System can manage agency balances" ON agency_balances;
DROP POLICY IF EXISTS "Users can view their own agency balance" ON agency_balances;

-- 2. 올바른 정책만 다시 생성

-- 에이전시 소유자가 자신의 에이전시 잔액을 조회할 수 있도록 정책
CREATE POLICY "Agency owners can view their own balances" ON agency_balances
    FOR SELECT
    USING (agency_id IN (
        SELECT a.id FROM agencies a
        JOIN users u ON a.owner_id = u.id
        WHERE u.auth_id = auth.uid() 
        AND u.role = 'agency_owner'
    ));

-- 관리자가 모든 에이전시 잔액을 조회할 수 있도록 정책
CREATE POLICY "Admins can view all agency balances" ON agency_balances
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE auth_id = auth.uid() 
        AND role = 'admin'
    ));

-- 시스템이 에이전시 잔액을 관리할 수 있도록 정책 (INSERT, UPDATE, DELETE)
CREATE POLICY "System can manage agency balances" ON agency_balances
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 3. 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'agency_balances'
ORDER BY policyname;
