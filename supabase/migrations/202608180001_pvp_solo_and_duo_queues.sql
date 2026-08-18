begin;

alter table public.v2_pvp_queue
  add column if not exists format text not null default 'solo',
  add column if not exists secondary_character_id uuid references public.v2_characters(id) on delete set null,
  add column if not exists opponent_secondary_character_id uuid references public.v2_characters(id) on delete set null;

alter table public.v2_pvp_matches
  add column if not exists format text not null default 'solo',
  add column if not exists player_one_secondary_character_id uuid references public.v2_characters(id) on delete set null,
  add column if not exists player_two_secondary_character_id uuid references public.v2_characters(id) on delete set null;

do $$ begin
  if not exists(select 1 from pg_constraint where conname='v2_pvp_queue_format_check') then
    alter table public.v2_pvp_queue add constraint v2_pvp_queue_format_check check(format in ('solo','duo'));
  end if;
  if not exists(select 1 from pg_constraint where conname='v2_pvp_matches_format_check') then
    alter table public.v2_pvp_matches add constraint v2_pvp_matches_format_check check(format in ('solo','duo'));
  end if;
end $$;

create index if not exists v2_pvp_queue_format_rank_searching_idx
  on public.v2_pvp_queue(format,rank,joined_at) where status='searching';

create or replace function public.v2_create_pvp_match_room()
returns trigger language plpgsql security definer set search_path='' as $$
declare other_entry public.v2_pvp_queue;
begin
  if new.status <> 'matched' or new.match_id is null then return new; end if;
  select * into other_entry from public.v2_pvp_queue
  where match_id=new.match_id and status='matched' and id<>new.id order by matched_at limit 1;
  if other_entry.id is not null then
    insert into public.v2_pvp_matches(
      id,player_one_user_id,player_one_character_id,player_one_secondary_character_id,
      player_two_user_id,player_two_character_id,player_two_secondary_character_id,rank,format
    ) values(
      new.match_id,other_entry.user_id,other_entry.character_id,other_entry.secondary_character_id,
      new.user_id,new.character_id,new.secondary_character_id,new.rank,new.format
    ) on conflict (id) do nothing;
  end if;
  return new;
end; $$;

create or replace function public.v2_join_pvp_queue_v2(p_character_id uuid,p_format text default 'solo')
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  chosen public.v2_characters;
  partner public.v2_characters;
  opponent public.v2_pvp_queue;
  own_queue public.v2_pvp_queue;
  new_match uuid;
  normalized_format text := lower(coalesce(p_format,'solo'));
begin
  if (select auth.uid()) is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  if normalized_format not in ('solo','duo') then raise exception 'Formato PvP inválido' using errcode='22023'; end if;

  select * into chosen from public.v2_characters
  where id=p_character_id and user_id=(select auth.uid());
  if chosen.id is null then raise exception 'Personagem inválido' using errcode='42501'; end if;

  if normalized_format='duo' then
    select * into partner from public.v2_characters
    where user_id=(select auth.uid())
      and id<>chosen.id
      and adventure_rank=chosen.adventure_rank
    order by level desc, created_at asc
    limit 1;
    if partner.id is null then
      raise exception 'Para entrar no 2x2, sua conta precisa de outro personagem do mesmo Rank.' using errcode='P0001';
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtext('wonderland-pvp-'||normalized_format||'-'||chosen.adventure_rank));
  update public.v2_pvp_queue set status='expired'
    where status='searching' and joined_at < now()-interval '15 minutes';
  update public.v2_pvp_queue set status='cancelled'
    where user_id=(select auth.uid()) and status='searching';

  select * into opponent from public.v2_pvp_queue
  where status='searching'
    and rank=chosen.adventure_rank
    and format=normalized_format
    and user_id<>(select auth.uid())
    and (normalized_format='solo' or secondary_character_id is not null)
  order by joined_at limit 1 for update skip locked;

  if opponent.id is null then
    insert into public.v2_pvp_queue(user_id,character_id,secondary_character_id,rank,format)
    values((select auth.uid()),chosen.id,partner.id,chosen.adventure_rank,normalized_format)
    returning * into own_queue;
    return jsonb_build_object(
      'status','searching','queueId',own_queue.id,'rank',chosen.adventure_rank,
      'format',normalized_format,'secondaryCharacterId',own_queue.secondary_character_id
    );
  end if;

  new_match := gen_random_uuid();
  update public.v2_pvp_queue set
    status='matched',opponent_character_id=chosen.id,
    opponent_secondary_character_id=partner.id,
    match_id=new_match,matched_at=now()
  where id=opponent.id;

  insert into public.v2_pvp_queue(
    user_id,character_id,secondary_character_id,rank,format,status,
    opponent_character_id,opponent_secondary_character_id,match_id,matched_at
  ) values(
    (select auth.uid()),chosen.id,partner.id,chosen.adventure_rank,normalized_format,'matched',
    opponent.character_id,opponent.secondary_character_id,new_match,now()
  ) returning * into own_queue;

  return jsonb_build_object(
    'status','matched','queueId',own_queue.id,'matchId',new_match,'rank',chosen.adventure_rank,
    'format',normalized_format,'secondaryCharacterId',own_queue.secondary_character_id,
    'opponentCharacterId',opponent.character_id,'opponentSecondaryCharacterId',opponent.secondary_character_id
  );
end; $$;

create or replace function public.v2_poll_pvp_queue_v2(p_queue_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  entry public.v2_pvp_queue;
  opponent public.v2_characters;
  opponent_secondary public.v2_characters;
  own_secondary public.v2_characters;
begin
  select * into entry from public.v2_pvp_queue
  where id=p_queue_id and user_id=(select auth.uid());
  if entry.id is null then raise exception 'Fila não encontrada' using errcode='P0002'; end if;
  if entry.status='searching' and entry.joined_at < now()-interval '15 minutes' then
    update public.v2_pvp_queue set status='expired' where id=entry.id;
    entry.status := 'expired';
  end if;
  if entry.opponent_character_id is not null then
    select * into opponent from public.v2_characters where id=entry.opponent_character_id;
  end if;
  if entry.opponent_secondary_character_id is not null then
    select * into opponent_secondary from public.v2_characters where id=entry.opponent_secondary_character_id;
  end if;
  if entry.secondary_character_id is not null then
    select * into own_secondary from public.v2_characters where id=entry.secondary_character_id;
  end if;
  return jsonb_build_object(
    'status',entry.status,'queueId',entry.id,'matchId',entry.match_id,'rank',entry.rank,'format',entry.format,
    'secondaryCharacter',case when own_secondary.id is null then null else jsonb_build_object('id',own_secondary.id,'name',own_secondary.name,'level',own_secondary.level,'rank',own_secondary.adventure_rank,'imageUrl',own_secondary.image_url) end,
    'opponent',case when opponent.id is null then null else jsonb_build_object('id',opponent.id,'name',opponent.name,'level',opponent.level,'rank',opponent.adventure_rank,'imageUrl',opponent.image_url) end,
    'opponentSecondary',case when opponent_secondary.id is null then null else jsonb_build_object('id',opponent_secondary.id,'name',opponent_secondary.name,'level',opponent_secondary.level,'rank',opponent_secondary.adventure_rank,'imageUrl',opponent_secondary.image_url) end
  );
end; $$;

create or replace function public.v2_pvp_room_payload(p_match public.v2_pvp_matches)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'matchId',p_match.id,'version',p_match.version,'format',p_match.format,
    'ownCharacterId',case when p_match.player_one_user_id=(select auth.uid()) then p_match.player_one_character_id else p_match.player_two_character_id end,
    'opponentCharacterId',case when p_match.player_one_user_id=(select auth.uid()) then p_match.player_two_character_id else p_match.player_one_character_id end,
    'ownCharacterIds',case when p_match.player_one_user_id=(select auth.uid())
      then jsonb_strip_nulls(jsonb_build_array(p_match.player_one_character_id,p_match.player_one_secondary_character_id))
      else jsonb_strip_nulls(jsonb_build_array(p_match.player_two_character_id,p_match.player_two_secondary_character_id)) end,
    'opponentCharacterIds',case when p_match.player_one_user_id=(select auth.uid())
      then jsonb_strip_nulls(jsonb_build_array(p_match.player_two_character_id,p_match.player_two_secondary_character_id))
      else jsonb_strip_nulls(jsonb_build_array(p_match.player_one_character_id,p_match.player_one_secondary_character_id)) end,
    'state',p_match.state,'status',p_match.status
  )
$$;

create or replace function public.v2_initialize_pvp_match(p_match_id uuid,p_state jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
declare room public.v2_pvp_matches;
begin
  select * into room from public.v2_pvp_matches where id=p_match_id for update;
  if room.id is null or (select auth.uid()) not in (room.player_one_user_id,room.player_two_user_id) then
    raise exception 'Partida PvP não encontrada' using errcode='42501';
  end if;
  if room.state is null then
    if p_state is null or p_state->>'status'<>'active' or not (p_state ? 'fighters') or not (p_state ? 'turnOrder') then
      raise exception 'Estado inicial inválido' using errcode='22023';
    end if;
    update public.v2_pvp_matches set state=p_state,version=1,updated_at=now() where id=room.id;
  end if;
  return true;
end; $$;

create or replace function public.v2_update_pvp_match_state(p_match_id uuid,p_expected_version integer,p_state jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare room public.v2_pvp_matches; next_status text; next_winner uuid; active_id uuid; allowed_ids uuid[];
begin
  select * into room from public.v2_pvp_matches where id=p_match_id for update;
  if room.id is null or (select auth.uid()) not in (room.player_one_user_id,room.player_two_user_id) then
    raise exception 'Partida PvP não encontrada' using errcode='42501';
  end if;
  if room.version<>p_expected_version then return public.v2_pvp_room_payload(room); end if;
  if room.status<>'active' then return public.v2_pvp_room_payload(room); end if;
  active_id := nullif(room.state->>'activeCharacterId','')::uuid;
  allowed_ids := case when room.player_one_user_id=(select auth.uid())
    then array_remove(array[room.player_one_character_id,room.player_one_secondary_character_id],null)
    else array_remove(array[room.player_two_character_id,room.player_two_secondary_character_id],null) end;
  if active_id is null or not (active_id = any(allowed_ids)) then
    raise exception 'Não é o seu turno' using errcode='42501';
  end if;
  next_status:=coalesce(p_state->>'status','active');
  if next_status not in ('active','finished','abandoned') then raise exception 'Estado PvP inválido' using errcode='22023'; end if;
  next_winner:=nullif(p_state->>'winnerCharacterId','')::uuid;
  if next_winner is not null and next_winner not in (
    room.player_one_character_id,room.player_one_secondary_character_id,
    room.player_two_character_id,room.player_two_secondary_character_id
  ) then raise exception 'Vencedor inválido' using errcode='22023'; end if;
  update public.v2_pvp_matches set state=p_state,version=version+1,status=next_status,winner_character_id=next_winner,
    updated_at=now(),finished_at=case when next_status='finished' then now() else null end
  where id=room.id returning * into room;
  return public.v2_pvp_room_payload(room);
end; $$;

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
    )) from public.v2_character_inventory i where i.character_id=c.id and i.equipped_slot is not null),'[]'::jsonb)
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

revoke all on function public.v2_join_pvp_queue_v2(uuid,text),public.v2_poll_pvp_queue_v2(uuid),public.v2_get_pvp_team_roster(uuid) from public,anon;
grant execute on function public.v2_join_pvp_queue_v2(uuid,text),public.v2_poll_pvp_queue_v2(uuid),public.v2_get_pvp_team_roster(uuid) to authenticated;

commit;
