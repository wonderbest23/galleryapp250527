-- 커뮤니티 광고 배너 테이블 생성
create table if not exists public.community_ad_banner (
  id uuid default gen_random_uuid() primary key,
  image_url text not null,
  title text not null,
  link_url text,
  is_active boolean default true,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 정책 설정
alter table public.community_ad_banner enable row level security;

-- 모든 사용자가 활성 배너를 볼 수 있음
create policy "Anyone can view active banners"
  on public.community_ad_banner for select
  using (is_active = true);

-- 인덱스 생성
create index if not exists community_ad_banner_is_active_idx on public.community_ad_banner(is_active);
create index if not exists community_ad_banner_display_order_idx on public.community_ad_banner(display_order);

