begin;

create or replace function public.v2_pvp_room_payload(p_match public.v2_pvp_matches)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'matchId',p_match.id,'version',p_match.version,'format',p_match.format,
    'ownCharacterId',case when p_match.player_one_user_id=(select auth.uid()) then p_match.player_one_character_id else p_match.player_two_character_id end,
    'opponentCharacterId',case when p_match.player_one_user_id=(select auth.uid()) then p_match.player_two_character_id else p_match.player_one_character_id end,
    'ownCharacterIds',case when p_match.player_one_user_id=(select auth.uid())
      then jsonb_build_array(p_match.player_one_character_id) || case when p_match.player_one_secondary_character_id is null then '[]'::jsonb else jsonb_build_array(p_match.player_one_secondary_character_id) end
      else jsonb_build_array(p_match.player_two_character_id) || case when p_match.player_two_secondary_character_id is null then '[]'::jsonb else jsonb_build_array(p_match.player_two_secondary_character_id) end end,
    'opponentCharacterIds',case when p_match.player_one_user_id=(select auth.uid())
      then jsonb_build_array(p_match.player_two_character_id) || case when p_match.player_two_secondary_character_id is null then '[]'::jsonb else jsonb_build_array(p_match.player_two_secondary_character_id) end
      else jsonb_build_array(p_match.player_one_character_id) || case when p_match.player_one_secondary_character_id is null then '[]'::jsonb else jsonb_build_array(p_match.player_one_secondary_character_id) end end,
    'state',p_match.state,'status',p_match.status
  )
$$;

create or replace function public.v2_get_pvp_team_roster(p_match_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare room public.v2_pvp_matches; result jsonb;
begin
  select * into room from public.v2_pvp_matches where id=p_match_id;
  if room.id is null or (select auth.uid()) not in (room.player_one_user_id,room.player_two_user_id) then
    raise exception 'Partida PvP não encontrada' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'team',x.team,'slot',x.slot,
    'character',jsonb_build_object(
      'id',c.id,'name',c.name,'race_id',c.race_id,'class_id',c.class_id,'class_path_key',c.class_path_key,
      'level',c.level,'image_url',c.image_url,'adventure_rank',c.adventure_rank,'allocated_attributes',c.allocated_attributes
    ),
    'equipment',coalesce((select jsonb_agg(jsonb_build_object(
      'id',i.id,'character_id',i.character_id,'item_id',i.item_id,'quantity',i.quantity,'equipped_slot',i.equipped_slot
    ) order by i.id) from public.v2_character_inventory i where i.character_id=c.id),'[]'::jsonb)
  ) order by x.team,x.slot),'[]'::jsonb) into result
  from (
    values
      (1,1,room.player_one_character_id),
      (1,2,room.player_one_secondary_character_id),
      (2,1,room.player_two_character_id),
      (2,2,room.player_two_secondary_character_id)
  ) as x(team,slot,character_id)
  join public.v2_characters c on c.id=x.character_id;
  return jsonb_build_object(
    'format',room.format,
    'ownTeam',case when room.player_one_user_id=(select auth.uid()) then 1 else 2 end,
    'members',result
  );
end; $$;

revoke all on function public.v2_get_pvp_team_roster(uuid) from public,anon;
grant execute on function public.v2_get_pvp_team_roster(uuid) to authenticated;

commit;
