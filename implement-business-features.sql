-- 비즈니스 기능 데이터베이스 스키마
-- 구독모델, 화이트라벨, API마켓플레이스

-- 1. 구독 플랜 테이블
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
    interval VARCHAR(20) NOT NULL CHECK (interval IN ('monthly', 'yearly')),
    features TEXT[] NOT NULL DEFAULT '{}',
    max_reviews INTEGER NOT NULL DEFAULT 0,
    max_users INTEGER NOT NULL DEFAULT 0,
    max_agencies INTEGER NOT NULL DEFAULT 0,
    api_calls_limit INTEGER NOT NULL DEFAULT 0,
    is_popular BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    stripe_price_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 사용자 구독 테이블
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
);

-- 3. 화이트라벨 설정 테이블
CREATE TABLE IF NOT EXISTS white_label_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id VARCHAR(100) NOT NULL UNIQUE,
    client_name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL UNIQUE,
    logo_url TEXT,
    primary_color VARCHAR(7) NOT NULL DEFAULT '#2563eb',
    secondary_color VARCHAR(7) NOT NULL DEFAULT '#64748b',
    custom_css TEXT,
    custom_js TEXT,
    features TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. API 마켓플레이스 테이블
CREATE TABLE IF NOT EXISTS api_marketplace (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    endpoint VARCHAR(500) NOT NULL,
    method VARCHAR(10) NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
    price_per_call DECIMAL(10,4) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
    category VARCHAR(100) NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    documentation_url TEXT,
    example_request JSONB,
    example_response JSONB,
    rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. API 사용량 테이블
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_id UUID NOT NULL REFERENCES api_marketplace(id) ON DELETE CASCADE,
    endpoint VARCHAR(500) NOT NULL,
    method VARCHAR(10) NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    total_cost DECIMAL(10,4) NOT NULL DEFAULT 0,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, api_id, period_start, period_end)
);

-- 6. 결제 내역 테이블
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
    payment_method VARCHAR(50) NOT NULL,
    stripe_payment_intent_id VARCHAR(255),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
    description TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 파트너십 관리 테이블
CREATE TABLE IF NOT EXISTS partnerships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_name VARCHAR(255) NOT NULL,
    partner_type VARCHAR(50) NOT NULL CHECK (partner_type IN ('reseller', 'integrator', 'consultant', 'developer')),
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    company_website TEXT,
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
    agreement_start_date DATE,
    agreement_end_date DATE,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 파트너 수수료 테이블
CREATE TABLE IF NOT EXISTS partner_commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partnership_id UUID NOT NULL REFERENCES partnerships(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_price ON subscription_plans(price);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_interval ON subscription_plans(interval);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end ON user_subscriptions(current_period_end);

CREATE INDEX IF NOT EXISTS idx_white_label_configs_client_id ON white_label_configs(client_id);
CREATE INDEX IF NOT EXISTS idx_white_label_configs_domain ON white_label_configs(domain);
CREATE INDEX IF NOT EXISTS idx_white_label_configs_active ON white_label_configs(is_active);

CREATE INDEX IF NOT EXISTS idx_api_marketplace_category ON api_marketplace(category);
CREATE INDEX IF NOT EXISTS idx_api_marketplace_active ON api_marketplace(is_active);
CREATE INDEX IF NOT EXISTS idx_api_marketplace_created_by ON api_marketplace(created_by);
CREATE INDEX IF NOT EXISTS idx_api_marketplace_price ON api_marketplace(price_per_call);

CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_api_id ON api_usage(api_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_period ON api_usage(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at);

CREATE INDEX IF NOT EXISTS idx_partnerships_partner_type ON partnerships(partner_type);
CREATE INDEX IF NOT EXISTS idx_partnerships_status ON partnerships(status);
CREATE INDEX IF NOT EXISTS idx_partnerships_created_by ON partnerships(created_by);

CREATE INDEX IF NOT EXISTS idx_partner_commissions_partnership_id ON partner_commissions(partnership_id);
CREATE INDEX IF NOT EXISTS idx_partner_commissions_user_id ON partner_commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_commissions_payment_status ON partner_commissions(payment_status);

-- 10. 구독 상태 집계 뷰
CREATE OR REPLACE VIEW subscription_summary AS
SELECT 
    sp.name as plan_name,
    sp.price,
    sp.interval,
    COUNT(us.id) as active_subscriptions,
    SUM(sp.price) as total_revenue,
    AVG(sp.price) as avg_price
FROM subscription_plans sp
LEFT JOIN user_subscriptions us ON sp.id = us.plan_id AND us.status = 'active'
WHERE sp.is_active = true
GROUP BY sp.id, sp.name, sp.price, sp.interval
ORDER BY sp.price;

-- 11. API 사용량 집계 뷰
CREATE OR REPLACE VIEW api_usage_summary AS
SELECT 
    am.name as api_name,
    am.category,
    am.price_per_call,
    COUNT(DISTINCT au.user_id) as unique_users,
    SUM(au.request_count) as total_requests,
    SUM(au.success_count) as total_success,
    SUM(au.error_count) as total_errors,
    SUM(au.total_cost) as total_revenue,
    AVG(au.success_count::DECIMAL / NULLIF(au.request_count, 0)) as success_rate
FROM api_marketplace am
LEFT JOIN api_usage au ON am.id = au.api_id
WHERE am.is_active = true
GROUP BY am.id, am.name, am.category, am.price_per_call
ORDER BY total_revenue DESC;

-- 12. 파트너 수수료 집계 뷰
CREATE OR REPLACE VIEW partner_commission_summary AS
SELECT 
    p.partner_name,
    p.partner_type,
    p.commission_rate,
    COUNT(pc.id) as total_commissions,
    SUM(pc.commission_amount) as total_commission_amount,
    COUNT(CASE WHEN pc.payment_status = 'paid' THEN 1 END) as paid_commissions,
    SUM(CASE WHEN pc.payment_status = 'paid' THEN pc.commission_amount ELSE 0 END) as paid_amount
FROM partnerships p
LEFT JOIN partner_commissions pc ON p.id = pc.partnership_id
WHERE p.status = 'active'
GROUP BY p.id, p.partner_name, p.partner_type, p.commission_rate
ORDER BY total_commission_amount DESC;

-- 13. 자동 업데이트 함수들
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS void AS $$
BEGIN
    -- 만료된 구독 상태 업데이트
    UPDATE user_subscriptions 
    SET status = 'expired'
    WHERE status = 'active' 
    AND current_period_end < NOW();
    
    -- 취소 예정인 구독 처리
    UPDATE user_subscriptions 
    SET status = 'cancelled'
    WHERE cancel_at_period_end = true 
    AND current_period_end < NOW()
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_monthly_revenue()
RETURNS TABLE (
    month VARCHAR(7),
    total_revenue DECIMAL(12,2),
    subscription_revenue DECIMAL(12,2),
    api_revenue DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(ph.created_at, 'YYYY-MM') as month,
        COALESCE(SUM(ph.amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN ph.subscription_id IS NOT NULL THEN ph.amount ELSE 0 END), 0) as subscription_revenue,
        COALESCE(SUM(CASE WHEN ph.subscription_id IS NULL THEN ph.amount ELSE 0 END), 0) as api_revenue
    FROM payment_history ph
    WHERE ph.status = 'succeeded'
    AND ph.created_at >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY TO_CHAR(ph.created_at, 'YYYY-MM')
    ORDER BY month DESC;
END;
$$ LANGUAGE plpgsql;

-- 14. 구독 만료 알림 함수
CREATE OR REPLACE FUNCTION check_subscription_expiry()
RETURNS TABLE (
    user_id UUID,
    subscription_id UUID,
    days_until_expiry INTEGER,
    plan_name VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.user_id,
        us.id as subscription_id,
        EXTRACT(DAYS FROM us.current_period_end - NOW())::INTEGER as days_until_expiry,
        sp.name as plan_name
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.status = 'active'
    AND us.current_period_end BETWEEN NOW() AND NOW() + INTERVAL '7 days'
    ORDER BY us.current_period_end;
END;
$$ LANGUAGE plpgsql;

-- 15. 트리거 설정
CREATE TRIGGER trigger_update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_white_label_configs_updated_at
    BEFORE UPDATE ON white_label_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_api_marketplace_updated_at
    BEFORE UPDATE ON api_marketplace
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_partnerships_updated_at
    BEFORE UPDATE ON partnerships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 16. RLS 정책 설정

-- subscription_plans 테이블 RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans" ON subscription_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- user_subscriptions 테이블 RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions" ON user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON user_subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- api_marketplace 테이블 RLS
ALTER TABLE api_marketplace ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active APIs" ON api_marketplace
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage APIs" ON api_marketplace
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- api_usage 테이블 RLS
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API usage" ON api_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert API usage" ON api_usage
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all API usage" ON api_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- payment_history 테이블 RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment history" ON payment_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert payment history" ON payment_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all payment history" ON payment_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 나머지 테이블들도 유사한 RLS 정책 적용
-- (간결성을 위해 생략, 실제 구현 시 모든 테이블에 적용 필요)

COMMENT ON TABLE subscription_plans IS '구독 플랜';
COMMENT ON TABLE user_subscriptions IS '사용자 구독';
COMMENT ON TABLE white_label_configs IS '화이트라벨 설정';
COMMENT ON TABLE api_marketplace IS 'API 마켓플레이스';
COMMENT ON TABLE api_usage IS 'API 사용량';
COMMENT ON TABLE payment_history IS '결제 내역';
COMMENT ON TABLE partnerships IS '파트너십 관리';
COMMENT ON TABLE partner_commissions IS '파트너 수수료';
COMMENT ON FUNCTION update_subscription_status IS '구독 상태 자동 업데이트';
COMMENT ON FUNCTION calculate_monthly_revenue IS '월별 수익 계산';
COMMENT ON FUNCTION check_subscription_expiry IS '구독 만료 확인';
