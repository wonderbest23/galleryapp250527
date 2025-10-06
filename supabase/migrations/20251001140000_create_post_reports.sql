-- 게시글 신고 테이블 생성
create table if not exists public.post_reports (
  id uuid default gen_random_uuid() primary key,
  post_id bigint not null,
  reporter_id uuid references auth.users(id) on delete cascade not null,
  reason text not null,
  detail text not null,
  status text default 'pending',
  admin_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 정책 설정
alter table public.post_reports enable row level security;

-- 사용자는 자신의 신고만 볼 수 있음
create policy "Users can view their own reports"
  on public.post_reports for select
  using (auth.uid() = reporter_id);

-- 사용자는 신고를 생성할 수 있음
create policy "Users can create reports"
  on public.post_reports for insert
  with check (auth.uid() = reporter_id);

-- 관리자는 모든 신고를 볼 수 있음
create policy "Admins can view all reports"
  on public.post_reports for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- 관리자는 모든 신고를 수정할 수 있음
create policy "Admins can update all reports"
  on public.post_reports for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- 인덱스 생성
create index if not exists post_reports_post_id_idx on public.post_reports(post_id);
create index if not exists post_reports_status_idx on public.post_reports(status);
create index if not exists post_reports_created_at_idx on public.post_reports(created_at desc);

