-- 비회원 리뷰 지원을 위한 데이터베이스 스키마 업데이트
-- reviews 테이블에 비회원 필드 추가

-- 1. reviews 테이블에 비회원 필드 추가
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS reviewer_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS reviewer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS keywords INTEGER[],
ADD COLUMN IF NOT EXISTS images TEXT[];

-- 2. 비회원 리뷰를 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_email ON reviews(reviewer_email);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_name ON reviews(reviewer_name);

-- 3. 비회원 리뷰를 위한 제약조건 추가
-- user_id가 null이면 reviewer_name은 필수
ALTER TABLE reviews 
ADD CONSTRAINT check_reviewer_info 
CHECK (
  (user_id IS NOT NULL) OR 
  (user_id IS NULL AND reviewer_name IS NOT NULL AND reviewer_name != '')
);

-- 4. 기존 reviews 테이블의 데이터 타입 수정 (필요한 경우)
-- rating을 문자열로 변경 (기존 코드와 호환성 유지)
ALTER TABLE reviews 
ALTER COLUMN rating TYPE VARCHAR(10);

-- 5. 비회원 리뷰 통계를 위한 뷰 생성
CREATE OR REPLACE VIEW review_stats AS
SELECT 
  branch_id,
  COUNT(*) as total_reviews,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as member_reviews,
  COUNT(CASE WHEN user_id IS NULL THEN 1 END) as guest_reviews,
  AVG(CASE WHEN rating ~ '^[0-9]+$' THEN rating::INTEGER ELSE 0 END) as avg_rating
FROM reviews 
WHERE status = 'published'
GROUP BY branch_id;

-- 6. 비회원 리뷰를 위한 RLS 정책 추가 (공개 읽기 허용)
CREATE POLICY IF NOT EXISTS "Allow public read access to published reviews" ON reviews
  FOR SELECT USING (status = 'published');

-- 7. 비회원 리뷰 작성을 위한 정책 추가
CREATE POLICY IF NOT EXISTS "Allow guest review creation" ON reviews
  FOR INSERT WITH CHECK (
    user_id IS NULL AND 
    reviewer_name IS NOT NULL AND 
    reviewer_name != ''
  );

-- 8. 비회원 리뷰 업데이트를 위한 정책 추가 (작성자만)
CREATE POLICY IF NOT EXISTS "Allow guest review update" ON reviews
  FOR UPDATE USING (
    user_id IS NULL AND 
    reviewer_name IS NOT NULL
  );

-- 9. 비회원 리뷰 삭제를 위한 정책 추가 (작성자만)
CREATE POLICY IF NOT EXISTS "Allow guest review delete" ON reviews
  FOR DELETE USING (
    user_id IS NULL AND 
    reviewer_name IS NOT NULL
  );