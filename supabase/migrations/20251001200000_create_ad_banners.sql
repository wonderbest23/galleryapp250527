-- 광고 배너 테이블 생성
create table if not exists public.ad_banners (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  subtitle text not null,
  image_url text,
  link_url text,
  is_active boolean default true,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 정책
alter table public.ad_banners enable row level security;

-- 모든 사용자가 광고 배너를 볼 수 있음
create policy "Ad banners are viewable by everyone." on public.ad_banners for select using (true);

-- 관리자만 광고 배너를 관리할 수 있음
create policy "Admins can manage ad banners." on public.ad_banners for all using (
  auth.uid() in (
    select user_id from public.profiles 
    where is_admin = true
  )
);

-- 샘플 광고 데이터 삽입
insert into public.ad_banners (title, subtitle, image_url, link_url, is_active, display_order) values
('에어로케이 특별한 추석 특가', '일본 항공권 편도 총액 4만원대~', 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=200&fit=crop', 'https://www.aerok.com', true, 1),
('아트앤브릿지 신규 회원 혜택', '첫 구매 시 20% 할인 + 무료배송', 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=200&fit=crop', '/mypage/reward-shop', true, 2);
