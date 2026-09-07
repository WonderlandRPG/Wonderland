-- PvP ready check for solo/duo and authoritative timeout advancement.

alter table public.v2_pvp_matches
  add column if not exists accepted_user_ids uuid[] not null default '{}'::uuid[],
  add column if not exists accept_deadline timestamptz;

alter table public.v2_pvp_matches drop constraint if exists v2_pvp_matches_status_check;
alter table public.v2_pvp_matches
  add constraint v2_pvp_matches_status_check
  check (status in ('awaiting_acceptance','active','finished','abandoned'));

create or replace function public.v2_create_pvp_match_room()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare other_entry public.v2_pvp_queue;
begin
  if new.status <> 'matched' or new.match_id is null then return new; end if;
  select * into other_entry from public.v2_pvp_queue
  where match_id=new.match_id and status='matched' and id<>new.id order by matched_at limit 1;
  if other_entry.id is not null then
    insert into public.v2_pvp_matches(
      id,
      player_one_user_id,player_one_character_id,player_one_secondary_user_id,player_one_secondary_character_id,
      player_two_user_id,player_two_character_id,player_two_secondary_user_id,player_two_secondary_character_id,
      rank,format,status,accepted_user_ids,accept_deadline
    ) values(
      new.match_id,
      other_entry.user_id,other_entry.character_id,other_entry.secondary_user_id,other_entry.secondary_character_id,
      new.user_id,new.character_id,new.secondary_user_id,new.secondary_character_id,
      new.rank,new.format,'awaiting_acceptance','{}'::uuid[],now()+interval '30 seconds'
    ) on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

create or replace function public.v2_pvp_queue_payload(p_entry public.v2_pvp_queue)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  v_partner uuid;
  v_match public.v2_pvp_matches;
  v_required integer := 0;
  v_accepted integer := 0;
  v_acceptance text;
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  if v_user not in (p_entry.user_id,p_entry.secondary_user_id) then
    raise exception 'Fila não encontrada' using errcode='42501';
  end if;

  v_partner := case
    when p_entry.format='duo' and p_entry.user_id=v_user then p_entry.secondary_character_id
    when p_entry.format='duo' and p_entry.secondary_user_id=v_user then p_entry.character_id
    else null
  end;

  if p_entry.match_id is not null then
    select * into v_match from public.v2_pvp_matches where id=p_entry.match_id;
  end if;
  if v_match.id is not null then
    v_required := cardinality(array_remove(array[
      v_match.player_one_user_id,v_match.player_one_secondary_user_id,
      v_match.player_two_user_id,v_match.player_two_secondary_user_id
    ],null));
    v_accepted := cardinality(v_match.accepted_user_ids);
    v_acceptance := case
      when v_match.status='active' then 'ready'
      when v_match.status='awaiting_acceptance' and v_user=any(v_match.accepted_user_ids) then 'accepted'
      when v_match.status='awaiting_acceptance' then 'waiting'
      else 'expired'
    end;
  end if;

  return jsonb_build_object(
    'status',p_entry.status,
    'queueId',p_entry.id,
    'matchId',p_entry.match_id,
    'rank',p_entry.rank,
    'format',p_entry.format,
    'secondaryCharacter',public.v2_pvp_character_card(v_partner),
    'opponent',public.v2_pvp_character_card(p_entry.opponent_character_id),
    'opponentSecondary',public.v2_pvp_character_card(p_entry.opponent_secondary_character_id),
    'acceptanceStatus',v_acceptance,
    'acceptedByYou',coalesce(v_user=any(v_match.accepted_user_ids),false),
    'acceptedCount',v_accepted,
    'requiredCount',v_required,
    'acceptDeadline',v_match.accept_deadline
  );
end;
$$;

create or replace function public.v2_respond_pvp_match(p_match_id uuid,p_accept boolean)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  room public.v2_pvp_matches;
  entry public.v2_pvp_queue;
  participants uuid[];
  accepted uuid[];
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  select * into room from public.v2_pvp_matches where id=p_match_id for update;
  participants := array_remove(array[
    room.player_one_user_id,room.player_one_secondary_user_id,
    room.player_two_user_id,room.player_two_secondary_user_id
  ],null);
  if room.id is null or not (v_user=any(participants)) then
    raise exception 'Partida PvP não encontrada' using errcode='42501';
  end if;

  if room.status='awaiting_acceptance' and room.accept_deadline<=now() then
    update public.v2_pvp_matches set status='abandoned',updated_at=now(),finished_at=now() where id=room.id;
    update public.v2_pvp_queue set status='expired' where match_id=room.id and status='matched';
  elsif room.status='awaiting_acceptance' and not p_accept then
    update public.v2_pvp_matches set status='abandoned',updated_at=now(),finished_at=now() where id=room.id;
    update public.v2_pvp_queue set status='cancelled' where match_id=room.id and status='matched';
  elsif room.status='awaiting_acceptance' and p_accept then
    accepted := case when v_user=any(room.accepted_user_ids)
      then room.accepted_user_ids else array_append(room.accepted_user_ids,v_user) end;
    update public.v2_pvp_matches
      set accepted_user_ids=accepted,
          status=case when cardinality(accepted)=cardinality(participants) then 'active' else status end,
          updated_at=now()
      where id=room.id;
  end if;

  select * into entry from public.v2_pvp_queue
    where match_id=room.id and (user_id=v_user or secondary_user_id=v_user) limit 1;
  return public.v2_pvp_queue_payload(entry);
end;
$$;

create or replace function public.v2_poll_pvp_queue_v2(p_queue_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_user uuid := (select auth.uid()); entry public.v2_pvp_queue; room public.v2_pvp_matches;
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  select * into entry from public.v2_pvp_queue
    where id=p_queue_id and (user_id=v_user or secondary_user_id=v_user);
  if entry.id is null then raise exception 'Fila não encontrada' using errcode='P0002'; end if;
  if entry.status='searching' and entry.joined_at<now()-interval '15 minutes' then
    update public.v2_pvp_queue set status='expired' where id=entry.id returning * into entry;
  elsif entry.status='matched' then
    select * into room from public.v2_pvp_matches where id=entry.match_id for update;
    if room.status='awaiting_acceptance' and room.accept_deadline<=now() then
      update public.v2_pvp_matches set status='abandoned',updated_at=now(),finished_at=now() where id=room.id;
      update public.v2_pvp_queue set status='expired' where match_id=room.id and status='matched';
      select * into entry from public.v2_pvp_queue where id=p_queue_id;
    end if;
  end if;
  return public.v2_pvp_queue_payload(entry);
end;
$$;

create or replace function public.v2_initialize_pvp_match(p_match_id uuid,p_state jsonb)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare room public.v2_pvp_matches; v_user uuid := (select auth.uid());
begin
  select * into room from public.v2_pvp_matches where id=p_match_id for update;
  if room.id is null or v_user not in (
    room.player_one_user_id,room.player_one_secondary_user_id,
    room.player_two_user_id,room.player_two_secondary_user_id
  ) then raise exception 'Partida PvP não encontrada' using errcode='42501'; end if;
  if room.status<>'active' then raise exception 'Aguardando confirmação de todos os jogadores' using errcode='55000'; end if;
  if room.state is null then
    if p_state is null or p_state->>'status'<>'active' or not (p_state?'fighters') or not (p_state?'turnOrder') then
      raise exception 'Estado inicial inválido' using errcode='22023';
    end if;
    update public.v2_pvp_matches set state=p_state,version=1,updated_at=now() where id=room.id;
  end if;
  return true;
end;
$$;

create or replace function public.v2_expire_pvp_turn(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  room public.v2_pvp_matches;
  state jsonb;
  order_ids text[];
  living_ids text[];
  current_id text;
  next_id text;
  current_index integer;
  next_index integer;
  next_round integer;
  actor_name text;
  next_name text;
  message text;
begin
  select * into room from public.v2_pvp_matches where id=p_match_id for update;
  if room.id is null or v_user not in (
    room.player_one_user_id,room.player_one_secondary_user_id,
    room.player_two_user_id,room.player_two_secondary_user_id
  ) then raise exception 'Partida PvP não encontrada' using errcode='42501'; end if;
  if room.status<>'active' or room.state is null
     or coalesce((room.state->>'turnEndsAt')::timestamptz,now()+interval '1 minute')>now() then
    return public.v2_pvp_room_payload(room);
  end if;

  state := room.state;
  current_id := state->>'activeCharacterId';
  select array_agg(value order by ordinality) into order_ids
    from jsonb_array_elements_text(state->'turnOrder') with ordinality;
  select array_agg(id order by position) into living_ids from (
    select id,position from unnest(order_ids) with ordinality as x(id,position)
    where coalesce((state->'fighters'->id->>'hp')::integer,0)>0
  ) living;
  if cardinality(living_ids)=0 then return public.v2_pvp_room_payload(room); end if;
  current_index := array_position(living_ids,current_id);
  next_index := case when current_index is null then 1 else current_index+1 end;
  next_round := coalesce((state->>'round')::integer,1);
  if next_index>cardinality(living_ids) then next_index:=1; next_round:=next_round+1; end if;
  next_id := living_ids[next_index];
  actor_name := coalesce(state->'fighters'->current_id->>'name','O jogador');
  next_name := coalesce(state->'fighters'->next_id->>'name','o próximo jogador');
  message := actor_name||' não agiu a tempo. Turno de '||next_name||'.';

  state := jsonb_set(state,'{activeCharacterId}',to_jsonb(next_id),true);
  state := jsonb_set(state,'{turn}',to_jsonb(coalesce((state->>'turn')::integer,0)+1),true);
  state := jsonb_set(state,'{round}',to_jsonb(next_round),true);
  state := jsonb_set(state,'{turnOrder}',to_jsonb(living_ids),true);
  state := jsonb_set(state,'{turnEndsAt}',to_jsonb((now()+interval '60 seconds')::text),true);
  state := jsonb_set(state,'{turnActions}','{"basic":false,"class":false,"race":false}'::jsonb,true);
  state := jsonb_set(state,'{message}',to_jsonb(message),true);
  state := jsonb_set(state,'{log}',
    to_jsonb((array_append(coalesce(array(select jsonb_array_elements_text(state->'log')),array[]::text[]),message))[-80:]),true);

  update public.v2_pvp_matches set state=state,version=version+1,updated_at=now()
    where id=room.id returning * into room;
  return public.v2_pvp_room_payload(room);
end;
$$;

revoke all on function public.v2_respond_pvp_match(uuid,boolean),public.v2_expire_pvp_turn(uuid) from public,anon;
grant execute on function public.v2_respond_pvp_match(uuid,boolean),public.v2_expire_pvp_turn(uuid) to authenticated;
