-- Table to track which viewer already saw which post
create table if not exists community_post_viewer (
  post_id uuid not null references community_post(id) on delete cascade,
  viewer_id text not null,
  viewed_at timestamptz default now(),
  primary key (post_id, viewer_id)
);

-- Function to increment views only on first view per viewer
create or replace function public.increment_view(p_post_id uuid, p_viewer text)
returns integer
language plpgsql
security definer
as $$
declare
  new_cnt integer;
begin
  -- attempt to insert viewer record; if already exists nothing happens
  insert into community_post_viewer(post_id, viewer_id)
  values (p_post_id, p_viewer)
  on conflict do nothing;

  if found then
    -- new viewer, increment
    update community_post
    set views = coalesce(views,0) + 1
    where id = p_post_id
    returning views into new_cnt;
  else
    -- already viewed; just return current value
    select views into new_cnt from community_post where id = p_post_id;
  end if;

  return new_cnt;
end;
$$;

grant execute on function public.increment_view(uuid, text) to anon, authenticated; 