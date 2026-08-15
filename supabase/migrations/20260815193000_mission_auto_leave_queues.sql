begin;

create or replace function public.v2_accept_mission(p_mission_id uuid,p_character_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  chosen public.v2_characters;
  selected public.v2_missions;
  assignment public.v2_mission_assignments;
  completed_count integer;
  needed integer;
  pvp_queues_left integer:=0;
  dungeon_queues_left integer:=0;
begin
  select * into chosen from public.v2_characters
  where id=p_character_id and user_id=(select auth.uid()) for update;
  if chosen.id is null then raise exception 'Personagem não encontrado' using errcode='P0002'; end if;
  if not exists(select 1 from public.v2_active_characters where user_id=(select auth.uid()) and character_id=chosen.id) then
    raise exception 'Este não é o personagem ativo' using errcode='42501';
  end if;
  if public.v2_character_has_active_mission(chosen.id) then raise exception 'Você já possui uma missão em andamento'; end if;
  if exists(select 1 from public.v2_mission_assignments where character_id=chosen.id and status='failed' and retry_after>now()) then
    raise exception 'Após uma falha, aguarde 24 horas para aceitar outra missão';
  end if;

  select * into selected from public.v2_missions where id=p_mission_id for update;
  if selected.id is null or not selected.active or selected.kingdom<>chosen.kingdom or selected.rank<>chosen.adventure_rank
    or chosen.level<selected.min_level or(selected.available_after is not null and selected.available_after>now()) then
    raise exception 'Esta missão não está disponível para o personagem';
  end if;
  if selected.is_rank_trial then
    select count(*)::integer into completed_count from public.v2_mission_assignments a
    join public.v2_missions m on m.id=a.mission_id
    where a.character_id=chosen.id and a.status='completed' and not m.is_rank_trial and m.rank=chosen.adventure_rank;
    select required_completions into needed from public.v2_rank_mission_requirements where rank=chosen.adventure_rank;
    if needed is null or completed_count<needed then raise exception 'Requisitos da prova ainda não foram cumpridos'; end if;
  end if;

  if exists(select 1 from public.v2_arena_sessions where character_id=chosen.id and status='open')
    or exists(select 1 from public.v2_pvp_queue q join public.v2_pvp_matches m on m.id=q.match_id where q.character_id=chosen.id and m.status='active')
    or exists(select 1 from public.v2_dungeon_runs where chosen.id=any(party_character_ids) and status='active') then
    raise exception 'Encerre o combate atual antes de aceitar uma missão';
  end if;

  update public.v2_pvp_queue set status='cancelled'
  where character_id=chosen.id and status in('searching','matched');
  get diagnostics pvp_queues_left=row_count;
  delete from public.v2_dungeon_queue where character_id=chosen.id;
  get diagnostics dungeon_queues_left=row_count;

  insert into public.v2_mission_assignments(mission_id,user_id,character_id)
  values(selected.id,(select auth.uid()),chosen.id) returning * into assignment;
  return jsonb_build_object('assignmentId',assignment.id,'missionName',selected.name,'status','in_progress',
    'pvpQueuesLeft',pvp_queues_left,'dungeonQueuesLeft',dungeon_queues_left);
end;
$$;

revoke all on function public.v2_accept_mission(uuid,uuid) from public,anon;
grant execute on function public.v2_accept_mission(uuid,uuid) to authenticated;

commit;
