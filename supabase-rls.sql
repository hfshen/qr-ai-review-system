-- Row Level Security 정책 설정
-- Supabase SQL Editor에서 실행하세요

-- users 테이블 RLS 정책
alter table users enable row level security;

create policy "Users can view their own profile" on users
  for select using (auth.uid() = id or (select role from users where id = auth.uid()) = 'admin');

create policy "Users can update their own profile" on users
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can insert their own profile" on users
  for insert with check (auth.uid() = id);

-- agencies 테이블 RLS 정책
alter table agencies enable row level security;

create policy "Agency owners can view their agency" on agencies
  for select using (auth.uid() = owner_id or (select role from users where id = auth.uid()) = 'admin');

create policy "Agency owners can insert agencies" on agencies
  for insert with check (exists (select 1 from users u where u.id = auth.uid() and u.role = 'agency_owner'));

create policy "Agency owners can update their agency" on agencies
  for update using (auth.uid() = owner_id);

-- branches 테이블 RLS 정책
alter table branches enable row level security;

create policy "Agency owners can view branches" on branches
  for select using ((select owner_id from agencies where id = branches.agency_id) = auth.uid() or (select role from users where id = auth.uid()) = 'admin');

create policy "Agency owners can insert branch" on branches
  for insert with check (true);

create policy "Agency owners can update branch" on branches
  for update using ((select owner_id from agencies where id = branches.agency_id) = auth.uid());

-- reviews 테이블 RLS 정책
alter table reviews enable row level security;

create policy "Users can view their reviews" on reviews
  for select using (user_id = auth.uid() or (select owner_id from agencies a join branches b on b.agency_id = a.id where b.id = reviews.branch_id) = auth.uid() or (select role from users where id = auth.uid()) = 'admin');

create policy "Users can insert reviews" on reviews
  for insert with check (auth.uid() = user_id);

create policy "Users can update their draft reviews" on reviews
  for update using (user_id = auth.uid() and status <> 'published') with check (user_id = auth.uid());

-- review_media 테이블 RLS 정책
alter table review_media enable row level security;

create policy "Users can manage their media" on review_media
  for all using ((select user_id from reviews where id = review_media.review_id) = auth.uid());

-- agency_balances 테이블 RLS 정책
alter table agency_balances enable row level security;

create policy "Agency owners can view balances" on agency_balances
  for select using ((select owner_id from agencies where id = agency_balances.agency_id) = auth.uid() or (select role from users where id = auth.uid()) = 'admin');

-- point_transactions 테이블 RLS 정책
alter table point_transactions enable row level security;

create policy "Users and agencies view their transactions" on point_transactions
  for select using ((user_id = auth.uid()) or ((select owner_id from agencies where id = point_transactions.agency_id) = auth.uid()) or (select role from users where id = auth.uid()) = 'admin');

-- agency_deposits 테이블 RLS 정책
alter table agency_deposits enable row level security;

create policy "Agency owners manage deposits" on agency_deposits
  for select using ((select owner_id from agencies where id = agency_deposits.agency_id) = auth.uid() or (select role from users where id = auth.uid()) = 'admin');

create policy "Agency owners insert deposits" on agency_deposits
  for insert with check (true);

-- user_points 테이블 RLS 정책
alter table user_points enable row level security;

create policy "Users can view their points" on user_points
  for select using (user_id = auth.uid() or (select role from users where id = auth.uid()) = 'admin');

-- user_platforms 테이블 RLS 정책
alter table user_platforms enable row level security;

create policy "Users can manage their platforms" on user_platforms
  for all using (user_id = auth.uid());

-- agency_platforms 테이블 RLS 정책
alter table agency_platforms enable row level security;

create policy "Agency owners can manage their platforms" on agency_platforms
  for all using ((select owner_id from agencies where id = agency_platforms.agency_id) = auth.uid() or (select role from users where id = auth.uid()) = 'admin');

-- platforms 테이블은 공개 읽기
alter table platforms enable row level security;

create policy "Platforms are publicly readable" on platforms
  for select using (true);

-- review_keywords 테이블은 공개 읽기
alter table review_keywords enable row level security;

create policy "Review keywords are publicly readable" on review_keywords
  for select using (true);

-- branch_statistics 테이블은 공개 읽기
alter table branch_statistics enable row level security;

create policy "Branch statistics are publicly readable" on branch_statistics
  for select using (true);
