-- 커뮤니티 좋아요 및 댓글 테이블 생성

create table if not exists public.community_likes (
  post_id uuid references public.community_post(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (post_id, user_id)
);

alter table public.community_likes enable row level security;

create policy "users can read own likes and post likes"
  on public.community_likes for select
  using (true);

create policy "users can like"
  on public.community_likes for insert
  with check (auth.uid() = user_id);

create policy "users can unlike"
  on public.community_likes for delete
  using (auth.uid() = user_id);

create index if not exists community_likes_post_idx on public.community_likes(post_id);

-- 댓글/대댓글
create table if not exists public.community_comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.community_post(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  parent_id uuid references public.community_comments(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.community_comments enable row level security;

create policy "users can read comments"
  on public.community_comments for select
  using (true);

create policy "users can write comments"
  on public.community_comments for insert
  with check (auth.uid() = user_id);

create policy "users can delete own comments"
  on public.community_comments for delete
  using (auth.uid() = user_id);

create index if not exists community_comments_post_idx on public.community_comments(post_id);
create index if not exists community_comments_parent_idx on public.community_comments(parent_id);


