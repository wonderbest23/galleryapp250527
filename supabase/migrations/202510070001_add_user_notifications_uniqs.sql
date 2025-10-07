-- user_notifications 스키마/인덱스 보강 및 중복 정리 마이그레이션
-- 1) 테이블 보장
create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  title text,
  message text,
  details jsonb,
  is_read boolean not null default false,
  related_id text,
  created_at timestamptz not null default now()
);

-- 2) 일반 인덱스
create index if not exists idx_user_notifications_user_id on public.user_notifications(user_id);
create index if not exists idx_user_notifications_type on public.user_notifications(type);
create index if not exists idx_user_notifications_created_at on public.user_notifications(created_at desc);
create index if not exists idx_user_notifications_related on public.user_notifications(related_id);

-- 3) 유니크 적용 전, 중복 정리 (같은 user_id,type,related_id는 최신 1개만 남김)
with ranked as (
  select id,
         row_number() over (
           partition by user_id, type, related_id
           order by created_at desc, id desc
         ) as rn
  from public.user_notifications
  where related_id is not null
)
delete from public.user_notifications t
using ranked r
where t.id = r.id and r.rn > 1;

-- 4) 부분 유니크 인덱스(related_id가 있는 경우에만 유니크)
create unique index if not exists uniq_user_notifications_user_type_related_partial
on public.user_notifications(user_id, type, related_id)
where related_id is not null;

-- 5) 선택: 자신의 행만 접근하도록 RLS 정책 (필요 시 주석 해제)
-- alter table public.user_notifications enable row level security;
-- drop policy if exists user_notifications_self_access on public.user_notifications;
-- create policy user_notifications_self_access
--   on public.user_notifications
--   for all
--   using (auth.uid() = user_id)
--   with check (auth.uid() = user_id);


