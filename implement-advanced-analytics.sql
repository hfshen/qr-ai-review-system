-- 고급 분석 및 리포팅 시스템 데이터베이스 스키마
-- 예측 분석, 사용자 정의 리포트, A/B 테스트, 고객 세그멘테이션

-- 0. updated_at 컬럼 자동 업데이트를 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. 사용자 정의 리포트 테이블
CREATE TABLE IF NOT EXISTS custom_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    filters JSONB NOT NULL DEFAULT '{}',
    metrics TEXT[] NOT NULL DEFAULT '{}',
    chart_types TEXT[] NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. A/B 테스트 테이블
CREATE TABLE IF NOT EXISTS ab_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    hypothesis TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'running', 'paused', 'completed', 'cancelled')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    target_audience JSONB NOT NULL DEFAULT '{}',
    success_metrics TEXT[] NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. A/B 테스트 변형 테이블
CREATE TABLE IF NOT EXISTS ab_test_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    variant_type VARCHAR(50) NOT NULL CHECK (variant_type IN ('control', 'treatment')),
    configuration JSONB NOT NULL DEFAULT '{}',
    traffic_percentage DECIMAL(5,2) NOT NULL DEFAULT 50 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. A/B 테스트 결과 테이블
CREATE TABLE IF NOT EXISTS ab_test_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES ab_test_variants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    conversion BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 예측 분석 결과 테이블
CREATE TABLE IF NOT EXISTS predictive_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    analysis_type VARCHAR(50) NOT NULL,
    target_metric VARCHAR(100) NOT NULL,
    predicted_value DECIMAL(15,4) NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    prediction_date DATE NOT NULL,
    actual_value DECIMAL(15,4),
    accuracy_score DECIMAL(3,2),
    model_version VARCHAR(50),
    parameters JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 고객 세그멘테이션 테이블
CREATE TABLE IF NOT EXISTS customer_segments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    segment_name VARCHAR(100) NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL DEFAULT '{}',
    user_count INTEGER NOT NULL DEFAULT 0,
    avg_lifetime_value DECIMAL(10,2),
    avg_engagement_score DECIMAL(5,2),
    churn_probability DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 사용자 세그먼트 할당 테이블
CREATE TABLE IF NOT EXISTS user_segment_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    segment_id UUID NOT NULL REFERENCES customer_segments(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confidence_score DECIMAL(3,2) NOT NULL DEFAULT 1.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    UNIQUE(user_id, segment_id)
);

-- 8. 분석 대시보드 테이블
CREATE TABLE IF NOT EXISTS analytics_dashboards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout JSONB NOT NULL DEFAULT '{}',
    widgets JSONB NOT NULL DEFAULT '{}',
    filters JSONB NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 분석 위젯 테이블
CREATE TABLE IF NOT EXISTS analytics_widgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dashboard_id UUID REFERENCES analytics_dashboards(id) ON DELETE CASCADE,
    widget_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}',
    data_source VARCHAR(100),
    refresh_interval INTEGER NOT NULL DEFAULT 300, -- 초 단위
    position JSONB NOT NULL DEFAULT '{}',
    size JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 분석 알림 테이블
CREATE TABLE IF NOT EXISTS analytics_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    metric_name VARCHAR(100) NOT NULL,
    condition_type VARCHAR(20) NOT NULL CHECK (condition_type IN ('greater_than', 'less_than', 'equals', 'changed_by')),
    threshold_value DECIMAL(15,4) NOT NULL,
    time_window INTEGER NOT NULL DEFAULT 3600, -- 초 단위
    is_active BOOLEAN NOT NULL DEFAULT true,
    notification_channels TEXT[] NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    last_triggered TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. 분석 알림 로그 테이블
CREATE TABLE IF NOT EXISTS analytics_alert_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_id UUID NOT NULL REFERENCES analytics_alerts(id) ON DELETE CASCADE,
    metric_value DECIMAL(15,4) NOT NULL,
    threshold_value DECIMAL(15,4) NOT NULL,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notification_sent BOOLEAN NOT NULL DEFAULT false,
    notification_channels TEXT[] NOT NULL DEFAULT '{}'
);

-- 12. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_custom_reports_created_by ON custom_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_reports_created_at ON custom_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_custom_reports_is_public ON custom_reports(is_public);

CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_tests_created_by ON ab_tests(created_by);
CREATE INDEX IF NOT EXISTS idx_ab_tests_start_date ON ab_tests(start_date);
CREATE INDEX IF NOT EXISTS idx_ab_tests_end_date ON ab_tests(end_date);

CREATE INDEX IF NOT EXISTS idx_ab_variants_test_id ON ab_test_variants(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_variants_type ON ab_test_variants(variant_type);
CREATE INDEX IF NOT EXISTS idx_ab_variants_active ON ab_test_variants(is_active);

CREATE INDEX IF NOT EXISTS idx_ab_results_test_id ON ab_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_results_variant_id ON ab_test_results(variant_id);
CREATE INDEX IF NOT EXISTS idx_ab_results_user_id ON ab_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_results_metric_name ON ab_test_results(metric_name);
CREATE INDEX IF NOT EXISTS idx_ab_results_created_at ON ab_test_results(created_at);

CREATE INDEX IF NOT EXISTS idx_predictive_analytics_type ON predictive_analytics(analysis_type);
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_metric ON predictive_analytics(target_metric);
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_date ON predictive_analytics(prediction_date);
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_confidence ON predictive_analytics(confidence_score);

CREATE INDEX IF NOT EXISTS idx_customer_segments_name ON customer_segments(segment_name);
CREATE INDEX IF NOT EXISTS idx_customer_segments_created_at ON customer_segments(created_at);

CREATE INDEX IF NOT EXISTS idx_user_segment_user_id ON user_segment_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_segment_segment_id ON user_segment_assignments(segment_id);
CREATE INDEX IF NOT EXISTS idx_user_segment_assigned_at ON user_segment_assignments(assigned_at);

CREATE INDEX IF NOT EXISTS idx_dashboards_created_by ON analytics_dashboards(created_by);
CREATE INDEX IF NOT EXISTS idx_dashboards_is_public ON analytics_dashboards(is_public);
CREATE INDEX IF NOT EXISTS idx_dashboards_created_at ON analytics_dashboards(created_at);

CREATE INDEX IF NOT EXISTS idx_widgets_dashboard_id ON analytics_widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_widgets_type ON analytics_widgets(widget_type);
CREATE INDEX IF NOT EXISTS idx_widgets_position ON analytics_widgets(position);

CREATE INDEX IF NOT EXISTS idx_alerts_metric_name ON analytics_alerts(metric_name);
CREATE INDEX IF NOT EXISTS idx_alerts_is_active ON analytics_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_alerts_created_by ON analytics_alerts(created_by);

CREATE INDEX IF NOT EXISTS idx_alert_logs_alert_id ON analytics_alert_logs(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_logs_triggered_at ON analytics_alert_logs(triggered_at);

-- 13. 분석 집계 뷰들
CREATE OR REPLACE VIEW analytics_summary AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_reviews,
    AVG(rating) as avg_rating,
    COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_reviews,
    COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_reviews
FROM reviews
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- sentiment_trends 뷰는 sentiment_analysis 테이블 생성 후에 생성됩니다
-- CREATE OR REPLACE VIEW sentiment_trends AS
-- SELECT 
--     DATE_TRUNC('day', sa.created_at) as date,
--     sa.sentiment,
--     COUNT(*) as count,
--     AVG(sa.confidence) as avg_confidence
-- FROM sentiment_analysis sa
-- WHERE sa.created_at >= CURRENT_DATE - INTERVAL '30 days'
-- GROUP BY DATE_TRUNC('day', sa.created_at), sa.sentiment
-- ORDER BY date DESC, sentiment;

CREATE OR REPLACE VIEW platform_performance AS
SELECT 
    p.name as platform_name,
    COUNT(r.id) as total_reviews,
    AVG(r.rating) as avg_rating,
    0 as positive_count,
    0 as negative_count
FROM platforms p
LEFT JOIN reviews r ON p.id = r.platform_id
WHERE r.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.id, p.name
ORDER BY total_reviews DESC;

CREATE OR REPLACE VIEW user_engagement_metrics AS
SELECT 
    u.id as user_id,
    u.display_name,
    COUNT(r.id) as total_reviews,
    AVG(r.rating) as avg_rating,
    COUNT(DISTINCT DATE(r.created_at)) as active_days,
    MAX(r.created_at) as last_review_date,
    0 as positive_sentiments
FROM users u
LEFT JOIN reviews r ON u.id = r.user_id
WHERE r.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY u.id, u.display_name
ORDER BY total_reviews DESC;

-- 14. 자동 업데이트 함수들
CREATE OR REPLACE FUNCTION update_customer_segments()
RETURNS void AS $$
BEGIN
    -- 고객 세그먼트 자동 업데이트 로직
    -- 고가치 고객 세그먼트
    INSERT INTO customer_segments (segment_name, description, criteria, user_count)
    SELECT 
        'high_value_customers',
        '높은 가치를 가진 고객들',
        '{"min_reviews": 10, "min_avg_rating": 4.0}',
        COUNT(*)
    FROM users u
    WHERE (
        SELECT COUNT(*) FROM reviews r WHERE r.user_id = u.id
    ) >= 10
    AND (
        SELECT AVG(rating) FROM reviews r WHERE r.user_id = u.id
    ) >= 4.0
    ON CONFLICT (segment_name) DO UPDATE SET
        user_count = EXCLUDED.user_count,
        updated_at = NOW();
    
    -- 활성 고객 세그먼트
    INSERT INTO customer_segments (segment_name, description, criteria, user_count)
    SELECT 
        'active_customers',
        '활발한 활동을 보이는 고객들',
        '{"min_reviews": 5, "recent_activity": true}',
        COUNT(*)
    FROM users u
    WHERE (
        SELECT COUNT(*) FROM reviews r 
        WHERE r.user_id = u.id 
        AND r.created_at >= CURRENT_DATE - INTERVAL '30 days'
    ) >= 5
    ON CONFLICT (segment_name) DO UPDATE SET
        user_count = EXCLUDED.user_count,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_prediction_accuracy()
RETURNS void AS $$
BEGIN
    -- 예측 정확도 계산 및 업데이트
    UPDATE predictive_analytics 
    SET accuracy_score = CASE 
        WHEN actual_value IS NOT NULL AND predicted_value > 0 THEN
            GREATEST(0, 1 - ABS(actual_value - predicted_value) / predicted_value)
        ELSE NULL
    END
    WHERE actual_value IS NOT NULL AND accuracy_score IS NULL;
END;
$$ LANGUAGE plpgsql;

-- 15. 분석 알림 체크 함수
CREATE OR REPLACE FUNCTION check_analytics_alerts()
RETURNS TABLE (
    alert_id UUID,
    alert_name VARCHAR(255),
    current_value DECIMAL(15,4),
    threshold_value DECIMAL(15,4),
    triggered_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aa.id,
        aa.name,
        CASE 
            WHEN aa.metric_name = 'total_reviews' THEN 
                (SELECT COUNT(*) FROM reviews WHERE created_at >= NOW() - INTERVAL '1 hour')
            WHEN aa.metric_name = 'avg_rating' THEN 
                (SELECT AVG(rating) FROM reviews WHERE created_at >= NOW() - INTERVAL '1 hour')
            ELSE 0
        END as current_value,
        aa.threshold_value,
        NOW() as triggered_at
    FROM analytics_alerts aa
    WHERE aa.is_active = true
    AND (
        CASE 
            WHEN aa.metric_name = 'total_reviews' THEN 
                (SELECT COUNT(*) FROM reviews WHERE created_at >= NOW() - INTERVAL '1 hour')
            WHEN aa.metric_name = 'avg_rating' THEN 
                (SELECT AVG(rating) FROM reviews WHERE created_at >= NOW() - INTERVAL '1 hour')
            ELSE 0
        END
    ) > aa.threshold_value;
END;
$$ LANGUAGE plpgsql;

-- 16. 트리거 설정
DROP TRIGGER IF EXISTS trigger_update_custom_reports_updated_at ON custom_reports;
CREATE TRIGGER trigger_update_custom_reports_updated_at
    BEFORE UPDATE ON custom_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_ab_tests_updated_at ON ab_tests;
CREATE TRIGGER trigger_update_ab_tests_updated_at
    BEFORE UPDATE ON ab_tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_customer_segments_updated_at ON customer_segments;
CREATE TRIGGER trigger_update_customer_segments_updated_at
    BEFORE UPDATE ON customer_segments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_dashboards_updated_at ON analytics_dashboards;
CREATE TRIGGER trigger_update_dashboards_updated_at
    BEFORE UPDATE ON analytics_dashboards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_widgets_updated_at ON analytics_widgets;
CREATE TRIGGER trigger_update_widgets_updated_at
    BEFORE UPDATE ON analytics_widgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_alerts_updated_at ON analytics_alerts;
CREATE TRIGGER trigger_update_alerts_updated_at
    BEFORE UPDATE ON analytics_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 17. RLS 정책 설정

-- custom_reports 테이블 RLS
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom reports" ON custom_reports
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can view public custom reports" ON custom_reports
    FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can view all custom reports" ON custom_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can create custom reports" ON custom_reports
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own custom reports" ON custom_reports
    FOR UPDATE USING (auth.uid() = created_by);

-- ab_tests 테이블 RLS
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own A/B tests" ON ab_tests
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Admins can view all A/B tests" ON ab_tests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can create A/B tests" ON ab_tests
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- analytics_dashboards 테이블 RLS
ALTER TABLE analytics_dashboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dashboards" ON analytics_dashboards
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can view public dashboards" ON analytics_dashboards
    FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can view all dashboards" ON analytics_dashboards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can create dashboards" ON analytics_dashboards
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 나머지 테이블들도 유사한 RLS 정책 적용
-- (간결성을 위해 생략, 실제 구현 시 모든 테이블에 적용 필요)

COMMENT ON TABLE custom_reports IS '사용자 정의 리포트';
COMMENT ON TABLE ab_tests IS 'A/B 테스트';
COMMENT ON TABLE ab_test_variants IS 'A/B 테스트 변형';
COMMENT ON TABLE ab_test_results IS 'A/B 테스트 결과';
COMMENT ON TABLE predictive_analytics IS '예측 분석 결과';
COMMENT ON TABLE customer_segments IS '고객 세그먼트';
COMMENT ON TABLE user_segment_assignments IS '사용자 세그먼트 할당';
COMMENT ON TABLE analytics_dashboards IS '분석 대시보드';
COMMENT ON TABLE analytics_widgets IS '분석 위젯';
COMMENT ON TABLE analytics_alerts IS '분석 알림';
COMMENT ON TABLE analytics_alert_logs IS '분석 알림 로그';
COMMENT ON FUNCTION update_customer_segments IS '고객 세그먼트 자동 업데이트';
COMMENT ON FUNCTION calculate_prediction_accuracy IS '예측 정확도 계산';
COMMENT ON FUNCTION check_analytics_alerts IS '분석 알림 체크';
