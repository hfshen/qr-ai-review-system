-- updated_at 컬럼 자동 업데이트를 위한 트리거 함수 생성

-- 1. updated_at 컬럼 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 함수 생성 완료 메시지
DO $$
BEGIN
    RAISE NOTICE 'update_updated_at_column() 함수가 성공적으로 생성되었습니다.';
END $$;
