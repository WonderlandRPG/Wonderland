drop function if exists public.v2_character_ranking();
create function public.v2_character_ranking()
returns table(
  id uuid,user_id uuid,name text,level integer,xp bigint,race_name text,class_name text,image_url text,
  kingdom text,adventure_rank text,title_name text,title_style jsonb,title_rarity text,cosmetics jsonb
)
language sql stable security definer set search_path=''
as $$
  select c.id,c.user_id,c.name,c.level,c.xp,r.name,cl.name,c.image_url,c.kingdom,c.adventure_rank,
    title.name,title.title_style,title.rarity,coalesce(c.cosmetics,'{}'::jsonb)
  from public.v2_characters c
  join public.v2_content r on r.id=c.race_id
  join public.v2_content cl on cl.id=c.class_id
  left join public.v2_character_inventory ti on ti.character_id=c.id and ti.equipped_slot='title'
  left join public.v2_shop_items title on title.id=ti.item_id
  order by c.level desc,c.xp desc,c.created_at asc
  limit 100
$$;
revoke all on function public.v2_character_ranking() from public,anon;
grant execute on function public.v2_character_ranking() to authenticated;

drop function if exists public.v2_pvp_ranking();
create function public.v2_pvp_ranking()
returns table(
  id uuid,user_id uuid,name text,level integer,image_url text,race_name text,class_name text,adventure_rank text,
  matches bigint,victories bigint,defeats bigint,win_rate numeric,title_name text,title_style jsonb,title_rarity text,cosmetics jsonb
)
language sql stable security definer set search_path=''
as $$
  select c.id,c.user_id,c.name,c.level,c.image_url,r.name,cl.name,c.adventure_rank,
    count(h.id),count(h.id) filter(where h.result='victory'),count(h.id) filter(where h.result='defeat'),
    round((count(h.id) filter(where h.result='victory')::numeric/nullif(count(h.id),0))*100,1),
    title.name,title.title_style,title.rarity,coalesce(c.cosmetics,'{}'::jsonb)
  from public.v2_pvp_history h
  join public.v2_characters c on c.id=h.character_id
  join public.v2_content r on r.id=c.race_id
  join public.v2_content cl on cl.id=c.class_id
  left join public.v2_character_inventory ti on ti.character_id=c.id and ti.equipped_slot='title'
  left join public.v2_shop_items title on title.id=ti.item_id
  group by c.id,c.user_id,c.name,c.level,c.image_url,r.name,cl.name,c.adventure_rank,title.name,title.title_style,title.rarity,c.cosmetics
  order by 12 desc,10 desc,9 desc,c.name
  limit 100
$$;
revoke all on function public.v2_pvp_ranking() from public,anon;
grant execute on function public.v2_pvp_ranking() to authenticated;

create or replace function public.v2_get_pvp_opponent(p_match_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare entry public.v2_pvp_queue; opponent public.v2_characters; equipment jsonb;
begin
  if (select auth.uid()) is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  select * into entry from public.v2_pvp_queue
  where match_id=p_match_id and user_id=(select auth.uid()) and status='matched' and matched_at>=now()-interval '12 hours' limit 1;
  if entry.id is null then raise exception 'Partida PvP não encontrada ou expirada' using errcode='P0002'; end if;
  select * into opponent from public.v2_characters where id=entry.opponent_character_id;
  if opponent.id is null then raise exception 'Oponente da partida não encontrado' using errcode='P0002'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',inventory.id,'character_id',inventory.character_id,'item_id',inventory.item_id,'quantity',inventory.quantity,'equipped_slot',inventory.equipped_slot) order by inventory.equipped_slot,inventory.id),'[]'::jsonb)
  into equipment from public.v2_character_inventory inventory where inventory.character_id=opponent.id and inventory.equipped_slot is not null;
  return jsonb_build_object(
    'character',jsonb_build_object('id',opponent.id,'name',opponent.name,'race_id',opponent.race_id,'class_id',opponent.class_id,'class_path_key',opponent.class_path_key,'level',opponent.level,'image_url',opponent.image_url,'adventure_rank',opponent.adventure_rank,'allocated_attributes',opponent.allocated_attributes,'cosmetics',coalesce(opponent.cosmetics,'{}'::jsonb)),
    'equipment',equipment
  );
end;
$$;

create or replace function public.v2_get_pvp_team_roster(p_match_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare room public.v2_pvp_matches; result jsonb; v_user uuid:=(select auth.uid()); v_users uuid[];
begin
  select * into room from public.v2_pvp_matches where id=p_match_id;
  v_users:=array_remove(array[room.player_one_user_id,room.player_one_secondary_user_id,room.player_two_user_id,room.player_two_secondary_user_id],null);
  if room.id is null or v_user is null or not(v_user=any(v_users)) then raise exception 'Partida PvP não encontrada' using errcode='42501'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'team',x.team,'slot',x.slot,
    'character',jsonb_build_object('id',c.id,'name',c.name,'race_id',c.race_id,'class_id',c.class_id,'class_path_key',c.class_path_key,'level',c.level,'image_url',c.image_url,'adventure_rank',c.adventure_rank,'allocated_attributes',c.allocated_attributes,'cosmetics',coalesce(c.cosmetics,'{}'::jsonb)),
    'equipment',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'character_id',i.character_id,'item_id',i.item_id,'quantity',i.quantity,'equipped_slot',i.equipped_slot) order by i.id) from public.v2_character_inventory i where i.character_id=c.id),'[]'::jsonb)
  ) order by x.team,x.slot),'[]'::jsonb)
  into result
  from(values
    (1,1,room.player_one_character_id),(1,2,room.player_one_secondary_character_id),
    (2,1,room.player_two_character_id),(2,2,room.player_two_secondary_character_id)
  ) as x(team,slot,character_id)
  join public.v2_characters c on c.id=x.character_id;
  return jsonb_build_object('format',room.format,'ownTeam',case when v_user=any(array_remove(array[room.player_one_user_id,room.player_one_secondary_user_id],null)) then 1 else 2 end,'members',result);
end;
$$;
