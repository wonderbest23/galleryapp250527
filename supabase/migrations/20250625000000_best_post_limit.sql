-- Add columns to mark best posts and timestamp
alter table if exists community_post
  add column if not exists is_best boolean default false,
  add column if not exists best_timestamp timestamptz;

-- Update like_post_once function to enforce best post limit (5)
create or replace function like_post_once(p_post_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _exists boolean;
begin
  -- prevent duplicate like by same user
  select exists(select 1 from liker where post_id = p_post_id and user_id = p_user_id) into _exists;
  if _exists then
    raise exception 'duplicate like';
  end if;

  insert into liker(post_id, user_id) values(p_post_id, p_user_id);

  update community_post set likes = likes + 1 where id = p_post_id;

  -- mark as best when threshold reached
  update community_post
    set is_best = true,
        best_timestamp = coalesce(best_timestamp, now())
  where id = p_post_id
    and likes >= 10
    and is_best = false;

  -- ensure only latest 5 best posts remain
  with cte as (
    select id
      from community_post
      where is_best = true
      order by best_timestamp desc
      offset 5
  )
  update community_post set is_best = false, best_timestamp = null where id in (select id from cte);
end;
$$; 