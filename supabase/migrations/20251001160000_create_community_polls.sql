-- 투표 테이블 생성
create table if not exists public.community_polls (
  id uuid default gen_random_uuid() primary key,
  post_id bigint not null,
  question text not null,
  options text[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 투표 응답 테이블 생성
create table if not exists public.poll_votes (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references public.community_polls(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  selected_option integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(poll_id, user_id)
);

-- RLS 정책 설정
alter table public.community_polls enable row level security;
alter table public.poll_votes enable row level security;

-- 모든 사용자가 투표를 볼 수 있음
create policy "Anyone can view polls"
  on public.community_polls for select
  using (true);

-- 투표 생성은 게시글 작성자만
create policy "Users can create polls for their posts"
  on public.community_polls for insert
  with check (true);

-- 모든 사용자가 투표 응답을 볼 수 있음
create policy "Anyone can view votes"
  on public.poll_votes for select
  using (true);

-- 사용자는 투표할 수 있음
create policy "Users can vote"
  on public.poll_votes for insert
  with check (auth.uid() = user_id);

-- 인덱스 생성
create index if not exists community_polls_post_id_idx on public.community_polls(post_id);
create index if not exists poll_votes_poll_id_idx on public.poll_votes(poll_id);
create index if not exists poll_votes_user_id_idx on public.poll_votes(user_id);

