begin;

create or replace function public.v2_leave_all_queues(p_character_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare chosen public.v2_characters; arena_count integer:=0; pvp_match_count integer:=0;
  pvp_queue_count integer:=0; dungeon_queue_count integer:=0; dungeon_run_count integer:=0; blocked_count integer:=0;
begin
  select * into chosen from public.v2_characters
  where id=p_character_id and user_id=(select auth.uid()) for update;
  if chosen.id is null then raise exception 'Personagem inválido' using errcode='42501'; end if;

  update public.v2_arena_sessions set status='abandoned',completed_at=now()
  where user_id=(select auth.uid()) and character_id=chosen.id and status='open';
  get diagnostics arena_count=row_count;

  update public.v2_pvp_matches set status='finished',finished_at=coalesce(finished_at,now()),updated_at=now(),
    state=coalesce(state,'{}'::jsonb)||jsonb_build_object('status','abandoned')
  where status='active' and created_at<now()-interval '2 hours'
    and chosen.id in (player_one_character_id,player_two_character_id);
  get diagnostics pvp_match_count=row_count;

  update public.v2_pvp_queue q set status='cancelled'
  where q.user_id=(select auth.uid()) and q.character_id=chosen.id
    and (q.status='searching' or (q.status='matched' and not exists(
      select 1 from public.v2_pvp_matches m where m.id=q.match_id and m.status='active')));
  get diagnostics pvp_queue_count=row_count;

  delete from public.v2_dungeon_queue where user_id=(select auth.uid()) and character_id=chosen.id;
  get diagnostics dungeon_queue_count=row_count;

  update public.v2_dungeon_runs set status='cancelled',finished_at=coalesce(finished_at,now()),
    state=coalesce(state,'{}'::jsonb)||jsonb_build_object('status','abandoned')
  where status='active' and started_at<now()-interval '12 hours' and chosen.id=any(party_character_ids);
  get diagnostics dungeon_run_count=row_count;

  select count(*)::integer into blocked_count from (
    select id from public.v2_pvp_matches where status='active' and chosen.id in (player_one_character_id,player_two_character_id)
    union all select id from public.v2_dungeon_runs where status='active' and chosen.id=any(party_character_ids)
  ) active_combats;

  return jsonb_build_object('arena',arena_count,'pvpMatches',pvp_match_count,'pvpQueues',pvp_queue_count,
    'dungeonQueues',dungeon_queue_count,'dungeonRuns',dungeon_run_count,
    'blocked',blocked_count,'total',arena_count+pvp_match_count+pvp_queue_count+dungeon_queue_count+dungeon_run_count);
end;
$$;

revoke all on function public.v2_leave_all_queues(uuid) from public,anon;
grant execute on function public.v2_leave_all_queues(uuid) to authenticated;

create or replace function public.v2_accept_mission(p_mission_id uuid,p_character_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare chosen public.v2_characters; selected public.v2_missions; assignment public.v2_mission_assignments;
  completed_count integer; needed integer;
begin
  select * into chosen from public.v2_characters where id=p_character_id and user_id=(select auth.uid()) for update;
  if chosen.id is null then raise exception 'Personagem não encontrado' using errcode='P0002'; end if;
  if not exists(select 1 from public.v2_active_characters where user_id=(select auth.uid()) and character_id=chosen.id) then raise exception 'Este não é o personagem ativo' using errcode='42501'; end if;
  if public.v2_character_has_active_mission(chosen.id) then raise exception 'Você já possui uma missão em andamento'; end if;
  if exists(select 1 from public.v2_mission_assignments where character_id=chosen.id and status='failed' and retry_after>now()) then raise exception 'Após uma falha, aguarde 24 horas para aceitar outra missão'; end if;
  if exists(select 1 from public.v2_arena_sessions where character_id=chosen.id and status='open')
    or exists(select 1 from public.v2_pvp_queue q where q.character_id=chosen.id and (q.status='searching' or (q.status='matched' and exists(select 1 from public.v2_pvp_matches m where m.id=q.match_id and m.status='active'))))
    or exists(select 1 from public.v2_dungeon_queue where character_id=chosen.id)
    or exists(select 1 from public.v2_dungeon_runs where chosen.id=any(party_character_ids) and status='active') then
    raise exception 'Saia das filas e encerre combates antes de aceitar uma missão';
  end if;
  select * into selected from public.v2_missions where id=p_mission_id for update;
  if selected.id is null or not selected.active or selected.kingdom<>chosen.kingdom or selected.rank<>chosen.adventure_rank or chosen.level<selected.min_level or (selected.available_after is not null and selected.available_after>now()) then raise exception 'Esta missão não está disponível para o personagem'; end if;
  if selected.is_rank_trial then
    select count(*)::integer into completed_count from public.v2_mission_assignments a join public.v2_missions m on m.id=a.mission_id where a.character_id=chosen.id and a.status='completed' and not m.is_rank_trial and m.rank=chosen.adventure_rank;
    select required_completions into needed from public.v2_rank_mission_requirements where rank=chosen.adventure_rank;
    if needed is null or completed_count<needed then raise exception 'Requisitos da prova ainda não foram cumpridos'; end if;
  end if;
  insert into public.v2_mission_assignments(mission_id,user_id,character_id) values(selected.id,(select auth.uid()),chosen.id) returning * into assignment;
  return jsonb_build_object('assignmentId',assignment.id,'missionName',selected.name,'status','in_progress');
end;
$$;

revoke all on function public.v2_accept_mission(uuid,uuid) from public,anon;
grant execute on function public.v2_accept_mission(uuid,uuid) to authenticated;
commit;
