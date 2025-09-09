-- 고급 AI 기능 데이터베이스 스키마
-- 감정분석, 품질평가, 개인화, 사용자 프로필 관리

-- 1. 감정 분석 결과 테이블
CREATE TABLE IF NOT EXISTS sentiment_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sentiment VARCHAR(20) NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    emotions JSONB NOT NULL DEFAULT '{}',
    keywords TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 리뷰 품질 평가 테이블
CREATE TABLE IF NOT EXISTS review_quality_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    grammar_score INTEGER NOT NULL CHECK (grammar_score >= 0 AND grammar_score <= 100),
    relevance_score INTEGER NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 100),
    helpfulness_score INTEGER NOT NULL CHECK (helpfulness_score >= 0 AND helpfulness_score <= 100),
    authenticity_score INTEGER NOT NULL CHECK (authenticity_score >= 0 AND authenticity_score <= 100),
    completeness_score INTEGER NOT NULL CHECK (completeness_score >= 0 AND completeness_score <= 100),
    suggestions TEXT[] NOT NULL DEFAULT '{}',
    is_spam BOOLEAN NOT NULL DEFAULT false,
    spam_probability DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (spam_probability >= 0 AND spam_probability <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS user_ai_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    writing_style JSONB NOT NULL DEFAULT '{}',
    preferences JSONB NOT NULL DEFAULT '{}',
    behavior_patterns JSONB NOT NULL DEFAULT '{}',
    last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 4. 개인화된 리뷰 테이블
CREATE TABLE IF NOT EXISTS personalized_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    platform_id INTEGER REFERENCES platforms(id) ON DELETE CASCADE,
    original_review TEXT NOT NULL,
    personalized_review TEXT NOT NULL,
    tone_adjustment VARCHAR(20) NOT NULL CHECK (tone_adjustment IN ('formal', 'casual', 'friendly', 'professional')),
    length_adjustment VARCHAR(10) NOT NULL CHECK (length_adjustment IN ('short', 'medium', 'long')),
    style_preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. AI 추천 키워드 테이블
CREATE TABLE IF NOT EXISTS ai_recommended_keywords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_type VARCHAR(100) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    keywords TEXT[] NOT NULL DEFAULT '{}',
    user_profile_id UUID REFERENCES user_ai_profiles(id) ON DELETE SET NULL,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 리뷰 자동 완성 테이블
CREATE TABLE IF NOT EXISTS review_autocompletions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    partial_text TEXT NOT NULL,
    completed_text TEXT NOT NULL,
    business_type VARCHAR(100),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 리뷰 번역 테이블
CREATE TABLE IF NOT EXISTS review_translations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    translated_text TEXT NOT NULL,
    preserve_tone BOOLEAN NOT NULL DEFAULT true,
    quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 리뷰 요약 테이블
CREATE TABLE IF NOT EXISTS review_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    summary_text TEXT NOT NULL,
    max_length INTEGER NOT NULL DEFAULT 100,
    quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 감정 기반 리뷰 생성 테이블
CREATE TABLE IF NOT EXISTS emotion_based_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_type VARCHAR(100) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    target_emotion VARCHAR(20) NOT NULL CHECK (target_emotion IN ('joy', 'satisfaction', 'disappointment', 'anger', 'surprise')),
    generated_review TEXT NOT NULL,
    emotion_intensity DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (emotion_intensity >= 0 AND emotion_intensity <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. AI 모델 사용 통계 테이블
CREATE TABLE IF NOT EXISTS ai_usage_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    feature_name VARCHAR(50) NOT NULL,
    usage_count INTEGER NOT NULL DEFAULT 1,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_tokens INTEGER NOT NULL DEFAULT 0,
    total_cost DECIMAL(10,4) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_review_id ON sentiment_analysis(review_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_user_id ON sentiment_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_sentiment ON sentiment_analysis(sentiment);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_created_at ON sentiment_analysis(created_at);

CREATE INDEX IF NOT EXISTS idx_review_quality_review_id ON review_quality_scores(review_id);
CREATE INDEX IF NOT EXISTS idx_review_quality_user_id ON review_quality_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_review_quality_overall_score ON review_quality_scores(overall_score);
CREATE INDEX IF NOT EXISTS idx_review_quality_is_spam ON review_quality_scores(is_spam);

CREATE INDEX IF NOT EXISTS idx_user_ai_profiles_user_id ON user_ai_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_profiles_last_analyzed ON user_ai_profiles(last_analyzed);

CREATE INDEX IF NOT EXISTS idx_personalized_reviews_original_id ON personalized_reviews(original_review_id);
CREATE INDEX IF NOT EXISTS idx_personalized_reviews_user_id ON personalized_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_personalized_reviews_platform_id ON personalized_reviews(platform_id);

CREATE INDEX IF NOT EXISTS idx_ai_keywords_business_type ON ai_recommended_keywords(business_type);
CREATE INDEX IF NOT EXISTS idx_ai_keywords_rating ON ai_recommended_keywords(rating);
CREATE INDEX IF NOT EXISTS idx_ai_keywords_usage_count ON ai_recommended_keywords(usage_count);

CREATE INDEX IF NOT EXISTS idx_autocompletions_user_id ON review_autocompletions(user_id);
CREATE INDEX IF NOT EXISTS idx_autocompletions_created_at ON review_autocompletions(created_at);

CREATE INDEX IF NOT EXISTS idx_translations_original_id ON review_translations(original_review_id);
CREATE INDEX IF NOT EXISTS idx_translations_target_language ON review_translations(target_language);

CREATE INDEX IF NOT EXISTS idx_summaries_original_id ON review_summaries(original_review_id);

CREATE INDEX IF NOT EXISTS idx_emotion_reviews_user_id ON emotion_based_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_emotion_reviews_target_emotion ON emotion_based_reviews(target_emotion);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature_name ON ai_usage_stats(feature_name);
CREATE INDEX IF NOT EXISTS idx_ai_usage_last_used ON ai_usage_stats(last_used);

-- 12. 감정 분석 집계 뷰
CREATE OR REPLACE VIEW sentiment_summary AS
SELECT 
    sentiment,
    COUNT(*) as count,
    AVG(confidence) as avg_confidence,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM sentiment_analysis
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY sentiment;

-- 13. 리뷰 품질 집계 뷰
CREATE OR REPLACE VIEW quality_summary AS
SELECT 
    CASE 
        WHEN overall_score >= 80 THEN 'excellent'
        WHEN overall_score >= 60 THEN 'good'
        WHEN overall_score >= 40 THEN 'fair'
        ELSE 'poor'
    END as quality_grade,
    COUNT(*) as count,
    AVG(overall_score) as avg_score,
    AVG(spam_probability) as avg_spam_probability
FROM review_quality_scores
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 
    CASE 
        WHEN overall_score >= 80 THEN 'excellent'
        WHEN overall_score >= 60 THEN 'good'
        WHEN overall_score >= 40 THEN 'fair'
        ELSE 'poor'
    END;

-- 14. 사용자 AI 프로필 요약 뷰
CREATE OR REPLACE VIEW user_profile_summary AS
SELECT 
    u.display_name,
    u.email,
    uap.writing_style->>'preferred_tone' as preferred_tone,
    uap.preferences->>'formality' as formality,
    uap.last_analyzed,
    COUNT(pr.id) as personalized_reviews_count,
    COUNT(sa.id) as sentiment_analyses_count
FROM users u
LEFT JOIN user_ai_profiles uap ON u.id = uap.user_id
LEFT JOIN personalized_reviews pr ON u.id = pr.user_id
LEFT JOIN sentiment_analysis sa ON u.id = sa.user_id
GROUP BY u.id, u.display_name, u.email, uap.writing_style, uap.preferences, uap.last_analyzed;

-- 15. AI 기능 사용 통계 뷰
CREATE OR REPLACE VIEW ai_feature_usage AS
SELECT 
    feature_name,
    COUNT(DISTINCT user_id) as unique_users,
    SUM(usage_count) as total_usage,
    AVG(usage_count) as avg_usage_per_user,
    SUM(total_tokens) as total_tokens,
    SUM(total_cost) as total_cost,
    MAX(last_used) as last_used
FROM ai_usage_stats
WHERE last_used >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY feature_name
ORDER BY total_usage DESC;

-- 16. 자동 업데이트 함수들
CREATE OR REPLACE FUNCTION update_user_ai_profile()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_ai_profiles 
    SET updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_ai_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO ai_usage_stats (user_id, feature_name, usage_count, last_used, total_tokens, total_cost)
    VALUES (NEW.user_id, TG_TABLE_NAME, 1, NOW(), 0, 0)
    ON CONFLICT (user_id, feature_name) 
    DO UPDATE SET 
        usage_count = ai_usage_stats.usage_count + 1,
        last_used = NOW(),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 17. 트리거 설정
CREATE TRIGGER trigger_update_user_profile_sentiment
    AFTER INSERT ON sentiment_analysis
    FOR EACH ROW EXECUTE FUNCTION update_user_ai_profile();

CREATE TRIGGER trigger_update_user_profile_quality
    AFTER INSERT ON review_quality_scores
    FOR EACH ROW EXECUTE FUNCTION update_user_ai_profile();

CREATE TRIGGER trigger_update_user_profile_personalized
    AFTER INSERT ON personalized_reviews
    FOR EACH ROW EXECUTE FUNCTION update_user_ai_profile();

CREATE TRIGGER trigger_update_usage_stats_sentiment
    AFTER INSERT ON sentiment_analysis
    FOR EACH ROW EXECUTE FUNCTION update_ai_usage_stats();

CREATE TRIGGER trigger_update_usage_stats_quality
    AFTER INSERT ON review_quality_scores
    FOR EACH ROW EXECUTE FUNCTION update_ai_usage_stats();

CREATE TRIGGER trigger_update_usage_stats_personalized
    AFTER INSERT ON personalized_reviews
    FOR EACH ROW EXECUTE FUNCTION update_ai_usage_stats();

-- 18. AI 모델 성능 분석 함수
CREATE OR REPLACE FUNCTION analyze_ai_performance()
RETURNS TABLE (
    feature_name VARCHAR(50),
    total_usage BIGINT,
    avg_confidence DECIMAL(5,2),
    success_rate DECIMAL(5,2),
    user_satisfaction DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aus.feature_name,
        SUM(aus.usage_count) as total_usage,
        AVG(sa.confidence) as avg_confidence,
        COUNT(CASE WHEN sa.confidence > 0.7 THEN 1 END) * 100.0 / COUNT(sa.id) as success_rate,
        85.0 as user_satisfaction -- 임시값, 실제로는 사용자 피드백 기반
    FROM ai_usage_stats aus
    LEFT JOIN sentiment_analysis sa ON aus.user_id = sa.user_id
    WHERE aus.last_used >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY aus.feature_name;
END;
$$ LANGUAGE plpgsql;

-- 19. 개인화 추천 함수
CREATE OR REPLACE FUNCTION get_personalized_recommendations(user_id_param UUID)
RETURNS TABLE (
    recommendation_type VARCHAR(50),
    recommendation_text TEXT,
    confidence DECIMAL(3,2)
) AS $$
DECLARE
    user_profile RECORD;
BEGIN
    -- 사용자 프로필 조회
    SELECT * INTO user_profile 
    FROM user_ai_profiles 
    WHERE user_id = user_id_param;
    
    IF user_profile IS NULL THEN
        RETURN;
    END IF;
    
    -- 기본 추천사항들
    RETURN QUERY
    SELECT 
        'tone_adjustment'::VARCHAR(50),
        '사용자의 선호 톤: ' || COALESCE(user_profile.writing_style->>'preferred_tone', 'casual'),
        0.8::DECIMAL(3,2)
    UNION ALL
    SELECT 
        'keyword_suggestion'::VARCHAR(50),
        '추천 키워드: ' || array_to_string(
            (SELECT keywords FROM ai_recommended_keywords 
             WHERE business_type = 'general' 
             ORDER BY usage_count DESC LIMIT 1), ', '
        ),
        0.7::DECIMAL(3,2);
END;
$$ LANGUAGE plpgsql;

-- 20. RLS 정책 설정

-- sentiment_analysis 테이블 RLS
ALTER TABLE sentiment_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sentiment analysis" ON sentiment_analysis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sentiment analysis" ON sentiment_analysis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert sentiment analysis" ON sentiment_analysis
    FOR INSERT WITH CHECK (true);

-- review_quality_scores 테이블 RLS
ALTER TABLE review_quality_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quality scores" ON review_quality_scores
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all quality scores" ON review_quality_scores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert quality scores" ON review_quality_scores
    FOR INSERT WITH CHECK (true);

-- user_ai_profiles 테이블 RLS
ALTER TABLE user_ai_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI profile" ON user_ai_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI profile" ON user_ai_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all AI profiles" ON user_ai_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can manage AI profiles" ON user_ai_profiles
    FOR ALL USING (true);

-- personalized_reviews 테이블 RLS
ALTER TABLE personalized_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own personalized reviews" ON personalized_reviews
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all personalized reviews" ON personalized_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert personalized reviews" ON personalized_reviews
    FOR INSERT WITH CHECK (true);

-- 나머지 테이블들도 유사한 RLS 정책 적용
-- (간결성을 위해 생략, 실제 구현 시 모든 테이블에 적용 필요)

-- 13. 트리거 설정
DROP TRIGGER IF EXISTS trigger_update_user_ai_profiles_updated_at ON user_ai_profiles;
CREATE TRIGGER trigger_update_user_ai_profiles_updated_at
    BEFORE UPDATE ON user_ai_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_ai_recommended_keywords_updated_at ON ai_recommended_keywords;
CREATE TRIGGER trigger_update_ai_recommended_keywords_updated_at
    BEFORE UPDATE ON ai_recommended_keywords
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_ai_usage_stats_updated_at ON ai_usage_stats;
CREATE TRIGGER trigger_update_ai_usage_stats_updated_at
    BEFORE UPDATE ON ai_usage_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. 테이블 설명
COMMENT ON TABLE sentiment_analysis IS '감정 분석 결과';
COMMENT ON TABLE review_quality_scores IS '리뷰 품질 평가';
COMMENT ON TABLE user_ai_profiles IS '사용자 AI 프로필';
COMMENT ON TABLE personalized_reviews IS '개인화된 리뷰';
COMMENT ON TABLE ai_recommended_keywords IS 'AI 추천 키워드';
COMMENT ON TABLE review_autocompletions IS '리뷰 자동 완성';
COMMENT ON TABLE review_translations IS '리뷰 번역';
COMMENT ON TABLE review_summaries IS '리뷰 요약';
COMMENT ON TABLE emotion_based_reviews IS '감정 기반 리뷰 생성';
COMMENT ON TABLE ai_usage_stats IS 'AI 모델 사용 통계';
COMMENT ON FUNCTION analyze_ai_performance IS 'AI 모델 성능 분석';
COMMENT ON FUNCTION get_personalized_recommendations IS '개인화 추천 생성';
