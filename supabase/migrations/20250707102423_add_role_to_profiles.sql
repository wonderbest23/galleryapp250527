-- add role column
alter table if exists public.profiles add column if not exists role text default 'user';

-- classify pre 2025-05-02 as gallery
update public.profiles set role = 'gallery' where created_at < '2025-05-02';
