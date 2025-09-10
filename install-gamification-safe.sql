-- 🚀 QR AI 리뷰 시스템 - 게임화 기능 안전 설치 스크립트
-- 기존 데이터를 보존하면서 안전하게 설치

-- ========================================
-- 1단계: user_points 테이블 확인 및 수정
-- ========================================

-- user_points 테이블 구조 확인
DO $$
DECLARE
    has_source_column BOOLEAN;
    has_id_column BOOLEAN;
BEGIN
    -- source 컬럼 존재 여부 확인
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_points' AND column_name = 'source'
    ) INTO has_source_column;
    
    -- id 컬럼 존재 여부 확인
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_points' AND column_name = 'id'
    ) INTO has_id_column;
    
    -- source 컬럼이 없으면 추가
    IF NOT has_source_column THEN
        ALTER TABLE user_points ADD COLUMN source VARCHAR(100) DEFAULT 'legacy';
        ALTER TABLE user_points ADD COLUMN description TEXT;
        ALTER TABLE user_points ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- 기존 데이터 업데이트
        UPDATE user_points SET source = 'initial_balance', description = '초기 잔액' WHERE source = 'legacy';
        
        RAISE NOTICE 'user_points 테이블에 source 컬럼 추가 완료';
    END IF;
    
    -- id 컬럼이 없으면 추가
    IF NOT has_id_column THEN
        ALTER TABLE user_points ADD COLUMN id UUID DEFAULT gen_random_uuid();
        ALTER TABLE user_points ADD CONSTRAINT user_points_pkey PRIMARY KEY (id);
        
        RAISE NOTICE 'user_points 테이블에 id 컬럼 추가 완료';
    END IF;
END $$;

-- ========================================
-- 2단계: 게임화 테이블 생성
-- ========================================

-- 사용자 캡션 히스토리
CREATE TABLE IF NOT EXISTS user_caption_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform_id TEXT NOT NULL,
  content TEXT NOT NULL,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  rating INTEGER,
  keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 포스팅 추적 테이블
CREATE TABLE IF NOT EXISTS posting_tracker (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform_id TEXT NOT NULL,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'shared', 'posted', 'failed')) DEFAULT 'pending',
  shared_at TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  engagement JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 배지 테이블
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT,
  badge_color TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 사용자 레벨 테이블
CREATE TABLE IF NOT EXISTS user_levels (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  total_points INTEGER NOT NULL DEFAULT 0,
  level_name TEXT NOT NULL DEFAULT '리뷰 초보',
  benefits TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 소셜 증명 통계 테이블
CREATE TABLE IF NOT EXISTS social_proof_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform_id TEXT NOT NULL,
  date DATE NOT NULL,
  total_shares INTEGER DEFAULT 0,
  total_posts INTEGER DEFAULT 0,
  success_rate NUMERIC DEFAULT 0,
  avg_engagement NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(platform_id, date)
);

-- ========================================
-- 3단계: 인덱스 생성
-- ========================================

CREATE INDEX IF NOT EXISTS idx_user_caption_history_user_id ON user_caption_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_caption_history_platform_id ON user_caption_history(platform_id);
CREATE INDEX IF NOT EXISTS idx_posting_tracker_user_id ON posting_tracker(user_id);
CREATE INDEX IF NOT EXISTS idx_posting_tracker_platform_id ON posting_tracker(platform_id);
CREATE INDEX IF NOT EXISTS idx_posting_tracker_status ON posting_tracker(status);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_social_proof_stats_date ON social_proof_stats(date);

-- ========================================
-- 4단계: RLS 정책 설정
-- ========================================

-- RLS 활성화
ALTER TABLE user_caption_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_proof_stats ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own caption history" ON user_caption_history;
DROP POLICY IF EXISTS "Users can insert their own caption history" ON user_caption_history;
DROP POLICY IF EXISTS "Users can view their own posting tracker" ON posting_tracker;
DROP POLICY IF EXISTS "Users can insert their own posting tracker" ON posting_tracker;
DROP POLICY IF EXISTS "Users can update their own posting tracker" ON posting_tracker;
DROP POLICY IF EXISTS "Users can view their own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can insert their own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can view their own level" ON user_levels;
DROP POLICY IF EXISTS "Users can update their own level" ON user_levels;
DROP POLICY IF EXISTS "Admins can view all caption history" ON user_caption_history;
DROP POLICY IF EXISTS "Admins can view all posting tracker" ON posting_tracker;
DROP POLICY IF EXISTS "Admins can view all badges" ON user_badges;
DROP POLICY IF EXISTS "Admins can view all levels" ON user_levels;
DROP POLICY IF EXISTS "Everyone can view social proof stats" ON social_proof_stats;

-- 새로운 정책 생성
CREATE POLICY "Users can view their own caption history" ON user_caption_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own caption history" ON user_caption_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own posting tracker" ON posting_tracker
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own posting tracker" ON posting_tracker
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own posting tracker" ON posting_tracker
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view their own badges" ON user_badges
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own badges" ON user_badges
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own level" ON user_levels
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own level" ON user_levels
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all caption history" ON user_caption_history
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can view all posting tracker" ON posting_tracker
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can view all badges" ON user_badges
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can view all levels" ON user_levels
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Everyone can view social proof stats" ON social_proof_stats
  FOR SELECT USING (true);

-- ========================================
-- 5단계: 트리거 함수 생성
-- ========================================

-- 사용자 포인트 업데이트 시 레벨 자동 계산
CREATE OR REPLACE FUNCTION update_user_level() RETURNS TRIGGER AS $$
DECLARE
  total_points INTEGER;
  new_level INTEGER;
  level_name TEXT;
  benefits TEXT[];
BEGIN
  -- 사용자의 총 포인트 계산
  SELECT COALESCE(SUM(points), 0) INTO total_points
  FROM user_points
  WHERE user_id = NEW.user_id;

  -- 레벨 계산
  IF total_points >= 1000 THEN
    new_level := 5;
    level_name := '리뷰 레전드';
    benefits := ARRAY['+50% 보너스 포인트', '전용 기능'];
  ELSIF total_points >= 600 THEN
    new_level := 4;
    level_name := '리뷰 마스터';
    benefits := ARRAY['+30% 보너스 포인트', 'VIP 혜택'];
  ELSIF total_points >= 300 THEN
    new_level := 3;
    level_name := '리뷰 전문가';
    benefits := ARRAY['+20% 보너스 포인트', '우선 지원'];
  ELSIF total_points >= 100 THEN
    new_level := 2;
    level_name := '리뷰 애호가';
    benefits := ARRAY['+10% 보너스 포인트', '특별 배지'];
  ELSE
    new_level := 1;
    level_name := '리뷰 초보';
    benefits := ARRAY['기본 포인트 획득'];
  END IF;

  -- 사용자 레벨 업데이트 또는 생성
  INSERT INTO user_levels (user_id, level, total_points, level_name, benefits, updated_at)
    VALUES (NEW.user_id, new_level, total_points, level_name, benefits, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      level = new_level,
      total_points = total_points,
      level_name = level_name,
      benefits = benefits,
      updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 포인트 추가 시 레벨 업데이트 트리거
DROP TRIGGER IF EXISTS trg_update_user_level ON user_points;
CREATE TRIGGER trg_update_user_level
  AFTER INSERT ON user_points
  FOR EACH ROW
  EXECUTE FUNCTION update_user_level();

-- ========================================
-- 6단계: 초기 데이터 설정
-- ========================================

-- 모든 사용자의 초기 레벨 설정
INSERT INTO user_levels (user_id, level, total_points, level_name, benefits)
SELECT id, 1, 0, '리뷰 초보', ARRAY['기본 포인트 획득']
FROM users
WHERE id NOT IN (SELECT user_id FROM user_levels)
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- 설치 완료 메시지
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '🎉 QR AI 리뷰 시스템 게임화 기능 설치 완료!';
  RAISE NOTICE '✅ user_points 테이블 구조 확인 및 수정 완료';
  RAISE NOTICE '✅ 게임화 테이블 생성 완료';
  RAISE NOTICE '✅ RLS 정책 설정 완료';
  RAISE NOTICE '✅ 트리거 함수 생성 완료';
  RAISE NOTICE '🚀 이제 고급 기능들을 사용할 수 있습니다!';
END $$;
