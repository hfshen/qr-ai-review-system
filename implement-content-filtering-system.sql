-- 콘텐츠 필터링 시스템 데이터베이스 스키마
-- 스팸, 부적절한 콘텐츠, 욕설, 광고성 콘텐츠 필터링

-- 0. updated_at 컬럼 자동 업데이트를 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. 콘텐츠 필터 규칙 테이블
CREATE TABLE IF NOT EXISTS content_filters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    keyword VARCHAR(100) NOT NULL,
    filter_type VARCHAR(20) NOT NULL CHECK (filter_type IN ('spam', 'inappropriate', 'profanity', 'advertisement')),
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    action VARCHAR(10) NOT NULL CHECK (action IN ('block', 'flag', 'review')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 필터링된 콘텐츠 기록 테이블
CREATE TABLE IF NOT EXISTS filtered_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    filter_reason TEXT NOT NULL,
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    action_taken VARCHAR(10) NOT NULL CHECK (action_taken IN ('blocked', 'flagged', 'reviewed')),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
    admin_reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_review_status VARCHAR(20) CHECK (admin_review_status IN ('approved', 'rejected', 'pending')),
    admin_review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 3. 필터링 통계 테이블
CREATE TABLE IF NOT EXISTS filter_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    filter_type VARCHAR(20) NOT NULL,
    severity VARCHAR(10) NOT NULL,
    action_taken VARCHAR(10) NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, filter_type, severity, action_taken)
);

-- 4. 기본 필터 규칙 데이터 삽입
INSERT INTO content_filters (keyword, filter_type, severity, action) VALUES
-- 스팸 키워드
('무료', 'spam', 'low', 'flag'),
('공짜', 'spam', 'low', 'flag'),
('이벤트', 'spam', 'low', 'flag'),
('할인', 'spam', 'low', 'flag'),
('쿠폰', 'spam', 'low', 'flag'),
('적립', 'spam', 'low', 'flag'),
('포인트', 'spam', 'low', 'flag'),
('캐시백', 'spam', 'low', 'flag'),
('지금', 'spam', 'low', 'flag'),
('바로', 'spam', 'low', 'flag'),
('즉시', 'spam', 'low', 'flag'),
('당장', 'spam', 'low', 'flag'),
('지금만', 'spam', 'medium', 'flag'),
('한정', 'spam', 'medium', 'flag'),
('특가', 'spam', 'medium', 'flag'),
('세일', 'spam', 'medium', 'flag'),
('광고', 'spam', 'high', 'block'),
('홍보', 'spam', 'high', 'block'),
('마케팅', 'spam', 'high', 'block'),
('판매', 'spam', 'high', 'block'),
('구매', 'spam', 'high', 'block'),
('주문', 'spam', 'high', 'block'),
('결제', 'spam', 'high', 'block'),
('카드', 'spam', 'high', 'block'),
('대출', 'spam', 'high', 'block'),
('보험', 'spam', 'high', 'block'),
('투자', 'spam', 'high', 'block'),
('수익', 'spam', 'high', 'block'),
('부업', 'spam', 'high', 'block'),
('알바', 'spam', 'high', 'block'),
('재택', 'spam', 'high', 'block'),

-- 부적절한 콘텐츠
('폭력', 'inappropriate', 'medium', 'flag'),
('살인', 'inappropriate', 'high', 'block'),
('자살', 'inappropriate', 'high', 'block'),
('자해', 'inappropriate', 'high', 'block'),
('약물', 'inappropriate', 'high', 'block'),
('마약', 'inappropriate', 'high', 'block'),
('알코올', 'inappropriate', 'medium', 'flag'),
('음주', 'inappropriate', 'medium', 'flag'),
('도박', 'inappropriate', 'high', 'block'),
('사기', 'inappropriate', 'high', 'block'),
('절도', 'inappropriate', 'high', 'block'),
('강도', 'inappropriate', 'high', 'block'),
('성폭력', 'inappropriate', 'high', 'block'),
('성추행', 'inappropriate', 'high', 'block'),
('성희롱', 'inappropriate', 'high', 'block'),
('혐오', 'inappropriate', 'medium', 'flag'),
('차별', 'inappropriate', 'medium', 'flag'),
('인종차별', 'inappropriate', 'high', 'block'),
('성차별', 'inappropriate', 'high', 'block'),
('장애인차별', 'inappropriate', 'high', 'block'),
('연령차별', 'inappropriate', 'high', 'block'),

-- 욕설
('씨발', 'profanity', 'high', 'block'),
('개새끼', 'profanity', 'high', 'block'),
('병신', 'profanity', 'high', 'block'),
('지랄', 'profanity', 'high', 'block'),
('좆', 'profanity', 'high', 'block'),
('꺼져', 'profanity', 'medium', 'flag'),
('닥쳐', 'profanity', 'medium', 'flag'),
('죽어', 'profanity', 'high', 'block'),
('바보', 'profanity', 'low', 'flag'),
('멍청이', 'profanity', 'low', 'flag'),
('똥', 'profanity', 'low', 'flag'),
('오줌', 'profanity', 'low', 'flag'),
('씨', 'profanity', 'medium', 'flag'),
('개', 'profanity', 'low', 'flag'),
('놈', 'profanity', 'low', 'flag'),
('년', 'profanity', 'medium', 'flag'),
('새끼', 'profanity', 'medium', 'flag')
ON CONFLICT DO NOTHING;

-- 5. 필터링 통계 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_filter_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO filter_statistics (date, filter_type, severity, action_taken, count)
    VALUES (
        CURRENT_DATE,
        'general', -- NEW.filter_type이 없으므로 일반적으로 설정
        NEW.severity,
        NEW.action_taken,
        1
    )
    ON CONFLICT (date, filter_type, severity, action_taken)
    DO UPDATE SET count = filter_statistics.count + 1;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 필터링된 콘텐츠 기록 시 통계 업데이트 트리거
DROP TRIGGER IF EXISTS trigger_update_filter_statistics ON filtered_content;
CREATE TRIGGER trigger_update_filter_statistics
    AFTER INSERT ON filtered_content
    FOR EACH ROW
    EXECUTE FUNCTION update_filter_statistics();

-- 7. RLS 정책 설정

-- content_filters 테이블 RLS
ALTER TABLE content_filters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view active content filters" ON content_filters;
CREATE POLICY "Everyone can view active content filters" ON content_filters
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage content filters" ON content_filters;
CREATE POLICY "Admins can manage content filters" ON content_filters
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- filtered_content 테이블 RLS
ALTER TABLE filtered_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own filtered content" ON filtered_content
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all filtered content" ON filtered_content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert filtered content" ON filtered_content
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update filtered content" ON filtered_content
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- filter_statistics 테이블 RLS
ALTER TABLE filter_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view filter statistics" ON filter_statistics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can update filter statistics" ON filter_statistics
    FOR ALL USING (true);

-- 8. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_content_filters_type ON content_filters(filter_type);
CREATE INDEX IF NOT EXISTS idx_content_filters_severity ON content_filters(severity);
CREATE INDEX IF NOT EXISTS idx_content_filters_active ON content_filters(is_active);
CREATE INDEX IF NOT EXISTS idx_content_filters_keyword ON content_filters(keyword);
CREATE INDEX IF NOT EXISTS idx_filtered_content_user_id ON filtered_content(user_id);
CREATE INDEX IF NOT EXISTS idx_filtered_content_review_id ON filtered_content(review_id);
CREATE INDEX IF NOT EXISTS idx_filtered_content_severity ON filtered_content(severity);
CREATE INDEX IF NOT EXISTS idx_filtered_content_action ON filtered_content(action_taken);
CREATE INDEX IF NOT EXISTS idx_filtered_content_created_at ON filtered_content(created_at);
CREATE INDEX IF NOT EXISTS idx_filter_statistics_date ON filter_statistics(date);
CREATE INDEX IF NOT EXISTS idx_filter_statistics_type ON filter_statistics(filter_type);

-- 9. 함수 생성 - 콘텐츠 필터링
CREATE OR REPLACE FUNCTION check_content_filters(content_text TEXT)
RETURNS TABLE (
    is_blocked BOOLEAN,
    is_flagged BOOLEAN,
    severity VARCHAR(10),
    reasons TEXT[],
    suggested_action VARCHAR(10)
) AS $$
DECLARE
    found_filters RECORD;
    max_severity_level INTEGER := 0;
    result_severity VARCHAR(10) := 'low';
    result_reasons TEXT[] := '{}';
    result_is_blocked BOOLEAN := false;
    result_is_flagged BOOLEAN := false;
    result_suggested_action VARCHAR(10) := 'allow';
BEGIN
    -- 활성화된 필터 규칙 검사
    FOR found_filters IN 
        SELECT keyword, filter_type, severity, action
        FROM content_filters
        WHERE is_active = true 
        AND LOWER(content_text) LIKE '%' || LOWER(keyword) || '%'
    LOOP
        -- 심각도 레벨 계산
        IF found_filters.severity = 'low' THEN
            max_severity_level := GREATEST(max_severity_level, 1);
        ELSIF found_filters.severity = 'medium' THEN
            max_severity_level := GREATEST(max_severity_level, 2);
        ELSIF found_filters.severity = 'high' THEN
            max_severity_level := GREATEST(max_severity_level, 3);
        END IF;
        
        -- 이유 추가
        result_reasons := result_reasons || 
            (found_filters.filter_type || ' 키워드 발견: ' || found_filters.keyword);
    END LOOP;
    
    -- 최종 심각도 결정
    IF max_severity_level >= 3 THEN
        result_severity := 'high';
        result_is_blocked := true;
        result_suggested_action := 'block';
    ELSIF max_severity_level >= 2 THEN
        result_severity := 'medium';
        result_is_flagged := true;
        result_suggested_action := 'flag';
    ELSIF max_severity_level >= 1 THEN
        result_severity := 'low';
        result_is_flagged := true;
        result_suggested_action := 'review';
    ELSE
        result_severity := 'low';
        result_suggested_action := 'allow';
    END IF;
    
    RETURN QUERY SELECT 
        result_is_blocked,
        result_is_flagged,
        result_severity,
        result_reasons,
        result_suggested_action;
END;
$$ LANGUAGE plpgsql;

-- 10. 함수 생성 - 필터링 통계 조회
CREATE OR REPLACE FUNCTION get_filter_statistics(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    date DATE,
    filter_type VARCHAR(20),
    severity VARCHAR(10),
    action_taken VARCHAR(10),
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fs.date,
        fs.filter_type,
        fs.severity,
        fs.action_taken,
        SUM(fs.count) as total_count
    FROM filter_statistics fs
    WHERE fs.date BETWEEN start_date AND end_date
    GROUP BY fs.date, fs.filter_type, fs.severity, fs.action_taken
    ORDER BY fs.date DESC, fs.filter_type, fs.severity;
END;
$$ LANGUAGE plpgsql;

-- 11. 트리거 설정
DROP TRIGGER IF EXISTS trigger_update_content_filters_updated_at ON content_filters;
CREATE TRIGGER trigger_update_content_filters_updated_at
    BEFORE UPDATE ON content_filters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE content_filters IS '콘텐츠 필터 규칙';
COMMENT ON TABLE filtered_content IS '필터링된 콘텐츠 기록';
COMMENT ON TABLE filter_statistics IS '필터링 통계';
COMMENT ON FUNCTION check_content_filters IS '콘텐츠 필터링 검사 함수';
COMMENT ON FUNCTION get_filter_statistics IS '필터링 통계 조회 함수';
