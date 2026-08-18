create table if not exists public.v2_combat_surrender_votes (
  combat_kind text not null check (combat_kind in ('arena','pvp','dungeon')),
  combat_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (combat_kind, combat_id, user_id)
);

alter table public.v2_combat_surrender_votes enable row level security;

create or replace function public.v2_combat_surrender_status(p_kind text, p_combat_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
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
    select array[user_id], status into v_participants, v_status from public.v2_arena_sessions where id=p_combat_id;
    v_completed := coalesce(v_status,'') <> 'open';
  elsif p_kind='pvp' then
    select array_remove(array[player_one_user_id,player_two_user_id],null), status into v_participants, v_status from public.v2_pvp_matches where id=p_combat_id;
    v_completed := coalesce(v_status,'') <> 'active';
  else
    select coalesce(array_agg(distinct c.user_id),array[]::uuid[]), r.status into v_participants, v_status
      from public.v2_dungeon_runs r left join public.v2_characters c on c.id=any(r.party_character_ids)
      where r.id=p_combat_id group by r.status;
    v_completed := coalesce(v_status,'') <> 'active';
  end if;

  if v_participants is null or not (v_user=any(v_participants)) then raise exception 'Combate não encontrado para este jogador' using errcode='42501'; end if;

  v_required := cardinality(v_participants);
  select count(*)::int, bool_or(user_id=v_user) into v_votes, v_voted
    from public.v2_combat_surrender_votes
    where combat_kind=p_kind and combat_id=p_combat_id and user_id=any(v_participants);

  return jsonb_build_object('completed',v_completed,'votes',coalesce(v_votes,0),'required',v_required,'voted',coalesce(v_voted,false));
end;
$$;

create or replace function public.v2_request_combat_surrender(p_kind text, p_combat_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
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
    select array[user_id], status into v_participants, v_status from public.v2_arena_sessions where id=p_combat_id for update;
    if coalesce(v_status,'') <> 'open' then v_completed:=true; end if;
  elsif p_kind='pvp' then
    select array_remove(array[player_one_user_id,player_two_user_id],null), status into v_participants, v_status from public.v2_pvp_matches where id=p_combat_id for update;
    if coalesce(v_status,'') <> 'active' then v_completed:=true; end if;
  else
    select coalesce(array_agg(distinct c.user_id),array[]::uuid[]), r.status into v_participants, v_status
      from public.v2_dungeon_runs r left join public.v2_characters c on c.id=any(r.party_character_ids)
      where r.id=p_combat_id group by r.status;
    perform 1 from public.v2_dungeon_runs where id=p_combat_id for update;
    if coalesce(v_status,'') <> 'active' then v_completed:=true; end if;
  end if;

  if v_participants is null or not (v_user=any(v_participants)) then raise exception 'Combate não encontrado para este jogador' using errcode='42501'; end if;

  v_required := cardinality(v_participants);
  if not v_completed then
    insert into public.v2_combat_surrender_votes(combat_kind,combat_id,user_id) values(p_kind,p_combat_id,v_user) on conflict do nothing;
  end if;

  select count(*)::int, bool_or(user_id=v_user) into v_votes,v_voted
    from public.v2_combat_surrender_votes
    where combat_kind=p_kind and combat_id=p_combat_id and user_id=any(v_participants);

  if not v_completed and v_votes >= v_required then
    if p_kind='arena' then
      update public.v2_arena_sessions set status='defeat', completed_at=now() where id=p_combat_id and status='open';
    elsif p_kind='pvp' then
      select state into v_state from public.v2_pvp_matches where id=p_combat_id;
      v_state := coalesce(v_state,'{}'::jsonb) || jsonb_build_object('status','finished','winnerCharacterId',null,'message','Todos os jogadores confirmaram a desistência. A partida terminou em derrota para os participantes.');
      v_log := coalesce(v_state->'log','[]'::jsonb);
      v_state := jsonb_set(v_state,'{log}',v_log || jsonb_build_array('Todos os jogadores confirmaram a desistência. A partida terminou sem vencedor.'),true);
      update public.v2_pvp_matches set state=v_state,status='finished',winner_character_id=null,version=version+1,updated_at=now(),finished_at=now() where id=p_combat_id and status='active';
    else
      select state into v_state from public.v2_dungeon_runs where id=p_combat_id;
      v_state := coalesce(v_state,'{}'::jsonb) || jsonb_build_object('status','defeat','message','Todos os aventureiros confirmaram a desistência. A expedição fracassou.');
      v_log := coalesce(v_state->'log','[]'::jsonb);
      v_state := jsonb_set(v_state,'{log}',v_log || jsonb_build_array('O grupo desistiu da expedição e saiu derrotado.'),true);
      update public.v2_dungeon_runs set state=v_state,status='finished',version=version+1,finished_at=now() where id=p_combat_id and status='active';
    end if;
    v_completed := true;
  end if;

  return jsonb_build_object('completed',v_completed,'votes',coalesce(v_votes,0),'required',v_required,'voted',coalesce(v_voted,false));
end;
$$;

revoke all on function public.v2_combat_surrender_status(text,uuid) from public;
revoke all on function public.v2_request_combat_surrender(text,uuid) from public;
grant execute on function public.v2_combat_surrender_status(text,uuid) to authenticated;
grant execute on function public.v2_request_combat_surrender(text,uuid) to authenticated;
