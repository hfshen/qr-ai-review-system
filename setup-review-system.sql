-- 사용자 자동 생성을 위한 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS device_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- 리뷰 테이블에 user_id 컬럼 추가 (이미 있다면 무시)
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- 리뷰 이미지 저장을 위한 스토리지 버킷 생성
INSERT INTO storage.buckets (id, name, public) 
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

-- 리뷰 이미지 스토리지 정책
DROP POLICY IF EXISTS "Anyone can upload review images" ON storage.objects;
CREATE POLICY "Anyone can upload review images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'review-images');

DROP POLICY IF EXISTS "Anyone can view review images" ON storage.objects;
CREATE POLICY "Anyone can view review images" ON storage.objects
FOR SELECT USING (bucket_id = 'review-images');

-- 사용자 포인트 테이블 (이미 있다면 무시)
CREATE TABLE IF NOT EXISTS user_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  points INTEGER NOT NULL,
  source VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 포인트 RLS 정책
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own points" ON user_points;
CREATE POLICY "Users can view their own points" ON user_points
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert user points" ON user_points;
CREATE POLICY "System can insert user points" ON user_points
FOR INSERT WITH CHECK (true);

-- 리뷰 키워드 테이블 구조 확인 및 수정
DO $$ 
BEGIN
    -- 테이블이 존재하는지 확인
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'review_keywords') THEN
        -- name 컬럼이 있는지 확인
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'review_keywords' AND column_name = 'name') THEN
            -- name 컬럼 추가
            ALTER TABLE review_keywords ADD COLUMN name VARCHAR(100);
        END IF;
        
        -- description 컬럼이 있는지 확인
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'review_keywords' AND column_name = 'description') THEN
            -- description 컬럼 추가
            ALTER TABLE review_keywords ADD COLUMN description TEXT;
        END IF;
        
        -- is_active 컬럼이 있는지 확인
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'review_keywords' AND column_name = 'is_active') THEN
            -- is_active 컬럼 추가
            ALTER TABLE review_keywords ADD COLUMN is_active BOOLEAN DEFAULT true;
        END IF;
        
        -- created_at 컬럼이 있는지 확인
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'review_keywords' AND column_name = 'created_at') THEN
            -- created_at 컬럼 추가
            ALTER TABLE review_keywords ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        
        -- name 컬럼에 NOT NULL 제약조건 추가 (기존 데이터가 있다면 먼저 처리)
        UPDATE review_keywords SET name = '기본키워드_' || id::text WHERE name IS NULL;
        ALTER TABLE review_keywords ALTER COLUMN name SET NOT NULL;
        
        -- 중복된 name 값 처리 (고유하게 만들기)
        WITH duplicates AS (
            SELECT rk.name, ROW_NUMBER() OVER (PARTITION BY rk.name ORDER BY rk.created_at) as rn
            FROM review_keywords rk
        )
        UPDATE review_keywords 
        SET name = review_keywords.name || '_' || review_keywords.id::text
        FROM duplicates 
        WHERE review_keywords.name = duplicates.name 
        AND duplicates.rn > 1;
        
        -- name 컬럼에 UNIQUE 제약조건 추가
        BEGIN
            ALTER TABLE review_keywords ADD CONSTRAINT review_keywords_name_unique UNIQUE (name);
        EXCEPTION
            WHEN duplicate_object THEN
                -- 이미 UNIQUE 제약조건이 있으면 무시
                NULL;
        END;
    ELSE
        -- 테이블이 없으면 새로 생성
        CREATE TABLE review_keywords (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- 기본 리뷰 키워드 삽입
INSERT INTO review_keywords (name, description) VALUES
('맛있어요', '음식이 맛있다는 의미'),
('친절해요', '직원이 친절하다는 의미'),
('깨끗해요', '매장이 깨끗하다는 의미'),
('빠른 서비스', '서비스가 빠르다는 의미'),
('가성비 좋아요', '가격 대비 만족스럽다는 의미'),
('분위기 좋아요', '매장 분위기가 좋다는 의미'),
('재방문 의사', '다시 방문하고 싶다는 의미'),
('추천해요', '다른 사람에게 추천하고 싶다는 의미')
ON CONFLICT (name) DO NOTHING;

-- 리뷰 키워드 RLS 정책
ALTER TABLE review_keywords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view active keywords" ON review_keywords;
CREATE POLICY "Everyone can view active keywords" ON review_keywords
FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage keywords" ON review_keywords;
CREATE POLICY "Admins can manage keywords" ON review_keywords
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);
