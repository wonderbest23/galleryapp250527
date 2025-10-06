-- 기자단 신청 테이블 생성
create table if not exists public.journalist_applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  phone text not null,
  introduction text not null,
  experience text not null,
  portfolio_links text[] default '{}',
  interests text[] not null,
  available_time text not null,
  visit_frequency text not null,
  status text default 'pending',
  admin_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 정책 설정
alter table public.journalist_applications enable row level security;

-- 사용자는 자신의 신청만 볼 수 있음
create policy "Users can view their own applications"
  on public.journalist_applications for select
  using (auth.uid() = user_id);

-- 사용자는 자신의 신청만 생성할 수 있음
create policy "Users can create their own applications"
  on public.journalist_applications for insert
  with check (auth.uid() = user_id);

-- 인덱스 생성
create index if not exists journalist_applications_user_id_idx on public.journalist_applications(user_id);
create index if not exists journalist_applications_status_idx on public.journalist_applications(status);
create index if not exists journalist_applications_created_at_idx on public.journalist_applications(created_at desc);

-- 프로필에 기자단 여부 컬럼 추가
alter table if exists public.profiles 
add column if not exists is_journalist boolean default false;

