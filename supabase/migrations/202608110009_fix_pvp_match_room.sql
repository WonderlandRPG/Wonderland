-- Sala PvP: entrega somente os dados públicos de combate do oponente e seus
-- equipamentos, exclusivamente aos participantes da partida.
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
  equipment jsonb;
begin
  if (select auth.uid()) is null then
    raise exception 'Autenticação necessária' using errcode = '42501';
  end if;

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

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', inventory.id,
        'character_id', inventory.character_id,
        'item_id', inventory.item_id,
        'quantity', inventory.quantity,
        'equipped_slot', inventory.equipped_slot
      ) order by inventory.equipped_slot, inventory.id
    ),
    '[]'::jsonb
  ) into equipment
  from public.v2_character_inventory inventory
  where inventory.character_id = opponent.id
    and inventory.equipped_slot is not null;

  return jsonb_build_object(
    'character', jsonb_build_object(
      'id', opponent.id,
      'name', opponent.name,
      'race_id', opponent.race_id,
      'class_id', opponent.class_id,
      'class_path_key', opponent.class_path_key,
      'level', opponent.level,
      'image_url', opponent.image_url,
      'adventure_rank', opponent.adventure_rank,
      'allocated_attributes', opponent.allocated_attributes
    ),
    'equipment', equipment
  );
end;
$$;

revoke all on function public.v2_get_pvp_opponent(uuid) from public, anon;
grant execute on function public.v2_get_pvp_opponent(uuid) to authenticated;

commit;
