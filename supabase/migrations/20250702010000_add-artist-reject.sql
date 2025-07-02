-- Add fields for artist rejection handling
alter table public.profiles
  add column if not exists is_artist_rejected boolean default false,
  add column if not exists reject_reason text; 