-- 기자단 프로필 테이블
create table if not exists public.journalist_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  title text not null,
  profile_image text,
  bio text,
  is_featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 기자단 기사 테이블
create table if not exists public.journalist_articles (
  id uuid default gen_random_uuid() primary key,
  journalist_id uuid references public.journalist_profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  excerpt text,
  cover_image text,
  likes_count integer default 0,
  views_count integer default 0,
  is_published boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 정책
alter table public.journalist_profiles enable row level security;
alter table public.journalist_articles enable row level security;

-- journalist_profiles RLS
create policy "Journalist profiles are viewable by everyone." on public.journalist_profiles for select using (true);
create policy "Users can insert their own journalist profile." on public.journalist_profiles for insert with check (auth.uid() = user_id);
create policy "Users can update their own journalist profile." on public.journalist_profiles for update using (auth.uid() = user_id);

-- journalist_articles RLS
create policy "Journalist articles are viewable by everyone." on public.journalist_articles for select using (true);
create policy "Journalists can insert their own articles." on public.journalist_articles for insert with check (
  auth.uid() in (select user_id from public.journalist_profiles where id = journalist_id)
);
create policy "Journalists can update their own articles." on public.journalist_articles for update using (
  auth.uid() in (select user_id from public.journalist_profiles where id = journalist_id)
);
