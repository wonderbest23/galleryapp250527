-- Function to increment views atomically without RLS restriction
create or replace function public.increment_view(p_post_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  new_cnt integer;
begin
  update community_post
  set views = coalesce(views,0) + 1
  where id = p_post_id
  returning views into new_cnt;

  return new_cnt;
end;
$$;

grant execute on function public.increment_view(uuid) to anon, authenticated; 