-- 보안 강화 시스템 데이터베이스 스키마
-- 2FA, 레이트리미팅, 감사로그, 보안이벤트, IP차단

-- 0. updated_at 컬럼 자동 업데이트를 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. 2단계 인증 테이블
CREATE TABLE IF NOT EXISTS two_factor_auth (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    secret VARCHAR(255) NOT NULL,
    backup_codes TEXT[] NOT NULL DEFAULT '{}',
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. 레이트 리미팅 테이블
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 감사 로그 테이블
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    ip_address INET NOT NULL,
    user_agent TEXT,
    details JSONB NOT NULL DEFAULT '{}',
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 보안 이벤트 테이블
CREATE TABLE IF NOT EXISTS security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 5. 차단된 IP 테이블
CREATE TABLE IF NOT EXISTS blocked_ips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL UNIQUE,
    reason TEXT NOT NULL,
    blocked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    blocked_until TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 로그인 시도 테이블
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),
    two_factor_used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 세션 관리 테이블
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 보안 정책 테이블
CREATE TABLE IF NOT EXISTS security_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_name VARCHAR(100) NOT NULL UNIQUE,
    policy_type VARCHAR(50) NOT NULL,
    description TEXT,
    configuration JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 보안 알림 테이블
CREATE TABLE IF NOT EXISTS security_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT false,
    action_required BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id ON two_factor_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_enabled ON two_factor_auth(is_enabled);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_address ON rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end ON rate_limits(window_end);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_ip_address ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(resolved);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip_address ON blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_blocked_until ON blocked_ips(blocked_until);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_is_active ON blocked_ips(is_active);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON login_attempts(success);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_security_policies_name ON security_policies(policy_name);
CREATE INDEX IF NOT EXISTS idx_security_policies_type ON security_policies(policy_type);
CREATE INDEX IF NOT EXISTS idx_security_policies_active ON security_policies(is_active);

CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_user_id ON security_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_is_read ON security_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON security_alerts(created_at);

-- 11. 보안 집계 뷰들
CREATE OR REPLACE VIEW security_summary AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_events,
    COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_events,
    COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_events,
    COUNT(CASE WHEN resolved = true THEN 1 END) as resolved_events
FROM security_events
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

CREATE OR REPLACE VIEW login_attempts_summary AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as total_attempts,
    COUNT(CASE WHEN success = true THEN 1 END) as successful_logins,
    COUNT(CASE WHEN success = false THEN 1 END) as failed_logins,
    COUNT(DISTINCT ip_address) as unique_ips,
    COUNT(DISTINCT email) as unique_emails
FROM login_attempts
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

CREATE OR REPLACE VIEW rate_limit_violations AS
SELECT 
    ip_address,
    endpoint,
    method,
    COUNT(*) as violation_count,
    MAX(created_at) as last_violation,
    COUNT(DISTINCT DATE(created_at)) as violation_days
FROM rate_limits
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY ip_address, endpoint, method
HAVING COUNT(*) > 10
ORDER BY violation_count DESC;

CREATE OR REPLACE VIEW user_security_status AS
SELECT 
    u.id as user_id,
    u.email,
    u.display_name,
    tfa.is_enabled as two_factor_enabled,
    COUNT(DISTINCT s.id) as active_sessions,
    COUNT(DISTINCT la.id) as recent_login_attempts,
    MAX(la.created_at) as last_login_attempt,
    COUNT(DISTINCT se.id) as security_events_count
FROM users u
LEFT JOIN two_factor_auth tfa ON u.id = tfa.user_id
LEFT JOIN user_sessions s ON u.id = s.user_id AND s.is_active = true
LEFT JOIN login_attempts la ON u.email = la.email AND la.created_at >= CURRENT_DATE - INTERVAL '7 days'
LEFT JOIN security_events se ON u.id = se.user_id AND se.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.id, u.email, u.display_name, tfa.is_enabled;

-- 12. 자동 정리 함수들
CREATE OR REPLACE FUNCTION cleanup_old_security_data()
RETURNS void AS $$
BEGIN
    -- 30일 이상 된 레이트 리미팅 데이터 삭제
    DELETE FROM rate_limits 
    WHERE created_at < CURRENT_DATE - INTERVAL '30 days';
    
    -- 90일 이상 된 감사 로그 삭제
    DELETE FROM audit_logs 
    WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
    
    -- 30일 이상 된 로그인 시도 삭제
    DELETE FROM login_attempts 
    WHERE created_at < CURRENT_DATE - INTERVAL '30 days';
    
    -- 만료된 세션 삭제
    DELETE FROM user_sessions 
    WHERE expires_at < NOW();
    
    -- 만료된 IP 차단 해제
    UPDATE blocked_ips 
    SET is_active = false 
    WHERE blocked_until < NOW() AND is_active = true;
    
    -- 해결된 보안 이벤트는 180일 후 삭제
    DELETE FROM security_events 
    WHERE resolved = true 
    AND resolved_at < CURRENT_DATE - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql;

-- 13. 보안 정책 자동 적용 함수
CREATE OR REPLACE FUNCTION apply_security_policies()
RETURNS void AS $$
DECLARE
    policy RECORD;
BEGIN
    -- 활성화된 보안 정책들을 순회하며 적용
    FOR policy IN 
        SELECT * FROM security_policies 
        WHERE is_active = true
    LOOP
        CASE policy.policy_type
            WHEN 'rate_limit' THEN
                -- 레이트 리미팅 정책 적용
                PERFORM apply_rate_limit_policy(policy.configuration);
            WHEN 'ip_blocking' THEN
                -- IP 차단 정책 적용
                PERFORM apply_ip_blocking_policy(policy.configuration);
            WHEN 'session_timeout' THEN
                -- 세션 타임아웃 정책 적용
                PERFORM apply_session_timeout_policy(policy.configuration);
        END CASE;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 14. 의심스러운 활동 감지 함수
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TABLE (
    user_id UUID,
    ip_address INET,
    activity_type VARCHAR(50),
    severity VARCHAR(20),
    description TEXT
) AS $$
BEGIN
    -- 짧은 시간 내 많은 로그인 시도
    RETURN QUERY
    SELECT 
        NULL::UUID as user_id,
        la.ip_address,
        'multiple_login_attempts'::VARCHAR(50),
        'high'::VARCHAR(20),
        '짧은 시간 내 많은 로그인 시도'::TEXT
    FROM login_attempts la
    WHERE la.created_at >= NOW() - INTERVAL '1 hour'
    AND la.success = false
    GROUP BY la.ip_address
    HAVING COUNT(*) > 10;
    
    -- 여러 IP에서 동일 사용자 접근
    RETURN QUERY
    SELECT 
        u.id as user_id,
        '0.0.0.0'::INET as ip_address,
        'multiple_ip_access'::VARCHAR(50),
        'medium'::VARCHAR(20),
        '여러 IP에서 동시 접근'::TEXT
    FROM users u
    JOIN login_attempts la ON u.email = la.email
    WHERE la.created_at >= NOW() - INTERVAL '1 hour'
    AND la.success = true
    GROUP BY u.id
    HAVING COUNT(DISTINCT la.ip_address) > 3;
    
    -- 비정상적인 시간대 활동
    RETURN QUERY
    SELECT 
        u.id as user_id,
        la.ip_address,
        'unusual_hour_access'::VARCHAR(50),
        'low'::VARCHAR(20),
        '비정상적인 시간대 활동'::TEXT
    FROM users u
    JOIN login_attempts la ON u.email = la.email
    WHERE la.created_at >= NOW() - INTERVAL '1 hour'
    AND la.success = true
    AND EXTRACT(HOUR FROM la.created_at) NOT BETWEEN 6 AND 23;
END;
$$ LANGUAGE plpgsql;

-- 15. 보안 알림 생성 함수
CREATE OR REPLACE FUNCTION create_security_alert(
    alert_type_param VARCHAR(50),
    title_param VARCHAR(255),
    message_param TEXT,
    severity_param VARCHAR(20),
    user_id_param UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    alert_id UUID;
BEGIN
    INSERT INTO security_alerts (
        alert_type,
        title,
        message,
        severity,
        user_id
    ) VALUES (
        alert_type_param,
        title_param,
        message_param,
        severity_param,
        user_id_param
    ) RETURNING id INTO alert_id;
    
    RETURN alert_id;
END;
$$ LANGUAGE plpgsql;

-- 16. 트리거 설정
DROP TRIGGER IF EXISTS trigger_update_two_factor_auth_updated_at ON two_factor_auth;
CREATE TRIGGER trigger_update_two_factor_auth_updated_at
    BEFORE UPDATE ON two_factor_auth
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_security_policies_updated_at ON security_policies;
CREATE TRIGGER trigger_update_security_policies_updated_at
    BEFORE UPDATE ON security_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 17. RLS 정책 설정

-- two_factor_auth 테이블 RLS
ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own 2FA settings" ON two_factor_auth
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings" ON two_factor_auth
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own 2FA settings" ON two_factor_auth
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all 2FA settings" ON two_factor_auth
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- audit_logs 테이블 RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- security_events 테이블 RLS
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own security events" ON security_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all security events" ON security_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update security events" ON security_events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert security events" ON security_events
    FOR INSERT WITH CHECK (true);

-- user_sessions 테이블 RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON user_sessions
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "System can manage sessions" ON user_sessions
    FOR ALL USING (true);

-- security_alerts 테이블 RLS
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own security alerts" ON security_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own security alerts" ON security_alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all security alerts" ON security_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert security alerts" ON security_alerts
    FOR INSERT WITH CHECK (true);

-- 나머지 테이블들도 유사한 RLS 정책 적용
-- (간결성을 위해 생략, 실제 구현 시 모든 테이블에 적용 필요)

COMMENT ON TABLE two_factor_auth IS '2단계 인증 설정';
COMMENT ON TABLE rate_limits IS '레이트 리미팅';
COMMENT ON TABLE audit_logs IS '감사 로그';
COMMENT ON TABLE security_events IS '보안 이벤트';
COMMENT ON TABLE blocked_ips IS '차단된 IP';
COMMENT ON TABLE login_attempts IS '로그인 시도';
COMMENT ON TABLE user_sessions IS '사용자 세션';
COMMENT ON TABLE security_policies IS '보안 정책';
COMMENT ON TABLE security_alerts IS '보안 알림';
COMMENT ON FUNCTION cleanup_old_security_data IS '오래된 보안 데이터 정리';
COMMENT ON FUNCTION apply_security_policies IS '보안 정책 자동 적용';
COMMENT ON FUNCTION detect_suspicious_activity IS '의심스러운 활동 감지';
COMMENT ON FUNCTION create_security_alert IS '보안 알림 생성';
