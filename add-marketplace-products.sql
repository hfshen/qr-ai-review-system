-- 마켓플레이스 상품 테이블 추가
-- Supabase Dashboard의 SQL Editor에서 실행하세요

-- 마켓플레이스 상품 테이블
create table if not exists marketplace_products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  points_cost integer not null default 0,
  image_url text,
  category text check (category in ('general','coupon','giftcard','service')) default 'general',
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 기본 상품 데이터 삽입
insert into marketplace_products (name, description, points_cost, category, is_active) values
('스타벅스 아메리카노 쿠폰', '스타벅스 아메리카노 Tall 사이즈 무료 쿠폰', 5000, 'coupon', true),
('맥도날드 햄버거 세트 쿠폰', '맥도날드 빅맥 세트 무료 쿠폰', 8000, 'coupon', true),
('CGV 영화관람권', 'CGV 일반관 영화관람권 1매', 12000, 'giftcard', true),
('네이버페이 5천원', '네이버페이 충전금 5,000원', 5000, 'giftcard', true),
('배달의민족 1만원', '배달의민족 포인트 10,000원', 10000, 'giftcard', true),
('쿠팡 2만원 상품권', '쿠팡 상품권 20,000원', 20000, 'giftcard', true),
('카카오페이 3만원', '카카오페이 충전금 30,000원', 30000, 'giftcard', true),
('아이허브 할인 쿠폰', '아이허브 10% 할인 쿠폰', 2000, 'coupon', true),
('올리브영 5천원 상품권', '올리브영 상품권 5,000원', 5000, 'giftcard', true),
('교보문고 도서 쿠폰', '교보문고 도서 구매 20% 할인 쿠폰', 3000, 'coupon', true);

-- RLS 정책 설정
alter table marketplace_products enable row level security;

-- 모든 사용자가 상품을 조회할 수 있도록 허용
create policy "모든 사용자가 상품 조회 가능" on marketplace_products
  for select using (true);

-- 관리자만 상품을 추가/수정/삭제할 수 있도록 허용
create policy "관리자만 상품 관리 가능" on marketplace_products
  for all using (
    exists (
      select 1 from users 
      where users.auth_id = auth.uid() 
      and users.role = 'admin'
    )
  );

-- 상품 구매 기록 테이블
create table if not exists product_purchases (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  product_id uuid references marketplace_products(id) on delete cascade,
  points_spent integer not null,
  purchase_date timestamp with time zone default now(),
  status text check (status in ('pending','completed','cancelled')) default 'pending',
  redemption_code text, -- 쿠폰 코드나 상품권 번호
  notes text
);

-- RLS 정책 설정
alter table product_purchases enable row level security;

-- 사용자는 자신의 구매 내역만 조회 가능
create policy "사용자는 자신의 구매 내역 조회 가능" on product_purchases
  for select using (
    user_id = (
      select id from users where auth_id = auth.uid()
    )
  );

-- 관리자는 모든 구매 내역 조회 가능
create policy "관리자는 모든 구매 내역 조회 가능" on product_purchases
  for all using (
    exists (
      select 1 from users 
      where users.auth_id = auth.uid() 
      and users.role = 'admin'
    )
  );

-- 구매 시 포인트 차감 트리거 함수
create or replace function process_product_purchase()
returns trigger language plpgsql as $$
begin
  -- 사용자 포인트 차감
  update users 
  set points_balance = points_balance - new.points_spent
  where id = new.user_id;
  
  -- 포인트 거래 내역 기록
  insert into point_transactions (
    user_id,
    points,
    transaction_type,
    memo
  ) values (
    new.user_id,
    -new.points_spent,
    'purchase',
    '상품 구매: ' || (select name from marketplace_products where id = new.product_id)
  );
  
  return new;
end;
$$;

-- 구매 시 트리거 생성
create trigger on_product_purchase
  after insert on product_purchases
  for each row
  execute function process_product_purchase();
