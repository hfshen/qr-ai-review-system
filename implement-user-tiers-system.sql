-- 사용자 등급 시스템 데이터베이스 스키마
-- 사용자 등급, 혜택, 진행 상황 관리

-- 0. updated_at 컬럼 자동 업데이트를 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. 사용자 등급 테이블
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

-- 2. 등급별 혜택 테이블
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

-- 3. 사용자 등급 히스토리 테이블
CREATE TABLE IF NOT EXISTS user_tier_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier_id UUID NOT NULL REFERENCES user_tiers(id) ON DELETE CASCADE,
    points_at_time INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('upgrade', 'downgrade', 'maintain')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 사용자 테이블에 등급 정보 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_id UUID REFERENCES user_tiers(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. 기본 사용자 등급 데이터 삽입
INSERT INTO user_tiers (name, level, min_points, max_points, benefits, color, icon) VALUES
('브론즈', 1, 0, 9999, ARRAY['기본 리뷰 작성', '포인트 적립', '마켓플레이스 이용'], '#CD7F32', '🥉'),
('실버', 2, 10000, 49999, ARRAY['브론즈 혜택', '5% 추가 포인트 보너스', '우선 고객 지원', '특별 이벤트 참여'], '#C0C0C0', '🥈'),
('골드', 3, 50000, 99999, ARRAY['실버 혜택', '10% 추가 포인트 보너스', '전용 고객 지원', 'VIP 이벤트 참여', '무료 프리미엄 기능'], '#FFD700', '🥇'),
('플래티넘', 4, 100000, 999999, ARRAY['골드 혜택', '15% 추가 포인트 보너스', '1:1 전담 고객 지원', '독점 이벤트 참여', '모든 프리미엄 기능 무료', '우선 신기능 체험'], '#E5E4E2', '💎'),
('다이아몬드', 5, 1000000, 9999999, ARRAY['플래티넘 혜택', '20% 추가 포인트 보너스', '24/7 전담 고객 지원', '독점 VIP 이벤트', '모든 기능 무제한 이용', '신기능 우선 체험', '개인 맞춤 서비스'], '#B9F2FF', '💠')
ON CONFLICT (level) DO NOTHING;

-- 6. 등급별 혜택 데이터 삽입
INSERT INTO tier_benefits (tier_id, benefit_type, benefit_value, benefit_description) 
SELECT 
    ut.id,
    'bonus',
    CASE ut.level
        WHEN 1 THEN 0
        WHEN 2 THEN 5
        WHEN 3 THEN 10
        WHEN 4 THEN 15
        WHEN 5 THEN 20
        ELSE 0
    END,
    CASE ut.level
        WHEN 1 THEN '기본 포인트 적립'
        WHEN 2 THEN '5% 추가 포인트 보너스'
        WHEN 3 THEN '10% 추가 포인트 보너스'
        WHEN 4 THEN '15% 추가 포인트 보너스'
        WHEN 5 THEN '20% 추가 포인트 보너스'
        ELSE '기본 포인트 적립'
    END
FROM user_tiers ut
ON CONFLICT DO NOTHING;

-- 7. 사용자 등급 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_user_tier_on_points_change()
RETURNS TRIGGER AS $$
DECLARE
    new_tier_id UUID;
    old_tier_id UUID;
    action_type VARCHAR(20);
BEGIN
    -- 새 포인트에 따른 등급 찾기
    SELECT id INTO new_tier_id
    FROM user_tiers
    WHERE NEW.points >= min_points AND NEW.points <= max_points
    ORDER BY level DESC
    LIMIT 1;
    
    -- 기존 등급 찾기
    SELECT tier_id INTO old_tier_id
    FROM users
    WHERE id = NEW.user_id;
    
    -- 등급 변경이 있는 경우
    IF new_tier_id IS NOT NULL AND (old_tier_id IS NULL OR old_tier_id != new_tier_id) THEN
        -- 액션 타입 결정
        IF old_tier_id IS NULL THEN
            action_type := 'upgrade';
        ELSE
            SELECT 
                CASE 
                    WHEN (SELECT level FROM user_tiers WHERE id = new_tier_id) > 
                         (SELECT level FROM user_tiers WHERE id = old_tier_id) 
                    THEN 'upgrade'
                    ELSE 'downgrade'
                END INTO action_type;
        END IF;
        
        -- 사용자 등급 업데이트
        UPDATE users 
        SET tier_id = new_tier_id, tier_updated_at = NOW()
        WHERE id = NEW.user_id;
        
        -- 등급 히스토리 기록
        INSERT INTO user_tier_history (user_id, tier_id, points_at_time, action)
        VALUES (NEW.user_id, new_tier_id, NEW.points, action_type);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. 사용자 포인트 변경 시 등급 업데이트 트리거
DROP TRIGGER IF EXISTS trigger_update_user_tier_on_points_change ON user_points;
CREATE TRIGGER trigger_update_user_tier_on_points_change
    AFTER INSERT OR UPDATE ON user_points
    FOR EACH ROW
    EXECUTE FUNCTION update_user_tier_on_points_change();

-- 9. RLS 정책 설정

-- user_tiers 테이블 RLS
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

-- tier_benefits 테이블 RLS
ALTER TABLE tier_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view tier benefits" ON tier_benefits
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage tier benefits" ON tier_benefits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- user_tier_history 테이블 RLS
ALTER TABLE user_tier_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tier history" ON user_tier_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tier history" ON user_tier_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 10. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_tiers_level ON user_tiers(level);
CREATE INDEX IF NOT EXISTS idx_user_tiers_points_range ON user_tiers(min_points, max_points);
CREATE INDEX IF NOT EXISTS idx_tier_benefits_tier_id ON tier_benefits(tier_id);
CREATE INDEX IF NOT EXISTS idx_tier_benefits_type ON tier_benefits(benefit_type);
CREATE INDEX IF NOT EXISTS idx_user_tier_history_user_id ON user_tier_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tier_history_created_at ON user_tier_history(created_at);
CREATE INDEX IF NOT EXISTS idx_users_tier_id ON users(tier_id);

-- 11. 기존 사용자들의 등급 초기화
UPDATE users 
SET tier_id = (SELECT id FROM user_tiers WHERE level = 1),
    tier_updated_at = NOW()
WHERE tier_id IS NULL;

-- 12. 뷰 생성 - 사용자 등급 정보 조회용
CREATE OR REPLACE VIEW user_tier_info AS
SELECT 
    u.id as user_id,
    u.display_name,
    u.email,
    up.points,
    ut.id as tier_id,
    ut.name as tier_name,
    ut.level as tier_level,
    ut.color as tier_color,
    ut.icon as tier_icon,
    ut.benefits as tier_benefits,
    u.tier_updated_at
FROM users u
LEFT JOIN user_points up ON u.id = up.user_id
LEFT JOIN user_tiers ut ON u.tier_id = ut.id;

-- 13. 함수 생성 - 사용자 등급 진행률 계산
CREATE OR REPLACE FUNCTION get_user_tier_progress(user_uuid UUID)
RETURNS TABLE (
    current_tier_id UUID,
    current_tier_name VARCHAR(50),
    current_tier_level INTEGER,
    current_tier_color VARCHAR(7),
    current_tier_icon VARCHAR(10),
    current_points INTEGER,
    next_tier_id UUID,
    next_tier_name VARCHAR(50),
    next_tier_level INTEGER,
    progress_percentage NUMERIC,
    points_to_next INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH user_data AS (
        SELECT 
            u.id,
            COALESCE(up.points, 0) as points,
            u.tier_id
        FROM users u
        LEFT JOIN user_points up ON u.id = up.user_id
        WHERE u.id = user_uuid
    ),
    current_tier AS (
        SELECT 
            ut.id,
            ut.name,
            ut.level,
            ut.color,
            ut.icon,
            ut.min_points,
            ut.max_points
        FROM user_tiers ut
        JOIN user_data ud ON ut.id = ud.tier_id
    ),
    next_tier AS (
        SELECT 
            ut.id,
            ut.name,
            ut.level,
            ut.min_points
        FROM user_tiers ut
        JOIN user_data ud ON ut.level > (SELECT level FROM current_tier)
        ORDER BY ut.level
        LIMIT 1
    )
    SELECT 
        ct.id,
        ct.name,
        ct.level,
        ct.color,
        ct.icon,
        ud.points,
        nt.id,
        nt.name,
        nt.level,
        CASE 
            WHEN nt.id IS NOT NULL THEN
                LEAST(100, GREATEST(0, 
                    ((ud.points - ct.min_points)::NUMERIC / 
                     (nt.min_points - ct.min_points)::NUMERIC) * 100
                ))
            ELSE 100
        END,
        CASE 
            WHEN nt.id IS NOT NULL THEN GREATEST(0, nt.min_points - ud.points)
            ELSE 0
        END
    FROM user_data ud
    JOIN current_tier ct ON true
    LEFT JOIN next_tier nt ON true;
END;
$$ LANGUAGE plpgsql;

-- 12. 트리거 설정
DROP TRIGGER IF EXISTS trigger_update_user_tiers_updated_at ON user_tiers;
CREATE TRIGGER trigger_update_user_tiers_updated_at
    BEFORE UPDATE ON user_tiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_tier_benefits_updated_at ON tier_benefits;
CREATE TRIGGER trigger_update_tier_benefits_updated_at
    BEFORE UPDATE ON tier_benefits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_tiers IS '사용자 등급 정보';
COMMENT ON TABLE tier_benefits IS '등급별 혜택 정보';
COMMENT ON TABLE user_tier_history IS '사용자 등급 변경 히스토리';
COMMENT ON VIEW user_tier_info IS '사용자 등급 정보 조회용 뷰';
COMMENT ON FUNCTION get_user_tier_progress IS '사용자 등급 진행률 계산 함수';
