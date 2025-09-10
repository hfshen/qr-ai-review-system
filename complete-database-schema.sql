-- =====================================================
-- QR AI 리뷰 시스템 - 통합 데이터베이스 스키마
-- 모든 기능을 포함한 완전한 SQL 스크립트
-- =====================================================

-- 0. updated_at 컬럼 자동 업데이트를 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 1. 고급 AI 기능 데이터베이스 스키마
-- =====================================================

-- 1.1 감정 분석 결과 테이블
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

-- 1.2 리뷰 품질 평가 테이블
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

-- 1.3 사용자 AI 프로필 테이블
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

-- 1.4 개인화된 리뷰 테이블
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

-- 1.5 AI 추천 키워드 테이블
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

-- 1.6 AI 모델 사용 통계 테이블
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

-- =====================================================
-- 2. 성능 모니터링 시스템 데이터베이스 스키마
-- =====================================================

-- 2.1 성능 메트릭 테이블
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    response_time INTEGER NOT NULL,
    status_code INTEGER NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.2 시스템 헬스 체크 테이블
CREATE TABLE IF NOT EXISTS system_health (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    check_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'warning', 'critical')),
    response_time INTEGER,
    error_message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.3 캐시 통계 테이블
CREATE TABLE IF NOT EXISTS cache_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL,
    cache_type VARCHAR(50) NOT NULL,
    hit_count INTEGER NOT NULL DEFAULT 0,
    miss_count INTEGER NOT NULL DEFAULT 0,
    hit_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. 다국어 지원 시스템 데이터베이스 스키마
-- =====================================================

-- 3.1 지원 언어 테이블
CREATE TABLE IF NOT EXISTS supported_languages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(5) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    native_name VARCHAR(50) NOT NULL,
    flag VARCHAR(10) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.2 번역 키 테이블
CREATE TABLE IF NOT EXISTS translation_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL DEFAULT 'common',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.3 번역 값 테이블
CREATE TABLE IF NOT EXISTS translation_values (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key_id UUID NOT NULL REFERENCES translation_keys(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL REFERENCES supported_languages(code) ON DELETE CASCADE,
    value TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(key_id, language_code)
);

-- 3.4 사용자 언어 설정 테이블
CREATE TABLE IF NOT EXISTS user_language_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL REFERENCES supported_languages(code) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, language_code)
);

-- =====================================================
-- 4. 콘텐츠 필터링 시스템 데이터베이스 스키마
-- =====================================================

-- 4.1 콘텐츠 필터 규칙 테이블
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

-- =====================================================
-- 5. 사용자 등급 시스템 데이터베이스 스키마
-- =====================================================

-- 5.1 사용자 등급 테이블
CREATE TABLE IF NOT EXISTS user_tiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    level INTEGER NOT NULL UNIQUE,
    min_points INTEGER NOT NULL,
    max_points INTEGER NOT NULL,
    benefits TEXT[] NOT NULL DEFAULT '{}',
    color VARCHAR(7) NOT NULL DEFAULT '#CD7F32',
    icon VARCHAR(10) NOT NULL DEFAULT '🥉',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5.2 등급별 혜택 테이블
CREATE TABLE IF NOT EXISTS tier_benefits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tier_id UUID NOT NULL REFERENCES user_tiers(id) ON DELETE CASCADE,
    benefit_type VARCHAR(20) NOT NULL CHECK (benefit_type IN ('discount', 'bonus', 'feature', 'priority')),
    benefit_value INTEGER NOT NULL DEFAULT 0,
    benefit_description TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. 고급 분석 및 리포팅 시스템 데이터베이스 스키마
-- =====================================================

-- 6.1 사용자 정의 리포트 테이블
CREATE TABLE IF NOT EXISTS custom_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    filters JSONB NOT NULL DEFAULT '{}',
    metrics TEXT[] NOT NULL DEFAULT '{}',
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. 비즈니스 기능 데이터베이스 스키마
-- =====================================================

-- 7.1 구독 플랜 테이블
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    features TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7.2 사용자 구독 테이블
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. 보안 강화 시스템 데이터베이스 스키마
-- =====================================================

-- 8.1 2단계 인증 테이블
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

-- =====================================================
-- 모든 트리거 설정 (중복 방지)
-- =====================================================

-- AI 기능 트리거
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

-- 성능 모니터링 트리거
DROP TRIGGER IF EXISTS trigger_update_cache_stats_updated_at ON cache_stats;
CREATE TRIGGER trigger_update_cache_stats_updated_at
    BEFORE UPDATE ON cache_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 다국어 지원 트리거
DROP TRIGGER IF EXISTS trigger_update_supported_languages_updated_at ON supported_languages;
CREATE TRIGGER trigger_update_supported_languages_updated_at
    BEFORE UPDATE ON supported_languages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_translation_keys_updated_at ON translation_keys;
CREATE TRIGGER trigger_update_translation_keys_updated_at
    BEFORE UPDATE ON translation_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_translation_values_updated_at ON translation_values;
CREATE TRIGGER trigger_update_translation_values_updated_at
    BEFORE UPDATE ON translation_values
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_user_language_settings_updated_at ON user_language_settings;
CREATE TRIGGER trigger_update_user_language_settings_updated_at
    BEFORE UPDATE ON user_language_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 콘텐츠 필터링 트리거
DROP TRIGGER IF EXISTS trigger_update_content_filters_updated_at ON content_filters;
CREATE TRIGGER trigger_update_content_filters_updated_at
    BEFORE UPDATE ON content_filters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 사용자 등급 트리거
DROP TRIGGER IF EXISTS trigger_update_user_tiers_updated_at ON user_tiers;
CREATE TRIGGER trigger_update_user_tiers_updated_at
    BEFORE UPDATE ON user_tiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_tier_benefits_updated_at ON tier_benefits;
CREATE TRIGGER trigger_update_tier_benefits_updated_at
    BEFORE UPDATE ON tier_benefits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 고급 분석 트리거
DROP TRIGGER IF EXISTS trigger_update_custom_reports_updated_at ON custom_reports;
CREATE TRIGGER trigger_update_custom_reports_updated_at
    BEFORE UPDATE ON custom_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 비즈니스 기능 트리거
DROP TRIGGER IF EXISTS trigger_update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER trigger_update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER trigger_update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 보안 강화 트리거
DROP TRIGGER IF EXISTS trigger_update_two_factor_auth_updated_at ON two_factor_auth;
CREATE TRIGGER trigger_update_two_factor_auth_updated_at
    BEFORE UPDATE ON two_factor_auth
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 모든 RLS 정책 설정 (중복 방지)
-- =====================================================

-- AI 기능 RLS 정책
ALTER TABLE sentiment_analysis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own sentiment analysis" ON sentiment_analysis;
CREATE POLICY "Users can view their own sentiment analysis" ON sentiment_analysis
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all sentiment analysis" ON sentiment_analysis;
CREATE POLICY "Admins can view all sentiment analysis" ON sentiment_analysis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "System can insert sentiment analysis" ON sentiment_analysis;
CREATE POLICY "System can insert sentiment analysis" ON sentiment_analysis
    FOR INSERT WITH CHECK (true);

-- 성능 모니터링 RLS 정책
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all performance metrics" ON performance_metrics;
CREATE POLICY "Admins can view all performance metrics" ON performance_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "System can insert performance metrics" ON performance_metrics;
CREATE POLICY "System can insert performance metrics" ON performance_metrics
    FOR INSERT WITH CHECK (true);

-- 다국어 지원 RLS 정책
ALTER TABLE supported_languages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view active languages" ON supported_languages;
CREATE POLICY "Everyone can view active languages" ON supported_languages
    FOR SELECT USING (is_active = true);

-- 콘텐츠 필터링 RLS 정책
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

-- 사용자 등급 RLS 정책
ALTER TABLE user_tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view user tiers" ON user_tiers;
CREATE POLICY "Everyone can view user tiers" ON user_tiers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage user tiers" ON user_tiers;
CREATE POLICY "Admins can manage user tiers" ON user_tiers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 고급 분석 RLS 정책
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own custom reports" ON custom_reports;
CREATE POLICY "Users can view their own custom reports" ON custom_reports
    FOR SELECT USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can view all custom reports" ON custom_reports;
CREATE POLICY "Admins can view all custom reports" ON custom_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 보안 강화 RLS 정책
ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own 2FA settings" ON two_factor_auth;
CREATE POLICY "Users can view their own 2FA settings" ON two_factor_auth
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own 2FA settings" ON two_factor_auth;
CREATE POLICY "Users can update their own 2FA settings" ON two_factor_auth
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own 2FA settings" ON two_factor_auth;
CREATE POLICY "Users can insert their own 2FA settings" ON two_factor_auth
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 완료 메시지
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'QR AI 리뷰 시스템 데이터베이스 스키마가 성공적으로 생성되었습니다!';
    RAISE NOTICE '모든 테이블, 트리거, RLS 정책이 중복 방지 처리되었습니다.';
END $$;
