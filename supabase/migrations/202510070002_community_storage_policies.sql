-- 커뮤니티 업로드용 스토리지 버킷 및 정책 보강
-- 1) 버킷 생성(없으면)
insert into storage.buckets (id, name, public)
select 'community-images', 'community-images', true
where not exists (select 1 from storage.buckets where id = 'community-images');

insert into storage.buckets (id, name, public)
select 'community-videos', 'community-videos', true
where not exists (select 1 from storage.buckets where id = 'community-videos');

-- 2) RLS 정책: 공개 읽기, 로그인 사용자는 업로드/수정 본인 것만
-- 이미지
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname='storage' and tablename='objects' and policyname='community_images_read_public'
  ) then
    execute $$create policy community_images_read_public on storage.objects
      for select using (bucket_id = 'community-images');$$;
  end if;
  if not exists (
    select 1 from pg_policies 
    where schemaname='storage' and tablename='objects' and policyname='community_images_insert_auth'
  ) then
    execute $$create policy community_images_insert_auth on storage.objects
      for insert to authenticated with check (bucket_id = 'community-images' and owner = auth.uid());$$;
  end if;
  if not exists (
    select 1 from pg_policies 
    where schemaname='storage' and tablename='objects' and policyname='community_images_update_auth'
  ) then
    execute $$create policy community_images_update_auth on storage.objects
      for update to authenticated using (bucket_id = 'community-images' and owner = auth.uid());$$;
  end if;
end $$;

-- 비디오
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname='storage' and tablename='objects' and policyname='community_videos_read_public'
  ) then
    execute $$create policy community_videos_read_public on storage.objects
      for select using (bucket_id = 'community-videos');$$;
  end if;
  if not exists (
    select 1 from pg_policies 
    where schemaname='storage' and tablename='objects' and policyname='community_videos_insert_auth'
  ) then
    execute $$create policy community_videos_insert_auth on storage.objects
      for insert to authenticated with check (bucket_id = 'community-videos' and owner = auth.uid());$$;
  end if;
  if not exists (
    select 1 from pg_policies 
    where schemaname='storage' and tablename='objects' and policyname='community_videos_update_auth'
  ) then
    execute $$create policy community_videos_update_auth on storage.objects
      for update to authenticated using (bucket_id = 'community-videos' and owner = auth.uid());$$;
  end if;
end $$;

-- 3) 테이블 권한 점검(삽입은 로그인 사용자만, 본인 행만)
-- community_post
alter table if exists public.community_post enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='community_post' and policyname='post_insert_self'
  ) then
    execute $$create policy post_insert_self on public.community_post for insert to authenticated with check (user_id = auth.uid());$$;
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='community_post' and policyname='post_select_all'
  ) then
    execute $$create policy post_select_all on public.community_post for select using (true);$$;
  end if;
end $$;

-- community_comments
alter table if exists public.community_comments enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='community_comments' and policyname='comment_insert_self'
  ) then
    execute $$create policy comment_insert_self on public.community_comments for insert to authenticated with check (user_id = auth.uid());$$;
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='community_comments' and policyname='comment_select_all'
  ) then
    execute $$create policy comment_select_all on public.community_comments for select using (true);$$;
  end if;
end $$;


