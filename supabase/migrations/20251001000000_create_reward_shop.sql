-- profiles 테이블에 points 컬럼 추가
alter table if exists public.profiles 
add column if not exists points integer default 0;

-- 리워드샵 상품 테이블 생성
create table if not exists public.reward_shop_items (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  image_url text,
  points_required integer not null,
  stock integer default 0,
  is_active boolean default true,
  category text default 'general',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 리워드샵 구매 내역 테이블 생성
create table if not exists public.reward_purchases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  item_id uuid references public.reward_shop_items(id) on delete cascade not null,
  points_spent integer not null,
  status text default 'completed',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 정책 설정
alter table public.reward_shop_items enable row level security;
alter table public.reward_purchases enable row level security;

-- 모든 사용자가 활성 상품을 볼 수 있음
create policy "Anyone can view active reward shop items"
  on public.reward_shop_items for select
  using (is_active = true);

-- 사용자는 자신의 구매 내역만 볼 수 있음
create policy "Users can view their own purchases"
  on public.reward_purchases for select
  using (auth.uid() = user_id);

-- 사용자는 자신의 구매 내역만 생성할 수 있음
create policy "Users can create their own purchases"
  on public.reward_purchases for insert
  with check (auth.uid() = user_id);

-- 인덱스 생성
create index if not exists reward_shop_items_is_active_idx on public.reward_shop_items(is_active);
create index if not exists reward_purchases_user_id_idx on public.reward_purchases(user_id);
create index if not exists reward_purchases_created_at_idx on public.reward_purchases(created_at desc);

