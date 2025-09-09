-- 성능 최적화 및 모니터링 시스템 데이터베이스 스키마
-- API 성능, 시스템 헬스, 캐시 통계, 데이터베이스 쿼리 모니터링

-- 0. updated_at 컬럼 자동 업데이트를 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. 성능 메트릭 테이블
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    response_time INTEGER NOT NULL, -- 밀리초
    status_code INTEGER NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 시스템 헬스 체크 테이블
CREATE TABLE IF NOT EXISTS system_health (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
    response_time INTEGER NOT NULL, -- 밀리초
    error_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    uptime_percentage DECIMAL(5,2) NOT NULL DEFAULT 100,
    last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 캐시 통계 테이블
CREATE TABLE IF NOT EXISTS cache_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    hit_count INTEGER NOT NULL DEFAULT 0,
    miss_count INTEGER NOT NULL DEFAULT 0,
    hit_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 데이터베이스 쿼리 성능 테이블
CREATE TABLE IF NOT EXISTS database_queries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query TEXT NOT NULL,
    execution_time INTEGER NOT NULL, -- 밀리초
    rows_returned INTEGER NOT NULL DEFAULT 0,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 에러 로그 테이블
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_type VARCHAR(50) NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    endpoint VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 6. 사용자 활동 로그 테이블
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 시스템 리소스 사용량 테이블
CREATE TABLE IF NOT EXISTS system_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cpu_usage DECIMAL(5,2) NOT NULL,
    memory_usage DECIMAL(5,2) NOT NULL,
    disk_usage DECIMAL(5,2) NOT NULL,
    network_in_bytes BIGINT NOT NULL DEFAULT 0,
    network_out_bytes BIGINT NOT NULL DEFAULT 0,
    active_connections INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint ON performance_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_response_time ON performance_metrics(response_time);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_status_code ON performance_metrics(status_code);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_system_health_service ON system_health(service_name);
CREATE INDEX IF NOT EXISTS idx_system_health_status ON system_health(status);
CREATE INDEX IF NOT EXISTS idx_system_health_last_check ON system_health(last_check);

CREATE INDEX IF NOT EXISTS idx_cache_stats_key ON cache_stats(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_stats_hit_rate ON cache_stats(hit_rate);
CREATE INDEX IF NOT EXISTS idx_cache_stats_last_accessed ON cache_stats(last_accessed);

CREATE INDEX IF NOT EXISTS idx_database_queries_execution_time ON database_queries(execution_time);
CREATE INDEX IF NOT EXISTS idx_database_queries_created_at ON database_queries(created_at);
CREATE INDEX IF NOT EXISTS idx_database_queries_user_id ON database_queries(user_id);

CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_system_resources_created_at ON system_resources(created_at);

-- 9. 성능 메트릭 집계 뷰
CREATE OR REPLACE VIEW performance_summary AS
SELECT 
    endpoint,
    method,
    COUNT(*) as total_requests,
    AVG(response_time) as avg_response_time,
    MIN(response_time) as min_response_time,
    MAX(response_time) as max_response_time,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_time) as median_response_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time) as p95_response_time,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
    ROUND(COUNT(CASE WHEN status_code >= 400 THEN 1 END) * 100.0 / COUNT(*), 2) as error_rate
FROM performance_metrics
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY endpoint, method;

-- 10. 시스템 헬스 요약 뷰
CREATE OR REPLACE VIEW system_health_summary AS
SELECT 
    service_name,
    status,
    AVG(response_time) as avg_response_time,
    AVG(error_rate) as avg_error_rate,
    AVG(uptime_percentage) as avg_uptime,
    COUNT(*) as check_count,
    MAX(last_check) as last_check
FROM system_health
WHERE last_check >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY service_name, status;

-- 11. 캐시 성능 요약 뷰
CREATE OR REPLACE VIEW cache_performance_summary AS
SELECT 
    cache_key,
    hit_count,
    miss_count,
    hit_rate,
    (hit_count + miss_count) as total_requests,
    last_accessed,
    CASE 
        WHEN hit_rate >= 80 THEN 'excellent'
        WHEN hit_rate >= 60 THEN 'good'
        WHEN hit_rate >= 40 THEN 'fair'
        ELSE 'poor'
    END as performance_rating
FROM cache_stats
ORDER BY hit_rate DESC;

-- 12. 데이터베이스 쿼리 성능 요약 뷰
CREATE OR REPLACE VIEW database_performance_summary AS
SELECT 
    LEFT(query, 100) as query_preview,
    COUNT(*) as execution_count,
    AVG(execution_time) as avg_execution_time,
    MIN(execution_time) as min_execution_time,
    MAX(execution_time) as max_execution_time,
    AVG(rows_returned) as avg_rows_returned,
    SUM(rows_returned) as total_rows_returned
FROM database_queries
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY LEFT(query, 100)
ORDER BY avg_execution_time DESC;

-- 13. 에러 로그 요약 뷰
CREATE OR REPLACE VIEW error_summary AS
SELECT 
    error_type,
    severity,
    COUNT(*) as error_count,
    COUNT(CASE WHEN resolved = false THEN 1 END) as unresolved_count,
    MAX(created_at) as last_occurrence,
    MIN(created_at) as first_occurrence
FROM error_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY error_type, severity
ORDER BY error_count DESC;

-- 14. 사용자 활동 요약 뷰
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    u.display_name,
    u.email,
    COUNT(ual.id) as total_actions,
    COUNT(DISTINCT DATE(ual.created_at)) as active_days,
    MAX(ual.created_at) as last_activity,
    MIN(ual.created_at) as first_activity,
    COUNT(DISTINCT ual.action) as unique_actions
FROM users u
LEFT JOIN user_activity_logs ual ON u.id = ual.user_id
WHERE ual.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.id, u.display_name, u.email
ORDER BY total_actions DESC;

-- 15. 자동 정리 함수
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS void AS $$
BEGIN
    -- 30일 이상 된 성능 메트릭 삭제
    DELETE FROM performance_metrics 
    WHERE created_at < CURRENT_DATE - INTERVAL '30 days';
    
    -- 7일 이상 된 시스템 헬스 체크 삭제
    DELETE FROM system_health 
    WHERE created_at < CURRENT_DATE - INTERVAL '7 days';
    
    -- 30일 이상 된 데이터베이스 쿼리 로그 삭제
    DELETE FROM database_queries 
    WHERE created_at < CURRENT_DATE - INTERVAL '30 days';
    
    -- 90일 이상 된 사용자 활동 로그 삭제
    DELETE FROM user_activity_logs 
    WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
    
    -- 7일 이상 된 시스템 리소스 사용량 삭제
    DELETE FROM system_resources 
    WHERE created_at < CURRENT_DATE - INTERVAL '7 days';
    
    -- 해결된 에러 로그는 180일 후 삭제
    DELETE FROM error_logs 
    WHERE resolved = true 
    AND resolved_at < CURRENT_DATE - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql;

-- 16. 자동 정리 스케줄 (매일 새벽 2시에 실행)
-- 실제 운영 환경에서는 pg_cron 확장을 사용하거나 외부 스케줄러를 사용
-- SELECT cron.schedule('cleanup-metrics', '0 2 * * *', 'SELECT cleanup_old_metrics();');

-- 17. 성능 알림 함수
CREATE OR REPLACE FUNCTION check_performance_alerts()
RETURNS TABLE (
    alert_type VARCHAR(50),
    message TEXT,
    severity VARCHAR(20)
) AS $$
BEGIN
    -- 느린 응답 시간 알림
    RETURN QUERY
    SELECT 
        'slow_response'::VARCHAR(50),
        '평균 응답 시간이 2초를 초과하는 엔드포인트가 있습니다: ' || endpoint,
        'high'::VARCHAR(20)
    FROM performance_summary
    WHERE avg_response_time > 2000;
    
    -- 높은 에러율 알림
    RETURN QUERY
    SELECT 
        'high_error_rate'::VARCHAR(50),
        '에러율이 5%를 초과하는 엔드포인트가 있습니다: ' || endpoint,
        'medium'::VARCHAR(20)
    FROM performance_summary
    WHERE error_rate > 5;
    
    -- 시스템 다운 알림
    RETURN QUERY
    SELECT 
        'system_down'::VARCHAR(50),
        '서비스가 다운되었습니다: ' || service_name,
        'critical'::VARCHAR(20)
    FROM system_health
    WHERE status = 'down';
    
    -- 낮은 캐시 히트율 알림
    RETURN QUERY
    SELECT 
        'low_cache_hit_rate'::VARCHAR(50),
        '캐시 히트율이 낮습니다: ' || cache_key || ' (' || hit_rate || '%)',
        'low'::VARCHAR(20)
    FROM cache_performance_summary
    WHERE hit_rate < 30;
END;
$$ LANGUAGE plpgsql;

-- 18. RLS 정책 설정

-- performance_metrics 테이블 RLS
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all performance metrics" ON performance_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert performance metrics" ON performance_metrics
    FOR INSERT WITH CHECK (true);

-- system_health 테이블 RLS
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system health" ON system_health
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can manage system health" ON system_health
    FOR ALL USING (true);

-- cache_stats 테이블 RLS
ALTER TABLE cache_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view cache stats" ON cache_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can manage cache stats" ON cache_stats
    FOR ALL USING (true);

-- database_queries 테이블 RLS
ALTER TABLE database_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view database queries" ON database_queries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert database queries" ON database_queries
    FOR INSERT WITH CHECK (true);

-- error_logs 테이블 RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view error logs" ON error_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can manage error logs" ON error_logs
    FOR ALL USING (true);

-- user_activity_logs 테이블 RLS
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity logs" ON user_activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity logs" ON user_activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert activity logs" ON user_activity_logs
    FOR INSERT WITH CHECK (true);

-- system_resources 테이블 RLS
ALTER TABLE system_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system resources" ON system_resources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can manage system resources" ON system_resources
    FOR ALL USING (true);

-- 트리거 설정
CREATE TRIGGER trigger_update_cache_stats_updated_at
    BEFORE UPDATE ON cache_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE performance_metrics IS 'API 성능 메트릭';
COMMENT ON TABLE system_health IS '시스템 헬스 체크';
COMMENT ON TABLE cache_stats IS '캐시 통계';
COMMENT ON TABLE database_queries IS '데이터베이스 쿼리 성능';
COMMENT ON TABLE error_logs IS '에러 로그';
COMMENT ON TABLE user_activity_logs IS '사용자 활동 로그';
COMMENT ON TABLE system_resources IS '시스템 리소스 사용량';
COMMENT ON FUNCTION cleanup_old_metrics IS '오래된 메트릭 자동 정리';
COMMENT ON FUNCTION check_performance_alerts IS '성능 알림 체크';
