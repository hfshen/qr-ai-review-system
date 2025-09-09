-- auth_id로 사용자 조회를 위한 RLS 정책 추가
-- Supabase SQL Editor에서 실행하세요

-- 기존 정책 삭제 (중복 방지)
drop policy if exists "Allow auth_id based queries" on users;

-- auth_id로 조회할 수 있는 정책 추가
create policy "Allow auth_id based queries" on users
  for select using (
    -- 인증된 사용자는 자신의 프로필 조회 가능
    auth.uid() = auth_id
    OR
    -- 관리자는 모든 사용자 조회 가능
    exists (
      select 1 from users 
      where auth_id = auth.uid() 
      and role = 'admin'
    )
    OR
    -- 에이전시 소유자는 자신의 에이전시 사용자들 조회 가능
    exists (
      select 1 from agencies a
      join users u on u.auth_id = auth.uid()
      where a.owner_id = u.id
      and u.role = 'agency_owner'
    )
  );

-- 업데이트 정책도 추가
drop policy if exists "Allow auth_id based updates" on users;

create policy "Allow auth_id based updates" on users
  for update using (
    -- 인증된 사용자는 자신의 프로필 업데이트 가능
    auth.uid() = auth_id
    OR
    -- 관리자는 모든 사용자 업데이트 가능
    exists (
      select 1 from users 
      where auth_id = auth.uid() 
      and role = 'admin'
    )
  );
