update public.v2_pvp_queue q set status='expired'
where q.status='matched' and exists(select 1 from public.v2_pvp_matches m where m.id=q.match_id and m.status<>'active');

create or replace function public.v2_release_pvp_queue_on_match_end() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status<>'active' and old.status='active' then
    update public.v2_pvp_queue set status='expired' where match_id=new.id and status='matched';
  end if;
  return new;
end;
$$;
revoke all on function public.v2_release_pvp_queue_on_match_end() from public,anon,authenticated;
drop trigger if exists v2_release_pvp_queue_on_match_end on public.v2_pvp_matches;
create trigger v2_release_pvp_queue_on_match_end after update of status on public.v2_pvp_matches for each row execute function public.v2_release_pvp_queue_on_match_end();
