-- 완전한 RLS 정책 구현
-- Supabase Dashboard의 SQL Editor에서 실행하세요

-- 기존 RLS 정책 삭제
drop policy if exists "모든 사용자가 상품 조회 가능" on marketplace_products;
drop policy if exists "관리자만 상품 관리 가능" on marketplace_products;
drop policy if exists "사용자는 자신의 구매 내역 조회 가능" on product_purchases;
drop policy if exists "관리자는 모든 구매 내역 조회 가능" on product_purchases;

-- 모든 테이블에 RLS 활성화
alter table users enable row level security;
alter table agencies enable row level security;
alter table branches enable row level security;
alter table platforms enable row level security;
alter table agency_platforms enable row level security;
alter table user_platforms enable row level security;
alter table review_keywords enable row level security;
alter table reviews enable row level security;
alter table review_media enable row level security;
alter table point_transactions enable row level security;
alter table agency_balances enable row level security;
alter table agency_deposits enable row level security;
alter table branch_statistics enable row level security;
alter table user_points enable row level security;
alter table marketplace_products enable row level security;
alter table product_purchases enable row level security;

-- ==============================================
-- USERS 테이블 정책
-- ==============================================

-- 모든 인증된 사용자가 사용자 목록 조회 가능
create policy "인증된 사용자는 사용자 목록 조회 가능" on users
  for select using (auth.role() = 'authenticated');

-- 사용자는 자신의 프로필만 수정 가능
create policy "사용자는 자신의 프로필 수정 가능" on users
  for update using (auth_id = auth.uid());

-- 관리자는 모든 사용자 정보 수정 가능
create policy "관리자는 모든 사용자 수정 가능" on users
  for all using (
    exists (
      select 1 from users 
      where users.auth_id = auth.uid() 
      and users.role = 'admin'
    )
  );

-- ==============================================
-- AGENCIES 테이블 정책
-- ==============================================

-- 모든 인증된 사용자가 에이전시 목록 조회 가능
create policy "인증된 사용자는 에이전시 목록 조회 가능" on agencies
  for select using (auth.role() = 'authenticated');

-- 에이전시 소유자는 자신의 에이전시만 수정 가능
create policy "에이전시 소유자는 자신의 에이전시 수정 가능" on agencies
  for update using (
    owner_id = (
      select id from users where auth_id = auth.uid()
    )
  );

-- 관리자는 모든 에이전시 관리 가능
create policy "관리자는 모든 에이전시 관리 가능" on agencies
  for all using (
    exists (
      select 1 from users 
      where users.auth_id = auth.uid() 
      and users.role = 'admin'
    )
  );

-- ==============================================
-- BRANCHES 테이블 정책
-- ==============================================

-- 모든 인증된 사용자가 지점 목록 조회 가능
create policy "인증된 사용자는 지점 목록 조회 가능" on branches
  for select using (auth.role() = 'authenticated');

-- 에이전시 소유자는 자신의 지점만 수정 가능
create policy "에이전시 소유자는 자신의 지점 수정 가능" on branches
  for update using (
    agency_id in (
      select id from agencies 
      where owner_id = (
        select id from users where auth_id = auth.uid()
      )
    )
  );

-- 관리자는 모든 지점 관리 가능
create policy "관리자는 모든 지점 관리 가능" on branches
  for all using (
    exists (
      select 1 from users 
      where users.auth_id = auth.uid() 
      and users.role = 'admin'
    )
  );

-- ==============================================
-- PLATFORMS 테이블 정책
-- ==============================================

-- 모든 인증된 사용자가 플랫폼 목록 조회 가능
create policy "인증된 사용자는 플랫폼 목록 조회 가능" on platforms
  for select using (auth.role() = 'authenticated');

-- 관리자만 플랫폼 관리 가능
create policy "관리자만 플랫폼 관리 가능" on platforms
  for all using (
    exists (
      select 1 from users 
      where users.auth_id = auth.uid() 
      and users.role = 'admin'
    )
  );

-- ==============================================
-- AGENCY_PLATFORMS 테이블 정책
-- ==============================================

-- 에이전시 소유자는 자신의 플랫폼 연동 정보만 조회/수정 가능
create policy "에이전시 소유자는 자신의 플랫폼 연동 정보 관리 가능" on agency_platforms
  for all using (
    agency_id in (
      select id from agencies 
      where owner_id = (
        select id from users where auth_id = auth.uid()
      )
    )
  );

-- 관리자는 모든 플랫폼 연동 정보 관리 가능
create policy "관리자는 모든 플랫폼 연동 정보 관리 가능" on agency_platforms
  for all using (
    exists (
      select 1 from users 
      where users.auth_id = auth.uid() 
      and users.role = 'admin'
    )
  );

-- ==============================================
-- USER_PLATFORMS 테이블 정책
-- ==============================================

-- 사용자는 자신의 플랫폼 연동 정보만 조회/수정 가능
create policy "사용자는 자신의 플랫폼 연동 정보 관리 가능" on user_platforms
  for all using (
    user_id = (
      select id from users where auth_id = auth.uid()
    )
  );

-- 관리자는 모든 사용자 플랫폼 연동 정보 관리 가능
create policy "관리자는 모든 사용자 플랫폼 연동 정보 관리 가능" on user_platforms
  for all using (
    exists (
      select 1 from users 
      where users.auth_id = auth.uid() 
      and users.role = 'admin'
    )
  );

-- ==============================================
-- REVIEW_KEYWORDS 테이블 정책
-- ==============================================

-- 모든 인증된 사용자가 키워드 조회 가능
create policy "인증된 사용자는 키워드 조회 가능" on review_keywords
  for select using (auth.role() = 'authenticated');

-- 관리자만 키워드 관리 가능
create policy "관리자만 키워드 관리 가능" on review_keywords
  for all using (
    exists (
      select 1 from users 
      where users.auth_id = auth.uid() 
      and users.role = 'admin'
    )
  );

-- ==============================================
-- REVIEWS 테이블 정책
-- ==============================================

-- 모든 인증된 사용자가 리뷰 조회 가능
create policy "인증된 사용자는 리뷰 조회 가능" on reviews
  for select using (auth.role() = 'authenticated');

-- 사용자는 자신의 리뷰만 수정 가능
create policy "사용자는 자신의 리뷰 수정 가능" on reviews
  for update using (
    user_id = (
      select id from users where auth_id = auth.uid()
    )
  );

-- 에이전시 소유자는 자신의 지점 리뷰만 조회 가능
create policy "에이전시 소유자는 자신의 지점 리뷰 조회 가능" on reviews
  for select using (
    branch_id in (
      select id from branches 
      where agency_id in (
        select id from agencies 
        where owner_id = (
          select id from users where auth_id = auth.uid()
        )
      )
    )
  );

-- 관리자는 모든 리뷰 관리 가능
create policy "관리자는 모든 리뷰 관리 가능" on reviews
  for all using (
    exists (
      select 1 from users 
      where users.auth_id = auth.uid() 
      and users.role = 'admin'
    )
  );

-- ==============================================
-- REVIEW_MEDIA 테이블 정책
-- ==============================================

-- 리뷰 작성자는 자신의 리뷰 미디어만 조회 가능
create policy "리뷰 작성자는 자신의 리뷰 미디어 조회 가능" on review_media
  for select using (
    review_id in (
      select id from reviews 
      where user_id = (
        select id from users where auth_id = auth.uid()
      )
    )
  );

-- 관리자는 모든 리뷰 미디어 관리 가능
create policy "관리자는 모든 리뷰 미디어 관리 가능" on review_media
  for all using (
    exists (
      select 1 from users 
      where users.auth_id = auth.uid() 
      and users.role = 'admin'
    )
  );

-- ==============================================
-- POINT_TRANSACTIONS 테이블 정책
-- ==============================================

-- 사용자는 자신의 포인트 거래 내역만 조회 가능
create policy "사용자는 자신의 포인트 거래 내역 조회 가능" on point_transactions
  for select using (
    user_id = (
      select id from users where auth_id = auth.uid()
    )
  );

-- 에이전시 소유자는 자신의 에이전시 포인트 거래 내역만 조회 가능
create policy "에이전시 소유자는 자신의 에이전시 포인트 거래 내역 조회 가능" on point_transactions
  for select using (
    agency_id in (
      select id from agencies 
      where owner_id = (
        select id from users where auth_id = auth.uid()
      )
    )
  );

-- 관리자는 모든 포인트 거래 내역 관리 가능
create policy "관리자는 모든 포인트 거래 내역 관리 가능" on point_transactions
  for all using (
    exists (
      select 1 from users 
      where users.auth_id = auth.uid() 
      and users.role = 'admin'
    )
  );

-- ==============================================
-- AGENCY_BALANCES 테이블 정책
-- ==============================================

-- 에이전시 소유자는 자신의 에이전시 잔액만 조회 가능
create policy "에이전시 소유자는 자신의 에이전시 잔액 조회 가능" on agency_balances
  for select using (
    agency_id in (
      select id from agencies 
      where owner_id = (
        select id from users where auth_id = auth.uid()
      )
    )
  );

-- 관리자는 모든 에이전시 잔액 관리 가능
create policy "관리자는 모든 에이전시 잔액 관리 가능" on agency_balances
  for all using (
    exists (
      select 1 from users 
      where users.auth_id = auth.uid() 
      and users.role = 'admin'
    )
  );

-- ==============================================
-- AGENCY_DEPOSITS 테이블 정책
-- ==============================================

-- 에이전시 소유자는 자신의 에이전시 충전 내역만 조회 가능
create policy "에이전시 소유자는 자신의 에이전시 충전 내역 조회 가능" on agency_deposits
  for select using (
    agency_id in (
      select id from agencies 
      where owner_id = (
        select id from users where auth_id = auth.uid()
      )
    )
  );

-- 관리자는 모든 에이전시 충전 내역 관리 가능
create policy "관리자는 모든 에이전시 충전 내역 관리 가능" on agency_deposits
  for all using (
    exists (
      select 1 from users 
      where users.auth_id = auth.uid() 
      and users.role = 'admin'
    )
  );

-- ==============================================
-- BRANCH_STATISTICS 테이블 정책
-- ==============================================

-- 모든 인증된 사용자가 지점 통계 조회 가능
create policy "인증된 사용자는 지점 통계 조회 가능" on branch_statistics
  for select using (auth.role() = 'authenticated');

-- 관리자만 지점 통계 관리 가능
create policy "관리자만 지점 통계 관리 가능" on branch_statistics
  for all using (
    exists (
      select 1 from users 
      where users.auth_id = auth.uid() 
      and users.role = 'admin'
    )
  );

-- ==============================================
-- USER_POINTS 테이블 정책
-- ==============================================

-- 사용자는 자신의 포인트 정보만 조회 가능
create policy "사용자는 자신의 포인트 정보 조회 가능" on user_points
  for select using (
    user_id = (
      select id from users where auth_id = auth.uid()
    )
  );

-- 관리자는 모든 사용자 포인트 정보 관리 가능
create policy "관리자는 모든 사용자 포인트 정보 관리 가능" on user_points
  for all using (
    exists (
      select 1 from users 
      where users.auth_id = auth.uid() 
      and users.role = 'admin'
    )
  );

-- ==============================================
-- MARKETPLACE_PRODUCTS 테이블 정책
-- ==============================================

-- 모든 인증된 사용자가 상품 조회 가능
create policy "인증된 사용자는 상품 조회 가능" on marketplace_products
  for select using (auth.role() = 'authenticated');

-- 관리자만 상품 관리 가능
create policy "관리자만 상품 관리 가능" on marketplace_products
  for all using (
    exists (
      select 1 from users 
      where users.auth_id = auth.uid() 
      and users.role = 'admin'
    )
  );

-- ==============================================
-- PRODUCT_PURCHASES 테이블 정책
-- ==============================================

-- 사용자는 자신의 구매 내역만 조회 가능
create policy "사용자는 자신의 구매 내역 조회 가능" on product_purchases
  for select using (
    user_id = (
      select id from users where auth_id = auth.uid()
    )
  );

-- 관리자는 모든 구매 내역 관리 가능
create policy "관리자는 모든 구매 내역 관리 가능" on product_purchases
  for all using (
    exists (
      select 1 from users 
      where users.auth_id = auth.uid() 
      and users.role = 'admin'
    )
  );

-- RLS 정책 확인
select 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies 
where schemaname = 'public'
order by tablename, policyname;
