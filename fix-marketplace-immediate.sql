-- 마켓플레이스 테이블 즉시 생성 및 RLS 정책 수정
-- 이 스크립트를 Supabase Dashboard에서 실행하세요

-- 1. 마켓플레이스 상품 테이블 생성
CREATE TABLE IF NOT EXISTS marketplace_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_cost INTEGER NOT NULL CHECK (points_cost > 0),
    image_url TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'coupon', 'giftcard', 'service')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 상품 구매 기록 테이블 생성
CREATE TABLE IF NOT EXISTS product_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
    points_spent INTEGER NOT NULL CHECK (points_spent > 0),
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    redemption_code VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. updated_at 트리거 함수 생성 (없는 경우)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 트리거 설정
DROP TRIGGER IF EXISTS trigger_update_marketplace_products_updated_at ON marketplace_products;
CREATE TRIGGER trigger_update_marketplace_products_updated_at
    BEFORE UPDATE ON marketplace_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. RLS 활성화
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_purchases ENABLE ROW LEVEL SECURITY;

-- 6. 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Everyone can view active marketplace products" ON marketplace_products;
DROP POLICY IF EXISTS "Admins can manage marketplace products" ON marketplace_products;
DROP POLICY IF EXISTS "Users can view their own purchases" ON product_purchases;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON product_purchases;
DROP POLICY IF EXISTS "Admins can view all purchases" ON product_purchases;

-- 7. 새로운 RLS 정책 생성 (더 관대한 정책)
-- 마켓플레이스 상품 조회 (모든 사용자)
CREATE POLICY "Everyone can view active marketplace products" ON marketplace_products
    FOR SELECT USING (is_active = true);

-- 관리자는 모든 상품 관리 가능
CREATE POLICY "Admins can manage marketplace products" ON marketplace_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 사용자는 자신의 구매 기록 조회
CREATE POLICY "Users can view their own purchases" ON product_purchases
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 구매 기록 생성
CREATE POLICY "Users can insert their own purchases" ON product_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 구매 기록 조회
CREATE POLICY "Admins can view all purchases" ON product_purchases
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 8. 샘플 데이터 삽입 (테스트용)
INSERT INTO marketplace_products (name, description, points_cost, category, is_active) VALUES
('스타벅스 아메리카노', '스타벅스 아메리카노 Tall 사이즈 쿠폰', 1000, 'coupon', true),
('CGV 영화관람권', 'CGV 2D 영화관람권', 2000, 'coupon', true),
('네이버페이 포인트', '네이버페이 5,000원 포인트', 5000, 'giftcard', true),
('배달의민족 쿠폰', '배달의민족 3,000원 할인 쿠폰', 3000, 'coupon', true),
('카카오페이 포인트', '카카오페이 10,000원 포인트', 10000, 'giftcard', true)
ON CONFLICT DO NOTHING;

-- 9. 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '마켓플레이스 테이블과 RLS 정책이 성공적으로 생성되었습니다!';
    RAISE NOTICE '샘플 상품 5개가 추가되었습니다.';
END $$;
