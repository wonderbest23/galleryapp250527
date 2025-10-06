-- 포인트 시스템을 위한 추가 함수들

-- 포인트 증가 함수
create or replace function increment_points(user_id uuid, points integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set points = coalesce(points, 0) + points
  where id = user_id;
end;
$$;

-- 포인트 차감 함수
create or replace function decrement_points(user_id uuid, points integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set points = greatest(coalesce(points, 0) - points, 0)
  where id = user_id;
end;
$$;

-- 리뷰 작성 시 포인트 적립 함수
create or replace function earn_review_points(p_user_id uuid, p_review_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  now_time timestamz := now();
  lock_until_time timestamz := now_time + interval '48 hours';
  expires_at_time timestamz := now_time + interval '4 months';
begin
  -- 기본 리뷰 포인트 (500P) 적립 (잠금 상태)
  insert into public.point_transactions (
    user_id, transaction_type, amount, source, source_id, 
    status, lock_until, expires_at
  ) values (
    p_user_id, 'earned', 500, 'review', p_review_id,
    'locked', lock_until_time, expires_at_time
  );
  
  -- 프로필 포인트 증가
  update public.profiles
  set points = coalesce(points, 0) + 500
  where id = p_user_id;
end;
$$;

-- 방문 인증 시 포인트 적립 함수
create or replace function earn_visit_points(p_user_id uuid, p_exhibition_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  now_time timestamz := now();
  lock_until_time timestamz := now_time + interval '48 hours';
  expires_at_time timestamz := now_time + interval '4 months';
begin
  -- 방문 인증 포인트 (1000P) 적립 (잠금 상태)
  insert into public.point_transactions (
    user_id, transaction_type, amount, source, source_id, 
    status, lock_until, expires_at
  ) values (
    p_user_id, 'earned', 1000, 'visit', p_exhibition_id,
    'locked', lock_until_time, expires_at_time
  );
  
  -- 프로필 포인트 증가
  update public.profiles
  set points = coalesce(points, 0) + 1000
  where id = p_user_id;
end;
$$;

-- 노쇼 페널티 함수
create or replace function apply_noshow_penalty(p_user_id uuid, p_exhibition_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  now_time timestamz := now();
begin
  -- 노쇼 페널티 포인트 차감 (1500P)
  insert into public.point_transactions (
    user_id, transaction_type, amount, source, source_id, 
    status, unlocked_at, expires_at
  ) values (
    p_user_id, 'spent', -1500, 'noshow_penalty', p_exhibition_id,
    'unlocked', now_time, now_time
  );
  
  -- 프로필 포인트 차감
  update public.profiles
  set points = greatest(coalesce(points, 0) - 1500, 0)
  where id = p_user_id;
  
  -- 경고 횟수 증가
  update public.user_grades
  set noshow_warnings = noshow_warnings + 1,
      updated_at = now()
  where user_id = p_user_id;
  
  -- 경고 2회 시 등급 하향
  update public.user_grades
  set grade = case 
    when grade = 'platinum' then 'gold'
    when grade = 'gold' then 'silver'
    when grade = 'silver' then 'bronze'
    else grade
  end,
  noshow_warnings = 0,
  grade_updated_at = now(),
  updated_at = now()
  where user_id = p_user_id
    and noshow_warnings >= 2;
end;
$$;

-- 리뷰 지연 페널티 함수
create or replace function apply_review_delay_penalty(p_user_id uuid, p_review_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  now_time timestamz := now();
begin
  -- 리뷰 지연 페널티 포인트 차감 (500P)
  insert into public.point_transactions (
    user_id, transaction_type, amount, source, source_id, 
    status, unlocked_at, expires_at
  ) values (
    p_user_id, 'spent', -500, 'delay_penalty', p_review_id,
    'unlocked', now_time, now_time
  );
  
  -- 프로필 포인트 차감
  update public.profiles
  set points = greatest(coalesce(points, 0) - 500, 0)
  where id = p_user_id;
end;
$$;

-- 월 교환 횟수 리셋 함수
create or replace function reset_monthly_exchanges()
returns void
language plpgsql
security definer
as $$
begin
  update public.user_grades
  set monthly_exchanges_used = 0,
      monthly_exchanges_reset_at = date_trunc('month', now()) + interval '1 month',
      updated_at = now()
  where monthly_exchanges_reset_at <= now();
end;
$$;

-- 포인트 만료 처리 함수
create or replace function expire_old_points()
returns void
language plpgsql
security definer
as $$
begin
  -- 만료된 포인트 상태 변경
  update public.point_transactions
  set status = 'expired',
      updated_at = now()
  where status in ('locked', 'unlocked')
    and expires_at <= now();
  
  -- 만료된 포인트를 프로필에서 차감
  with expired_points as (
    select user_id, sum(amount) as total_expired
    from public.point_transactions
    where status = 'expired'
      and transaction_type in ('earned', 'unlocked')
      and amount > 0
    group by user_id
  )
  update public.profiles
  set points = greatest(coalesce(points, 0) - coalesce(ep.total_expired, 0), 0)
  from expired_points ep
  where profiles.id = ep.user_id;
end;
$$;

-- 정기 작업을 위한 스케줄러 함수 (매일 실행)
create or replace function daily_point_maintenance()
returns void
language plpgsql
security definer
as $$
begin
  -- 48시간 잠금 해제
  perform unlock_points_after_48h();
  
  -- 포인트 만료 처리
  perform expire_old_points();
  
  -- 월 교환 횟수 리셋 (매월 1일)
  if extract(day from now()) = 1 then
    perform reset_monthly_exchanges();
  end if;
end;
$$;
