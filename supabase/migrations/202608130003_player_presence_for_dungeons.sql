-- Presença leve para formação das futuras expedições cooperativas.
create or replace function public.v2_touch_player_presence()
returns void
language plpgsql
security definer
set search_path=public
as $$
begin
  if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
  insert into public.v2_player_progress(user_id,last_seen_at)
  values(auth.uid(),now())
  on conflict(user_id) do update set last_seen_at=excluded.last_seen_at;
end $$;

revoke execute on function public.v2_touch_player_presence() from public,anon;
grant execute on function public.v2_touch_player_presence() to authenticated;

create or replace function public.v2_get_online_player_count()
returns integer
language plpgsql
security definer
set search_path=public
as $$
begin
  if not public.v2_is_admin() then raise exception 'Acesso negado'; end if;
  return (select count(*)::integer from public.v2_player_progress
    where last_seen_at >= now() - interval '15 minutes');
end
$$;

revoke execute on function public.v2_get_online_player_count() from public,anon;
grant execute on function public.v2_get_online_player_count() to authenticated;
