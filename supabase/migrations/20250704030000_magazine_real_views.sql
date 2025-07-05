-- Add real_views column if not exists
alter table public.magazine add column if not exists real_views integer not null default 0;

-- Table to track unique daily magazine views per user
create table if not exists public.magazine_real_views (
  magazine_id bigint references public.magazine(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  viewed_at date not null default current_date,
  primary key (magazine_id, user_id, viewed_at)
);

alter publication supabase_realtime add table public.magazine_real_views; 