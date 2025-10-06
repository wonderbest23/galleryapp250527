-- 사용자 알림 테이블 생성
create table if not exists public.user_notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  link_url text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 정책 설정
alter table public.user_notifications enable row level security;

-- 사용자는 자신의 알림만 볼 수 있음
create policy "Users can view their own notifications"
  on public.user_notifications for select
  using (auth.uid() = user_id);

-- 사용자는 자신의 알림을 읽음 처리할 수 있음
create policy "Users can update their own notifications"
  on public.user_notifications for update
  using (auth.uid() = user_id);

-- 인덱스 생성
create index if not exists user_notifications_user_id_idx on public.user_notifications(user_id);
create index if not exists user_notifications_is_read_idx on public.user_notifications(is_read);
create index if not exists user_notifications_created_at_idx on public.user_notifications(created_at desc);

