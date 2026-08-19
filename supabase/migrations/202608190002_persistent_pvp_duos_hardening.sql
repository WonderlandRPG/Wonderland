-- Hardening for persistent real-player 2x2 parties.
-- Replaces nullable NOT IN checks and normalizes party lookup/participant arrays.

create or replace function public.v2_join_pvp_queue_v2(p_character_id uuid, p_format text default 'solo')
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  chosen public.v2_characters;
  partner public.v2_characters;
  partner_character_id uuid;
  partner_user uuid;
  party_id uuid;
  opponent public.v2_pvp_queue;
  own_queue public.v2_pvp_queue;
  new_match uuid;
  normalized_format text := lower(coalesce(p_format,'solo'));
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  if normalized_format not in ('solo','duo') then raise exception 'Formato PvP inválido' using errcode='22023'; end if;

  select * into chosen from public.v2_characters where id=p_character_id and user_id=v_user;
  if chosen.id is null then raise exception 'Personagem inválido' using errcode='42501'; end if;

  if normalized_format='duo' then
    select own.party_id, teammate.user_id, teammate.character_id
      into party_id, partner_user, partner_character_id
    from public.v2_pvp_party_members own
    join public.v2_pvp_party_members teammate
      on teammate.party_id=own.party_id and teammate.user_id<>own.user_id
    where own.user_id=v_user and own.character_id=chosen.id
    limit 1;

    if party_id is null or partner_character_id is null then
      raise exception 'Forme uma dupla com outro jogador usando este personagem antes de buscar 2x2.' using errcode='P0001';
    end if;
    select * into partner from public.v2_characters where id=partner_character_id and user_id=partner_user;
    if partner.id is null then raise exception 'O personagem do parceiro não está mais disponível.' using errcode='P0001'; end if;
    if partner.adventure_rank<>chosen.adventure_rank then
      raise exception 'Os dois personagens da dupla precisam estar no mesmo Rank.' using errcode='P0001';
    end if;
    if public.v2_character_has_active_mission(partner.id) then
      raise exception 'Seu parceiro está em missão e não pode entrar na Arena agora.' using errcode='P0001';
    end if;
    perform pg_advisory_xact_lock(hashtext('wonderland-pvp-party-'||party_id::text));
  end if;

  perform pg_advisory_xact_lock(hashtext('wonderland-pvp-'||normalized_format||'-'||chosen.adventure_rank));
  update public.v2_pvp_queue set status='expired'
    where status='searching' and joined_at < now()-interval '15 minutes';

  if normalized_format='duo' then
    update public.v2_pvp_queue set status='cancelled'
      where status='searching'
        and (user_id=any(array[v_user,partner_user]) or secondary_user_id=any(array[v_user,partner_user]));
  else
    update public.v2_pvp_queue set status='cancelled' where user_id=v_user and status='searching';
  end if;

  select * into opponent from public.v2_pvp_queue
  where status='searching'
    and rank=chosen.adventure_rank
    and format=normalized_format
    and user_id<>v_user
    and (normalized_format='solo' or secondary_user_id is not null)
    and (
      normalized_format='solo'
      or (
        not (user_id=any(array[v_user,partner_user]))
        and not (secondary_user_id=any(array[v_user,partner_user]))
      )
    )
  order by joined_at limit 1 for update skip locked;

  if opponent.id is null then
    insert into public.v2_pvp_queue(user_id,character_id,secondary_user_id,secondary_character_id,rank,format)
    values(v_user,chosen.id,partner_user,partner.id,chosen.adventure_rank,normalized_format)
    returning * into own_queue;
    return public.v2_pvp_queue_payload(own_queue);
  end if;

  new_match := gen_random_uuid();
  update public.v2_pvp_queue set
    status='matched',opponent_character_id=chosen.id,
    opponent_secondary_character_id=partner.id,
    match_id=new_match,matched_at=now()
  where id=opponent.id;

  insert into public.v2_pvp_queue(
    user_id,character_id,secondary_user_id,secondary_character_id,rank,format,status,
    opponent_character_id,opponent_secondary_character_id,match_id,matched_at
  ) values(
    v_user,chosen.id,partner_user,partner.id,chosen.adventure_rank,normalized_format,'matched',
    opponent.character_id,opponent.secondary_character_id,new_match,now()
  ) returning * into own_queue;

  return public.v2_pvp_queue_payload(own_queue);
end;
$$;

create or replace function public.v2_get_pvp_match_state(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare room public.v2_pvp_matches; v_user uuid := (select auth.uid()); v_users uuid[];
begin
  select * into room from public.v2_pvp_matches where id=p_match_id;
  v_users := array_remove(array[
    room.player_one_user_id,room.player_one_secondary_user_id,
    room.player_two_user_id,room.player_two_secondary_user_id
  ],null);
  if room.id is null or v_user is null or not (v_user=any(v_users)) then
    raise exception 'Sala PvP não encontrada' using errcode='42501';
  end if;
  if room.state is null then raise exception 'Sala PvP ainda não inicializada' using errcode='P0002'; end if;
  return public.v2_pvp_room_payload(room);
end;
$$;

create or replace function public.v2_initialize_pvp_match(p_match_id uuid, p_state jsonb)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare room public.v2_pvp_matches; v_user uuid := (select auth.uid()); v_users uuid[];
begin
  select * into room from public.v2_pvp_matches where id=p_match_id for update;
  v_users := array_remove(array[
    room.player_one_user_id,room.player_one_secondary_user_id,
    room.player_two_user_id,room.player_two_secondary_user_id
  ],null);
  if room.id is null or v_user is null or not (v_user=any(v_users)) then
    raise exception 'Partida PvP não encontrada' using errcode='42501';
  end if;
  if room.state is null then
    if p_state is null or p_state->>'status'<>'active' or not (p_state ? 'fighters') or not (p_state ? 'turnOrder') then
      raise exception 'Estado inicial inválido' using errcode='22023';
    end if;
    update public.v2_pvp_matches set state=p_state,version=1,updated_at=now() where id=room.id;
  end if;
  return true;
end;
$$;

create or replace function public.v2_update_pvp_match_state(p_match_id uuid, p_expected_version integer, p_state jsonb)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  room public.v2_pvp_matches;
  v_user uuid := (select auth.uid());
  v_users uuid[];
  next_status text;
  next_winner uuid;
  all_character_ids uuid[];
  active_id uuid;
  allowed_ids uuid[];
begin
  select * into room from public.v2_pvp_matches where id=p_match_id for update;
  v_users := array_remove(array[
    room.player_one_user_id,room.player_one_secondary_user_id,
    room.player_two_user_id,room.player_two_secondary_user_id
  ],null);
  if room.id is null or v_user is null or not (v_user=any(v_users)) then
    raise exception 'Partida PvP não encontrada' using errcode='42501';
  end if;
  if room.version<>p_expected_version then return public.v2_pvp_room_payload(room); end if;
  if room.status<>'active' then return public.v2_pvp_room_payload(room); end if;

  active_id := nullif(room.state->>'activeCharacterId','')::uuid;
  allowed_ids := array_remove(array[
    case when room.player_one_user_id=v_user then room.player_one_character_id end,
    case when room.player_one_secondary_user_id=v_user then room.player_one_secondary_character_id end,
    case when room.player_two_user_id=v_user then room.player_two_character_id end,
    case when room.player_two_secondary_user_id=v_user then room.player_two_secondary_character_id end
  ],null);
  if active_id is null or not (active_id=any(allowed_ids)) then
    raise exception 'Não é o seu turno' using errcode='42501';
  end if;

  next_status:=coalesce(p_state->>'status','active');
  if next_status not in ('active','finished','abandoned') then raise exception 'Estado PvP inválido' using errcode='22023'; end if;
  next_winner:=nullif(p_state->>'winnerCharacterId','')::uuid;
  all_character_ids := array_remove(array[
    room.player_one_character_id,room.player_one_secondary_character_id,
    room.player_two_character_id,room.player_two_secondary_character_id
  ],null);
  if next_winner is not null and not (next_winner=any(all_character_ids)) then
    raise exception 'Vencedor inválido' using errcode='22023';
  end if;

  update public.v2_pvp_matches
  set state=p_state,version=version+1,status=next_status,winner_character_id=next_winner,
      updated_at=now(),finished_at=case when next_status='finished' then now() else null end
  where id=room.id returning * into room;
  return public.v2_pvp_room_payload(room);
end;
$$;

create or replace function public.v2_record_pvp_result()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  rounds_played integer;
  team_one_won boolean;
  team_one_ids uuid[];
begin
  if new.status <> 'finished'
     or new.winner_character_id is null
     or (old.status = 'finished' and old.winner_character_id is not null) then
    return new;
  end if;

  rounds_played := greatest(1, coalesce((new.state ->> 'turn')::integer, 1));
  team_one_ids := array_remove(array[new.player_one_character_id,new.player_one_secondary_character_id],null);
  team_one_won := new.winner_character_id=any(team_one_ids);

  insert into public.v2_pvp_history(match_id,character_id,opponent_character_id,result,rank,rounds,finished_at)
  select new.id,v.character_id,v.opponent_character_id,v.result,new.rank,rounds_played,coalesce(new.finished_at,now())
  from (values
    (new.player_one_character_id,new.player_two_character_id,case when team_one_won then 'victory' else 'defeat' end),
    (new.player_one_secondary_character_id,new.player_two_character_id,case when team_one_won then 'victory' else 'defeat' end),
    (new.player_two_character_id,new.player_one_character_id,case when team_one_won then 'defeat' else 'victory' end),
    (new.player_two_secondary_character_id,new.player_one_character_id,case when team_one_won then 'defeat' else 'victory' end)
  ) as v(character_id,opponent_character_id,result)
  where v.character_id is not null
  on conflict(match_id,character_id) do nothing;
  return new;
end;
$$;

create or replace function public.v2_combat_surrender_status(p_kind text, p_combat_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  v_participants uuid[];
  v_required integer;
  v_votes integer;
  v_voted boolean;
  v_completed boolean := false;
  v_status text;
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  if p_kind not in ('arena','pvp','dungeon') then raise exception 'Tipo de combate inválido' using errcode='22023'; end if;

  if p_kind='arena' then
    select array[user_id],status into v_participants,v_status from public.v2_arena_sessions where id=p_combat_id;
    v_completed:=coalesce(v_status,'')<>'open';
  elsif p_kind='pvp' then
    select array(
      select distinct t.user_id
      from unnest(array[
        player_one_user_id,player_one_secondary_user_id,
        player_two_user_id,player_two_secondary_user_id
      ]) as t(user_id)
      where t.user_id is not null
    ),status into v_participants,v_status
    from public.v2_pvp_matches where id=p_combat_id;
    v_completed:=coalesce(v_status,'')<>'active';
  else
    select coalesce(array_agg(distinct c.user_id),array[]::uuid[]),r.status into v_participants,v_status
    from public.v2_dungeon_runs r left join public.v2_characters c on c.id=any(r.party_character_ids)
    where r.id=p_combat_id group by r.status;
    v_completed:=coalesce(v_status,'')<>'active';
  end if;

  if v_participants is null or not (v_user=any(v_participants)) then
    raise exception 'Combate não encontrado para este jogador' using errcode='42501';
  end if;
  v_required:=cardinality(v_participants);
  select count(*)::int,bool_or(user_id=v_user) into v_votes,v_voted
  from public.v2_combat_surrender_votes
  where combat_kind=p_kind and combat_id=p_combat_id and user_id=any(v_participants);
  return jsonb_build_object('completed',v_completed,'votes',coalesce(v_votes,0),'required',v_required,'voted',coalesce(v_voted,false));
end;
$$;

create or replace function public.v2_request_combat_surrender(p_kind text, p_combat_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  v_participants uuid[];
  v_required integer;
  v_votes integer;
  v_voted boolean;
  v_completed boolean := false;
  v_state jsonb;
  v_status text;
  v_log jsonb;
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  if p_kind not in ('arena','pvp','dungeon') then raise exception 'Tipo de combate inválido' using errcode='22023'; end if;

  if p_kind='arena' then
    select array[user_id],status into v_participants,v_status from public.v2_arena_sessions where id=p_combat_id for update;
    if coalesce(v_status,'')<>'open' then v_completed:=true; end if;
  elsif p_kind='pvp' then
    select array(
      select distinct t.user_id
      from unnest(array[
        player_one_user_id,player_one_secondary_user_id,
        player_two_user_id,player_two_secondary_user_id
      ]) as t(user_id)
      where t.user_id is not null
    ),status into v_participants,v_status
    from public.v2_pvp_matches where id=p_combat_id for update;
    if coalesce(v_status,'')<>'active' then v_completed:=true; end if;
  else
    select coalesce(array_agg(distinct c.user_id),array[]::uuid[]),r.status into v_participants,v_status
    from public.v2_dungeon_runs r left join public.v2_characters c on c.id=any(r.party_character_ids)
    where r.id=p_combat_id group by r.status;
    perform 1 from public.v2_dungeon_runs where id=p_combat_id for update;
    if coalesce(v_status,'')<>'active' then v_completed:=true; end if;
  end if;

  if v_participants is null or not (v_user=any(v_participants)) then
    raise exception 'Combate não encontrado para este jogador' using errcode='42501';
  end if;
  v_required:=cardinality(v_participants);
  if not v_completed then
    insert into public.v2_combat_surrender_votes(combat_kind,combat_id,user_id)
    values(p_kind,p_combat_id,v_user) on conflict do nothing;
  end if;
  select count(*)::int,bool_or(user_id=v_user) into v_votes,v_voted
  from public.v2_combat_surrender_votes
  where combat_kind=p_kind and combat_id=p_combat_id and user_id=any(v_participants);

  if not v_completed and v_votes>=v_required then
    if p_kind='arena' then
      update public.v2_arena_sessions set status='defeat',completed_at=now() where id=p_combat_id and status='open';
    elsif p_kind='pvp' then
      select state into v_state from public.v2_pvp_matches where id=p_combat_id;
      v_state:=coalesce(v_state,'{}'::jsonb)||jsonb_build_object(
        'status','finished','winnerCharacterId',null,
        'message','Todos os jogadores confirmaram a desistência. A partida terminou em derrota para os participantes.'
      );
      v_log:=coalesce(v_state->'log','[]'::jsonb);
      v_state:=jsonb_set(v_state,'{log}',v_log||jsonb_build_array('Todos os jogadores confirmaram a desistência. A partida terminou sem vencedor.'),true);
      update public.v2_pvp_matches set state=v_state,status='finished',winner_character_id=null,version=version+1,updated_at=now(),finished_at=now()
      where id=p_combat_id and status='active';
    else
      select state into v_state from public.v2_dungeon_runs where id=p_combat_id;
      v_state:=coalesce(v_state,'{}'::jsonb)||jsonb_build_object('status','defeat','message','Todos os aventureiros confirmaram a desistência. A expedição fracassou.');
      v_log:=coalesce(v_state->'log','[]'::jsonb);
      v_state:=jsonb_set(v_state,'{log}',v_log||jsonb_build_array('O grupo desistiu da expedição e saiu derrotado.'),true);
      update public.v2_dungeon_runs set state=v_state,status='finished',version=version+1,finished_at=now()
      where id=p_combat_id and status='active';
    end if;
    v_completed:=true;
  end if;
  return jsonb_build_object('completed',v_completed,'votes',coalesce(v_votes,0),'required',v_required,'voted',coalesce(v_voted,false));
end;
$$;
