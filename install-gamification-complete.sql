-- 🚀 QR AI 리뷰 시스템 - 게임화 기능 통합 설치 스크립트
-- 실행 순서: 1. migrate-user-points.sql → 2. gamification-schema-fixed.sql

-- ========================================
-- 1단계: user_points 테이블 마이그레이션
-- ========================================

-- 기존 user_points 테이블 백업
CREATE TABLE IF NOT EXISTS user_points_backup AS 
SELECT * FROM user_points;

-- 기존 user_points 테이블 삭제
DROP TABLE IF EXISTS user_points CASCADE;

-- 새로운 user_points 테이블 생성 (거래 내역 저장용)
CREATE TABLE user_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  points INTEGER NOT NULL,
  source VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기존 데이터 마이그레이션
INSERT INTO user_points (user_id, points, source, description)
SELECT 
  user_id, 
  points, 
  'initial_balance' as source,
  '초기 잔액' as description
FROM user_points_backup 
WHERE points > 0;

-- 백업 테이블 삭제
DROP TABLE user_points_backup;

-- 인덱스 생성
CREATE INDEX idx_user_points_user_id ON user_points(user_id);
CREATE INDEX idx_user_points_source ON user_points(source);
CREATE INDEX idx_user_points_created_at ON user_points(created_at);

-- RLS 정책 설정
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own points" ON user_points
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own points" ON user_points
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert user points" ON user_points
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all points" ON user_points
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- ========================================
-- 2단계: 게임화 테이블 생성
-- ========================================

-- 사용자 캡션 히스토리 (AI 학습용)
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
  engagement JSONB, -- {likes: number, comments: number, shares: number, views: number}
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

-- 소셜 증명 통계 테이블 (캐시용)
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

ALTER TABLE user_caption_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_proof_stats ENABLE ROW LEVEL SECURITY;

-- 사용자 데이터 접근 정책
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

-- 관리자 접근 정책
CREATE POLICY "Admins can view all caption history" ON user_caption_history
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can view all posting tracker" ON posting_tracker
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can view all badges" ON user_badges
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can view all levels" ON user_levels
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- 소셜 증명 통계는 모든 사용자가 조회 가능
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

-- 소셜 증명 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_social_proof_stats() RETURNS TRIGGER AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  platform_stats RECORD;
BEGIN
  -- 각 플랫폼별 통계 계산
  FOR platform_stats IN
    SELECT 
      platform_id,
      COUNT(*) FILTER (WHERE status IN ('shared', 'posted')) as total_shares,
      COUNT(*) FILTER (WHERE status = 'posted') as total_posts,
      CASE 
        WHEN COUNT(*) FILTER (WHERE status IN ('shared', 'posted')) > 0 
        THEN (COUNT(*) FILTER (WHERE status = 'posted')::NUMERIC / 
              COUNT(*) FILTER (WHERE status IN ('shared', 'posted'))::NUMERIC) * 100
        ELSE 0 
      END as success_rate,
      COALESCE(AVG((engagement->>'likes')::INTEGER + 
                   (engagement->>'comments')::INTEGER + 
                   (engagement->>'shares')::INTEGER), 0) as avg_engagement
    FROM posting_tracker
    WHERE DATE(created_at) = today_date
    GROUP BY platform_id
  LOOP
    -- 통계 업데이트 또는 생성
    INSERT INTO social_proof_stats (platform_id, date, total_shares, total_posts, success_rate, avg_engagement)
      VALUES (platform_stats.platform_id, today_date, platform_stats.total_shares, 
              platform_stats.total_posts, platform_stats.success_rate, platform_stats.avg_engagement)
      ON CONFLICT (platform_id, date) DO UPDATE SET
        total_shares = platform_stats.total_shares,
        total_posts = platform_stats.total_posts,
        success_rate = platform_stats.success_rate,
        avg_engagement = platform_stats.avg_engagement;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 포스팅 상태 변경 시 소셜 증명 통계 업데이트 트리거
DROP TRIGGER IF EXISTS trg_update_social_proof_stats ON posting_tracker;
CREATE TRIGGER trg_update_social_proof_stats
  AFTER INSERT OR UPDATE ON posting_tracker
  FOR EACH ROW
  EXECUTE FUNCTION update_social_proof_stats();

-- ========================================
-- 6단계: 유틸리티 함수 생성
-- ========================================

-- 사용자 잔액 조회 함수
CREATE OR REPLACE FUNCTION get_user_points_balance(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(points) FROM user_points WHERE user_id = user_uuid), 
    0
  );
END;
$$ LANGUAGE plpgsql;

-- 사용자 포인트 추가 함수
CREATE OR REPLACE FUNCTION add_user_points(
  user_uuid UUID,
  points_amount INTEGER,
  source_type VARCHAR(100),
  description_text TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_points (user_id, points, source, description)
  VALUES (user_uuid, points_amount, source_type, description_text);
END;
$$ LANGUAGE plpgsql;

-- 포인트 사용 함수
CREATE OR REPLACE FUNCTION use_user_points(
  user_uuid UUID,
  points_amount INTEGER,
  source_type VARCHAR(100),
  description_text TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- 현재 잔액 확인
  SELECT get_user_points_balance(user_uuid) INTO current_balance;
  
  -- 잔액이 충분한지 확인
  IF current_balance >= points_amount THEN
    -- 포인트 차감
    INSERT INTO user_points (user_id, points, source, description)
    VALUES (user_uuid, -points_amount, source_type, description_text);
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7단계: 초기 데이터 삽입
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

-- 설치 완료 확인
DO $$
BEGIN
  RAISE NOTICE '🎉 QR AI 리뷰 시스템 게임화 기능 설치 완료!';
  RAISE NOTICE '✅ user_points 테이블 마이그레이션 완료';
  RAISE NOTICE '✅ 게임화 테이블 생성 완료';
  RAISE NOTICE '✅ RLS 정책 설정 완료';
  RAISE NOTICE '✅ 트리거 함수 생성 완료';
  RAISE NOTICE '✅ 유틸리티 함수 생성 완료';
  RAISE NOTICE '🚀 이제 고급 기능들을 사용할 수 있습니다!';
END $$;
