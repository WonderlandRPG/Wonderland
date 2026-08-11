-- Sala PvP: entrega a ficha do oponente somente aos participantes da partida.
begin;

create or replace function public.v2_get_pvp_opponent(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  entry public.v2_pvp_queue;
  opponent public.v2_characters;
begin
  select * into entry
  from public.v2_pvp_queue
  where match_id = p_match_id
    and user_id = (select auth.uid())
    and status = 'matched'
    and matched_at >= now() - interval '12 hours'
  limit 1;

  if entry.id is null then
    raise exception 'Partida PvP não encontrada ou expirada' using errcode = 'P0002';
  end if;

  select * into opponent
  from public.v2_characters
  where id = entry.opponent_character_id;

  if opponent.id is null then
    raise exception 'Oponente da partida não encontrado' using errcode = 'P0002';
  end if;

  return to_jsonb(opponent);
end;
$$;

revoke all on function public.v2_get_pvp_opponent(uuid) from public, anon;
grant execute on function public.v2_get_pvp_opponent(uuid) to authenticated;

commit;
