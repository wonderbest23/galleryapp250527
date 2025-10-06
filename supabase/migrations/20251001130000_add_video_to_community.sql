-- community_post 테이블에 video_url 컬럼 추가
alter table if exists public.community_post 
add column if not exists video_url text;

-- 코멘트 추가
comment on column public.community_post.video_url is '숏폼 영상 URL';

