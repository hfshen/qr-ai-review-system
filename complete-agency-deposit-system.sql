-- 에이전시 포인트 충전 시스템 완성
-- 필요한 테이블들과 트리거, RLS 정책 생성

-- 1. 에이전시 포인트 잔액 테이블
CREATE TABLE IF NOT EXISTS agency_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points_balance INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agency_id)
);

-- 2. 에이전시 포인트 충전 내역 테이블
CREATE TABLE IF NOT EXISTS agency_deposits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deposit_amount INTEGER NOT NULL, -- 충전 금액 (원)
    base_points INTEGER NOT NULL, -- 기본 포인트 (충전 금액과 동일)
    bonus_points INTEGER NOT NULL DEFAULT 0, -- 보너스 포인트
    total_points INTEGER NOT NULL, -- 총 포인트 (기본 + 보너스)
    payment_method VARCHAR(50) DEFAULT 'card', -- 결제 방법
    payment_status VARCHAR(20) DEFAULT 'completed', -- 결제 상태
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 포인트 거래 내역 테이블 (기존 확장)
CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES users(id) ON DELETE CASCADE,
    review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
    platform_id INTEGER REFERENCES platforms(id) ON DELETE SET NULL,
    points INTEGER NOT NULL, -- 양수: 획득, 음수: 사용
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('reward', 'purchase', 'agency_deposit', 'admin_adjust', 'refund')),
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 사용자 포인트 잔액 테이블
CREATE TABLE IF NOT EXISTS user_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 5. 에이전시 포인트 충전 시 잔액 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_agency_balance_on_deposit()
RETURNS TRIGGER AS $$
BEGIN
    -- 에이전시 잔액 업데이트 또는 생성
    INSERT INTO agency_balances (agency_id, points_balance)
    VALUES (NEW.agency_id, NEW.total_points)
    ON CONFLICT (agency_id)
    DO UPDATE SET 
        points_balance = agency_balances.points_balance + NEW.total_points,
        updated_at = NOW();
    
    -- 포인트 거래 내역 기록
    INSERT INTO point_transactions (agency_id, points, transaction_type, memo)
    VALUES (NEW.agency_id, NEW.total_points, 'agency_deposit', 
            '포인트 충전: ' || NEW.deposit_amount || '원 (보너스: ' || NEW.bonus_points || '포인트)');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 에이전시 포인트 충전 트리거
DROP TRIGGER IF EXISTS trigger_update_agency_balance_on_deposit ON agency_deposits;
CREATE TRIGGER trigger_update_agency_balance_on_deposit
    AFTER INSERT ON agency_deposits
    FOR EACH ROW
    EXECUTE FUNCTION update_agency_balance_on_deposit();

-- 7. 사용자 포인트 거래 시 잔액 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_user_points_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- 사용자 포인트 잔액 업데이트 또는 생성
    INSERT INTO user_points (user_id, points)
    VALUES (NEW.user_id, NEW.points)
    ON CONFLICT (user_id)
    DO UPDATE SET 
        points = user_points.points + NEW.points,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. 사용자 포인트 거래 트리거
DROP TRIGGER IF EXISTS trigger_update_user_points_on_transaction ON point_transactions;
CREATE TRIGGER trigger_update_user_points_on_transaction
    AFTER INSERT ON point_transactions
    FOR EACH ROW
    WHEN (NEW.user_id IS NOT NULL)
    EXECUTE FUNCTION update_user_points_on_transaction();

-- 9. 에이전시 포인트 거래 시 잔액 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_agency_points_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- 에이전시 포인트 잔액 업데이트 또는 생성
    INSERT INTO agency_balances (agency_id, points_balance)
    VALUES (NEW.agency_id, NEW.points)
    ON CONFLICT (agency_id)
    DO UPDATE SET 
        points_balance = agency_balances.points_balance + NEW.points,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. 에이전시 포인트 거래 트리거
DROP TRIGGER IF EXISTS trigger_update_agency_points_on_transaction ON point_transactions;
CREATE TRIGGER trigger_update_agency_points_on_transaction
    AFTER INSERT ON point_transactions
    FOR EACH ROW
    WHEN (NEW.agency_id IS NOT NULL)
    EXECUTE FUNCTION update_agency_points_on_transaction();

-- 11. RLS 정책 설정

-- agency_balances 테이블 RLS
ALTER TABLE agency_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agency balance" ON agency_balances
    FOR SELECT USING (auth.uid() = agency_id);

CREATE POLICY "Admins can view all agency balances" ON agency_balances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- agency_deposits 테이블 RLS
ALTER TABLE agency_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deposits" ON agency_deposits
    FOR SELECT USING (auth.uid() = agency_id);

CREATE POLICY "Admins can view all deposits" ON agency_deposits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can create their own deposits" ON agency_deposits
    FOR INSERT WITH CHECK (auth.uid() = agency_id);

-- point_transactions 테이블 RLS
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON point_transactions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = agency_id OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can create their own transactions" ON point_transactions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        auth.uid() = agency_id OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- user_points 테이블 RLS
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own points" ON user_points
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user points" ON user_points
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 12. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_agency_balances_agency_id ON agency_balances(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_deposits_agency_id ON agency_deposits(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_deposits_created_at ON agency_deposits(created_at);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_agency_id ON point_transactions(agency_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);

-- 13. 샘플 데이터 삽입 (테스트용)
-- 관리자 계정에 초기 포인트 부여
INSERT INTO user_points (user_id, points)
SELECT id, 10000 FROM users WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- 에이전시 계정에 초기 포인트 부여
INSERT INTO agency_balances (agency_id, points_balance)
SELECT id, 50000 FROM users WHERE role = 'agency'
ON CONFLICT (agency_id) DO NOTHING;

COMMENT ON TABLE agency_balances IS '에이전시 포인트 잔액 관리';
COMMENT ON TABLE agency_deposits IS '에이전시 포인트 충전 내역';
COMMENT ON TABLE point_transactions IS '포인트 거래 내역';
COMMENT ON TABLE user_points IS '사용자 포인트 잔액';
