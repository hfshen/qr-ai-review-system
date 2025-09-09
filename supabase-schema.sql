-- AI 자동 리뷰 플랫폼 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- 필수 확장 설치
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 사용자 테이블
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  auth_id uuid references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  role text check (role in ('user','agency_owner','admin')) default 'user',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 에이전시 테이블
create table if not exists agencies (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references users(id) on delete cascade,
  name text not null,
  description text,
  logo_url text,
  created_at timestamp with time zone default now()
);

-- 지점 테이블
create table if not exists branches (
  id uuid primary key default uuid_generate_v4(),
  agency_id uuid references agencies(id) on delete cascade,
  name text not null,
  address text,
  phone text,
  description text,
  industry text,
  qr_code text,
  created_at timestamp with time zone default now()
);

-- 플랫폼 테이블
create table if not exists platforms (
  id serial primary key,
  code text unique,
  name text,
  description text,
  default_reward integer default 0
);

-- 에이전시-플랫폼 연동 테이블
create table if not exists agency_platforms (
  id uuid primary key default uuid_generate_v4(),
  agency_id uuid references agencies(id) on delete cascade,
  platform_id integer references platforms(id) on delete cascade,
  connected boolean default false,
  api_token text,
  reward_per_review integer not null default 0,
  commission_rate numeric default 0,
  unique (agency_id, platform_id)
);

-- 사용자-플랫폼 연동 테이블
create table if not exists user_platforms (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  platform_id integer references platforms(id) on delete cascade,
  connected boolean default false,
  account_identifier text,
  unique (user_id, platform_id)
);

-- 리뷰 키워드 테이블
create table if not exists review_keywords (
  id serial primary key,
  rating smallint check (rating between 1 and 5),
  keyword text,
  unique (rating, keyword)
);

-- 리뷰 테이블
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete set null,
  branch_id uuid references branches(id) on delete cascade,
  platform_id integer references platforms(id) on delete set null,
  rating smallint check (rating between 1 and 5) not null,
  selected_keyword_id integer references review_keywords(id),
  ai_content text,
  final_content text,
  status text check (status in ('draft','published','failed')) default 'draft',
  published_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 리뷰 미디어 테이블
create table if not exists review_media (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid references reviews(id) on delete cascade,
  file_path text not null,
  media_type text check (media_type in ('image','video')),
  created_at timestamp with time zone default now()
);

-- 포인트 거래 내역 테이블
create table if not exists point_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  agency_id uuid references agencies(id),
  review_id uuid references reviews(id),
  platform_id integer references platforms(id),
  points integer not null,
  transaction_type text check (transaction_type in ('reward','purchase','agency_deposit','admin_adjust')),
  memo text,
  created_at timestamp with time zone default now()
);

-- 에이전시 포인트 잔액 테이블
create table if not exists agency_balances (
  agency_id uuid primary key references agencies(id) on delete cascade,
  points_balance integer not null default 0,
  updated_at timestamp with time zone default now()
);

-- 에이전시 포인트 충전 기록 테이블
create table if not exists agency_deposits (
  id uuid primary key default uuid_generate_v4(),
  agency_id uuid references agencies(id) on delete cascade,
  deposit_amount numeric not null,
  base_points integer not null,
  bonus_points integer not null default 0,
  total_points integer generated always as (base_points + bonus_points) stored,
  created_at timestamp with time zone default now()
);

-- 지점 통계 테이블
create table if not exists branch_statistics (
  branch_id uuid primary key references branches(id) on delete cascade,
  total_reviews integer not null default 0,
  rating_1 integer not null default 0,
  rating_2 integer not null default 0,
  rating_3 integer not null default 0,
  rating_4 integer not null default 0,
  rating_5 integer not null default 0,
  updated_at timestamp with time zone default now()
);

-- 사용자 포인트 잔액 테이블
create table if not exists user_points (
  user_id uuid primary key references users(id) on delete cascade,
  points integer not null default 0,
  updated_at timestamp with time zone default now()
);

-- 보너스 포인트 계산 함수
create or replace function calculate_bonus_points(amount numeric) returns integer language plpgsql as $$
declare
  bonus integer := 0;
begin
  if amount >= 1000000 then        -- 100만원 이상: 50% 보너스
    bonus := floor(amount * 0.5);
  elsif amount >= 500000 then       -- 50만 이상: 30% 보너스
    bonus := floor(amount * 0.3);
  elsif amount >= 100000 then       -- 10만 이상: 20% 보너스
    bonus := floor(amount * 0.2);
  elsif amount >= 50000 then        -- 5만 이상: 10% 보너스
    bonus := floor(amount * 0.1);
  else
    bonus := 0;
  end if;
  return bonus::integer;
end;
$$;

-- 에이전시 포인트 충전 트리거 함수
create or replace function on_agency_deposit() returns trigger language plpgsql as $$
declare
  bonus integer;
begin
  bonus := calculate_bonus_points(NEW.deposit_amount);
  NEW.base_points := floor(NEW.deposit_amount);
  NEW.bonus_points := bonus;
  
  insert into agency_balances (agency_id, points_balance, updated_at)
    values (NEW.agency_id, NEW.base_points + bonus, now())
    on conflict (agency_id) do update set 
      points_balance = agency_balances.points_balance + excluded.points_balance,
      updated_at = now();
  return NEW;
end;
$$;

-- 에이전시 포인트 충전 트리거
drop trigger if exists trg_agency_deposit on agency_deposits;
create trigger trg_agency_deposit before insert on agency_deposits
for each row execute function on_agency_deposit();

-- 리뷰 게시 후 처리 함수
create or replace function on_review_published() returns trigger language plpgsql as $$
declare
  reward integer;
begin
  if NEW.status = 'published' and (OLD.status is null or OLD.status <> 'published') then
    -- 지점 통계 업데이트
    insert into branch_statistics (branch_id, total_reviews, rating_1, rating_2, rating_3, rating_4, rating_5, updated_at)
      values (NEW.branch_id, 1,
        case when NEW.rating = 1 then 1 else 0 end,
        case when NEW.rating = 2 then 1 else 0 end,
        case when NEW.rating = 3 then 1 else 0 end,
        case when NEW.rating = 4 then 1 else 0 end,
        case when NEW.rating = 5 then 1 else 0 end,
        now())
    on conflict (branch_id) do update set
      total_reviews = branch_statistics.total_reviews + 1,
      rating_1 = branch_statistics.rating_1 + (case when NEW.rating = 1 then 1 else 0 end),
      rating_2 = branch_statistics.rating_2 + (case when NEW.rating = 2 then 1 else 0 end),
      rating_3 = branch_statistics.rating_3 + (case when NEW.rating = 3 then 1 else 0 end),
      rating_4 = branch_statistics.rating_4 + (case when NEW.rating = 4 then 1 else 0 end),
      rating_5 = branch_statistics.rating_5 + (case when NEW.rating = 5 then 1 else 0 end),
      updated_at = now();
    
    -- 포인트 계산
    select reward_per_review into reward from agency_platforms
      where agency_id = (select agency_id from branches where id = NEW.branch_id)
        and platform_id = NEW.platform_id;
    if reward is null then
      reward := 0;
    end if;
    
    -- 사용자 포인트 적립
    insert into user_points (user_id, points, updated_at) values (NEW.user_id, reward, now())
      on conflict (user_id) do update set 
        points = user_points.points + excluded.points, 
        updated_at = now();
    
    -- 포인트 거래 기록
    insert into point_transactions (user_id, agency_id, review_id, platform_id, points, transaction_type, memo)
      values (NEW.user_id,
              (select agency_id from branches where id = NEW.branch_id),
              NEW.id,
              NEW.platform_id,
              reward,
              'reward',
              'review reward');
    
    -- 에이전시 포인트 차감
    update agency_balances set 
      points_balance = points_balance - reward, 
      updated_at = now()
      where agency_id = (select agency_id from branches where id = NEW.branch_id);
  end if;
  return NEW;
end;
$$;

-- 리뷰 게시 트리거
drop trigger if exists trg_review_published on reviews;
create trigger trg_review_published after update on reviews
for each row execute function on_review_published();

-- 기본 플랫폼 데이터 삽입 (중복 방지)
insert into platforms (code, name, description, default_reward) values
('naver', '네이버 리뷰', '네이버 플레이스 리뷰', 100),
('instagram', '인스타그램', '인스타그램 포스트', 150),
('tiktok', '틱톡', '틱톡 동영상', 200),
('xiaohongshu', '小红书', '小红书 포스트', 120),
('google', '구글 리뷰', '구글 비즈니스 리뷰', 80)
on conflict (code) do nothing;

-- 기본 리뷰 키워드 데이터 삽입 (중복 방지)
insert into review_keywords (rating, keyword) values
(1, '서비스가 아쉬워요'),
(1, '기대했던 것과 달라요'),
(1, '개선이 필요해요'),
(1, '불친절했어요'),
(1, '위생이 우려돼요'),
(2, '보통이에요'),
(2, '그럭저럭 괜찮아요'),
(2, '무난해요'),
(2, '평범해요'),
(2, '아쉬운 점이 있어요'),
(3, '괜찮아요'),
(3, '보통이에요'),
(3, '무난해요'),
(3, '그럭저럭 괜찮아요'),
(3, '평범해요'),
(4, '맛있어요'),
(4, '서비스가 좋아요'),
(4, '깨끗해요'),
(4, '친절해요'),
(4, '재방문하고 싶어요'),
(5, '최고예요'),
(5, '완벽해요'),
(5, '강력 추천해요'),
(5, '서비스가 훌륭해요'),
(5, '다시 와야겠어요')
on conflict (rating, keyword) do nothing;
