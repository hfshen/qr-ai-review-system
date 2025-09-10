-- user_points 테이블 구조 통합 및 마이그레이션

-- 1. 기존 user_points 테이블 백업
CREATE TABLE IF NOT EXISTS user_points_backup AS 
SELECT * FROM user_points;

-- 2. 기존 user_points 테이블 삭제
DROP TABLE IF EXISTS user_points CASCADE;

-- 3. 새로운 user_points 테이블 생성 (거래 내역 저장용)
CREATE TABLE user_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  points INTEGER NOT NULL,
  source VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 기존 데이터 마이그레이션 (잔액이 있는 사용자들의 포인트 내역 생성)
INSERT INTO user_points (user_id, points, source, description)
SELECT 
  user_id, 
  points, 
  'initial_balance' as source,
  '초기 잔액' as description
FROM user_points_backup 
WHERE points > 0;

-- 5. 백업 테이블 삭제
DROP TABLE user_points_backup;

-- 6. 인덱스 생성
CREATE INDEX idx_user_points_user_id ON user_points(user_id);
CREATE INDEX idx_user_points_source ON user_points(source);
CREATE INDEX idx_user_points_created_at ON user_points(created_at);

-- 7. RLS 정책 설정
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view their own points" ON user_points;
DROP POLICY IF EXISTS "System can insert user points" ON user_points;

-- 새로운 정책 생성
CREATE POLICY "Users can view their own points" ON user_points
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own points" ON user_points
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert user points" ON user_points
  FOR INSERT WITH CHECK (true);

-- 관리자 정책
CREATE POLICY "Admins can view all points" ON user_points
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- 8. 사용자 잔액 조회 함수 생성
CREATE OR REPLACE FUNCTION get_user_points_balance(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(points) FROM user_points WHERE user_id = user_uuid), 
    0
  );
END;
$$ LANGUAGE plpgsql;

-- 9. 사용자 잔액 업데이트 함수 생성
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

-- 10. 포인트 사용 함수 생성
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
