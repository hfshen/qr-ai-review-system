-- 기존 테이블에 고유 제약 조건 추가 (필요한 경우)
-- 이미 테이블이 생성되어 있다면 이 스크립트를 실행하세요

-- review_keywords 테이블에 고유 제약 조건 추가
ALTER TABLE review_keywords ADD CONSTRAINT review_keywords_rating_keyword_unique UNIQUE (rating, keyword);

-- 기존 중복 데이터가 있다면 삭제 (선택사항)
-- DELETE FROM review_keywords WHERE id NOT IN (
--   SELECT MIN(id) FROM review_keywords GROUP BY rating, keyword
-- );
