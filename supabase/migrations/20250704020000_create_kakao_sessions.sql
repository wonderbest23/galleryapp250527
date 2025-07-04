-- Create table for Kakao admin 2FA sessions
create table if not exists public.kakao_sessions (
  id text primary key,
  verified boolean not null default false,
  created_at timestamp with time zone default now()
);

-- Enable realtime replication
alter publication supabase_realtime add table public.kakao_sessions; 