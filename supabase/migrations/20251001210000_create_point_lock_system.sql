-- 포인트 잠금 시스템 마이그레이션

-- 1. 포인트 거래 내역 테이블 생성
create table if not exists public.point_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  transaction_type text not null, -- 'earned', 'spent', 'locked', 'unlocked', 'expired'
  amount integer not null,
  source text not null, -- 'visit', 'review', 'deep_review', 'featured', 'ticket_purchase', 'noshow_penalty', 'delay_penalty'
  source_id uuid, -- 관련된 exhibition_id, review_id 등
  status text not null default 'locked', -- 'locked', 'unlocked', 'expired', 'cancelled'
  lock_until timestamptz, -- 잠금 해제 예정 시간
  unlocked_at timestamptz, -- 실제 해제 시간
  expires_at timestamptz not null, -- 포인트 만료 시간 (적립일 + 4개월)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 사용자 등급 정보 테이블 생성
create table if not exists public.user_grades (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  grade text not null default 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
  approved_reviews_60d integer default 0, -- 최근 60일 승인 리뷰 수
  avg_rating_60d numeric(3,2) default 0, -- 최근 60일 평균 평점
  deep_reviews_60d integer default 0, -- 최근 60일 심화 리뷰 수
  featured_count_60d integer default 0, -- 최근 60일 피처드 횟수
  noshow_warnings integer default 0, -- 노쇼 경고 횟수
  monthly_exchanges_used integer default 0, -- 이번 달 사용한 교환 횟수
  monthly_exchanges_reset_at timestamptz default date_trunc('month', now()) + interval '1 month', -- 월 교환 횟수 리셋 시간
  grade_updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- 3. 방문 인증 테이블 생성
create table if not exists public.visit_verifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  exhibition_id uuid references public.exhibition(id) on delete cascade not null,
  visit_time timestamptz not null,
  location_verified boolean default false,
  qr_verified boolean default false,
  verification_status text default 'pending', -- 'pending', 'verified', 'rejected'
  rejection_reason text,
  verified_at timestamptz,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, exhibition_id) -- 전시별 1회만 인증 가능
);

-- 4. 리뷰 품질 검증 테이블 생성
create table if not exists public.review_quality_checks (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references public.exhibition_review(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  quality_status text not null default 'pending', -- 'pending', 'approved', 'needs_revision', 'rejected'
  word_count integer,
  image_count integer,
  is_deep_review boolean default false,
  is_featured boolean default false,
  quality_score numeric(3,2), -- 0.00 ~ 5.00
  feedback text, -- 품질 검증 피드백
  checked_at timestamptz,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. 티켓 교환 내역 테이블 생성
create table if not exists public.ticket_exchanges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  exhibition_id uuid references public.exhibition(id) on delete cascade not null,
  points_spent integer not null,
  exchange_date timestamptz not null,
  visit_date timestamptz, -- 실제 관람 날짜
  status text default 'exchanged', -- 'exchanged', 'visited', 'noshow', 'cancelled'
  cancellation_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 정책 설정
alter table public.point_transactions enable row level security;
alter table public.user_grades enable row level security;
alter table public.visit_verifications enable row level security;
alter table public.review_quality_checks enable row level security;
alter table public.ticket_exchanges enable row level security;

-- 사용자는 자신의 포인트 거래 내역만 볼 수 있음
create policy "Users can view their own point transactions"
  on public.point_transactions for select
  using (auth.uid() = user_id);

-- 사용자는 자신의 등급 정보만 볼 수 있음
create policy "Users can view their own grade info"
  on public.user_grades for select
  using (auth.uid() = user_id);

-- 사용자는 자신의 방문 인증만 볼 수 있음
create policy "Users can view their own visit verifications"
  on public.visit_verifications for select
  using (auth.uid() = user_id);

-- 사용자는 자신의 리뷰 품질 검증만 볼 수 있음
create policy "Users can view their own review quality checks"
  on public.review_quality_checks for select
  using (auth.uid() = user_id);

-- 사용자는 자신의 티켓 교환 내역만 볼 수 있음
create policy "Users can view their own ticket exchanges"
  on public.ticket_exchanges for select
  using (auth.uid() = user_id);

-- 인덱스 생성
create index if not exists point_transactions_user_id_idx on public.point_transactions(user_id);
create index if not exists point_transactions_status_idx on public.point_transactions(status);
create index if not exists point_transactions_lock_until_idx on public.point_transactions(lock_until);
create index if not exists point_transactions_expires_at_idx on public.point_transactions(expires_at);
create index if not exists user_grades_user_id_idx on public.user_grades(user_id);
create index if not exists user_grades_grade_idx on public.user_grades(grade);
create index if not exists visit_verifications_user_id_idx on public.visit_verifications(user_id);
create index if not exists visit_verifications_exhibition_id_idx on public.visit_verifications(exhibition_id);
create index if not exists review_quality_checks_review_id_idx on public.review_quality_checks(review_id);
create index if not exists review_quality_checks_user_id_idx on public.review_quality_checks(user_id);
create index if not exists ticket_exchanges_user_id_idx on public.ticket_exchanges(user_id);
create index if not exists ticket_exchanges_exhibition_id_idx on public.ticket_exchanges(exhibition_id);

-- 포인트 잠금 해제를 위한 함수 생성
create or replace function unlock_points_after_48h()
returns void
language plpgsql
security definer
as $$
begin
  -- 48시간이 지난 잠금 포인트를 해제
  update public.point_transactions
  set status = 'unlocked',
      unlocked_at = now(),
      updated_at = now()
  where status = 'locked'
    and lock_until <= now()
    and verification_status = 'verified'; -- 검증이 완료된 경우만
  
  -- 만료된 포인트 처리
  update public.point_transactions
  set status = 'expired',
      updated_at = now()
  where status in ('locked', 'unlocked')
    and expires_at <= now();
end;
$$;

-- 사용 가능 포인트 조회 함수
create or replace function get_available_points(p_user_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  available_points integer;
begin
  select coalesce(sum(amount), 0)
  into available_points
  from public.point_transactions
  where user_id = p_user_id
    and status = 'unlocked'
    and transaction_type in ('earned', 'unlocked')
    and amount > 0;
  
  return available_points;
end;
$$;

-- 잠금 포인트 조회 함수
create or replace function get_locked_points(p_user_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  locked_points integer;
begin
  select coalesce(sum(amount), 0)
  into locked_points
  from public.point_transactions
  where user_id = p_user_id
    and status = 'locked'
    and transaction_type in ('earned', 'locked')
    and amount > 0;
  
  return locked_points;
end;
$$;

-- 사용자 등급 업데이트 함수
create or replace function update_user_grade(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  current_grade text;
  new_grade text;
  approved_reviews_count integer;
  avg_rating numeric;
  deep_reviews_count integer;
  featured_count integer;
begin
  -- 현재 등급 조회
  select grade into current_grade
  from public.user_grades
  where user_id = p_user_id;
  
  -- 최근 60일 승인 리뷰 수 조회
  select count(*), coalesce(avg(rating), 0)
  into approved_reviews_count, avg_rating
  from public.exhibition_review er
  join public.review_quality_checks rqc on er.id = rqc.review_id
  where er.user_id = p_user_id
    and rqc.quality_status = 'approved'
    and er.created_at >= now() - interval '60 days';
  
  -- 최근 60일 심화 리뷰 수 조회
  select count(*)
  into deep_reviews_count
  from public.review_quality_checks
  where user_id = p_user_id
    and is_deep_review = true
    and quality_status = 'approved'
    and created_at >= now() - interval '60 days';
  
  -- 최근 60일 피처드 횟수 조회
  select count(*)
  into featured_count
  from public.review_quality_checks
  where user_id = p_user_id
    and is_featured = true
    and quality_status = 'approved'
    and created_at >= now() - interval '60 days';
  
  -- 등급 결정 로직
  if approved_reviews_count >= 12 and deep_reviews_count >= 2 and featured_count >= 1 then
    new_grade := 'platinum';
  elsif approved_reviews_count >= 6 and avg_rating >= 4.2 then
    new_grade := 'gold';
  elsif approved_reviews_count >= 3 then
    new_grade := 'silver';
  else
    new_grade := 'bronze';
  end if;
  
  -- 등급이 변경된 경우에만 업데이트
  if current_grade != new_grade then
    update public.user_grades
    set grade = new_grade,
        approved_reviews_60d = approved_reviews_count,
        avg_rating_60d = avg_rating,
        deep_reviews_60d = deep_reviews_count,
        featured_count_60d = featured_count,
        grade_updated_at = now(),
        updated_at = now()
    where user_id = p_user_id;
  else
    -- 등급은 같지만 통계는 업데이트
    update public.user_grades
    set approved_reviews_60d = approved_reviews_count,
        avg_rating_60d = avg_rating,
        deep_reviews_60d = deep_reviews_count,
        featured_count_60d = featured_count,
        updated_at = now()
    where user_id = p_user_id;
  end if;
end;
$$;
