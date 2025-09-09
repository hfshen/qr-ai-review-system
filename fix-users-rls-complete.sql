-- 모든 users 테이블 정책 삭제 후 재생성
-- Supabase SQL Editor에서 실행하세요

-- 모든 기존 정책 삭제 (안전한 방법)
do $$
declare
    pol record;
begin
    for pol in 
        select policyname 
        from pg_policies 
        where tablename = 'users' 
        and schemaname = 'public'
    loop
        execute format('drop policy if exists %I on users', pol.policyname);
    end loop;
end $$;

-- 새로운 정책 생성
create policy "Users can view their own profile" on users
  for select using (auth.uid() = auth_id);

create policy "Users can update their own profile" on users
  for update using (auth.uid() = auth_id);

create policy "Users can insert their own profile" on users
  for insert with check (auth.uid() = auth_id);

-- 모든 사용자가 읽기 가능 (개발용)
create policy "Allow all users to read profiles" on users
  for select using (true);
