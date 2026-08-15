begin;

create or replace function public.v2_accept_mission(p_mission_id uuid,p_character_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 chosen public.v2_characters; selected public.v2_missions; assignment public.v2_mission_assignments;
 completed_count integer; needed integer; pvp_queues_left integer:=0; dungeon_queues_left integer:=0;
begin
 select * into chosen from public.v2_characters where id=p_character_id and user_id=(select auth.uid()) for update;
 if chosen.id is null then raise exception 'Personagem não encontrado' using errcode='P0002'; end if;
 if not exists(select 1 from public.v2_active_characters where user_id=(select auth.uid()) and character_id=chosen.id) then raise exception 'Este não é o personagem ativo' using errcode='42501'; end if;
 if public.v2_character_has_active_mission(chosen.id) then raise exception 'Você já possui uma missão em andamento'; end if;
 if exists(select 1 from public.v2_mission_assignments where character_id=chosen.id and status='failed' and retry_after>now()) then raise exception 'Após uma falha, aguarde 24 horas para aceitar outra missão'; end if;
 select * into selected from public.v2_missions where id=p_mission_id for update;
 if selected.id is null or not selected.active or selected.kingdom<>chosen.kingdom or selected.rank<>chosen.adventure_rank or chosen.level<selected.min_level or(selected.available_after is not null and selected.available_after>now()) then raise exception 'Esta missão não está disponível para o personagem'; end if;
 if selected.is_rank_trial then
  select count(*)::integer into completed_count from public.v2_mission_assignments a join public.v2_missions m on m.id=a.mission_id where a.character_id=chosen.id and a.status='completed' and not m.is_rank_trial and m.rank=chosen.adventure_rank;
  select required_completions into needed from public.v2_rank_mission_requirements where rank=chosen.adventure_rank;
  if needed is null or completed_count<needed then raise exception 'Requisitos da prova ainda não foram cumpridos'; end if;
 end if;
 if exists(select 1 from public.v2_arena_sessions where character_id=chosen.id and status='open' and created_at>=now()-interval '2 hours') or exists(select 1 from public.v2_pvp_queue q join public.v2_pvp_matches m on m.id=q.match_id where q.character_id=chosen.id and m.status='active' and m.updated_at>=now()-interval '2 hours') or exists(select 1 from public.v2_dungeon_runs where chosen.id=any(party_character_ids) and status='active' and started_at>=now()-interval '12 hours') then raise exception 'Encerre o combate atual antes de aceitar uma missão'; end if;
 update public.v2_pvp_queue set status='cancelled' where character_id=chosen.id and status in('searching','matched'); get diagnostics pvp_queues_left=row_count;
 delete from public.v2_dungeon_queue where character_id=chosen.id; get diagnostics dungeon_queues_left=row_count;
 insert into public.v2_mission_assignments(mission_id,user_id,character_id) values(selected.id,(select auth.uid()),chosen.id) returning * into assignment;
 return jsonb_build_object('assignmentId',assignment.id,'missionName',selected.name,'status','in_progress','pvpQueuesLeft',pvp_queues_left,'dungeonQueuesLeft',dungeon_queues_left);
end; $$;

create or replace function public.v2_admin_update_character(p_character_id uuid,p_name text,p_xp bigint,p_gold bigint,p_image_url text,p_kingdom text,p_adventure_rank text,p_class_path_key text)
returns public.v2_characters language plpgsql security definer set search_path='' as $$
declare result public.v2_characters; clean_url text; chosen_class uuid; clean_path text;
begin
 if not public.v2_is_admin() then raise exception 'Acesso negado' using errcode='42501'; end if;
 if p_xp is null or p_gold is null or char_length(trim(p_name)) not between 2 and 32 or p_xp<0 or p_gold<0 then raise exception 'XP e WG devem ser números inteiros não negativos'; end if;
 if p_kingdom not in('aokigahara','darkya','oymyakon','lesedi','namida','skypiece') then raise exception 'Reino inválido'; end if;
 if p_adventure_rank not in('E','D','C','B','A','S','EX') then raise exception 'Rank inválido'; end if;
 select class_id into chosen_class from public.v2_characters where id=p_character_id;
 clean_path:=nullif(trim(coalesce(p_class_path_key,'')),'');
 if clean_path is not null and not exists(select 1 from public.v2_content c,jsonb_array_elements(coalesce(c.payload->'paths','[]'::jsonb)) path where c.id=chosen_class and path->>'key'=clean_path) then raise exception 'Caminho de classe inválido'; end if;
 clean_url:=nullif(trim(coalesce(p_image_url,'')),''); if clean_url is not null and clean_url!~'^https?://' then raise exception 'Link inválido'; end if;
 update public.v2_characters set name=trim(p_name),xp=p_xp,gold=p_gold,image_url=clean_url,kingdom=p_kingdom,adventure_rank=p_adventure_rank,class_path_key=clean_path,updated_at=now() where id=p_character_id returning * into result;
 if result.id is null then raise exception 'Personagem não encontrado' using errcode='P0002'; end if;
 insert into public.v2_admin_history(actor_id,action,target_type,target_id,details) values((select auth.uid()),'character.updated','character',p_character_id::text,jsonb_build_object('name',p_name,'xp',p_xp,'gold',p_gold,'class_path_key',clean_path,'kingdom',p_kingdom));
 return result;
end; $$;

revoke all on function public.v2_accept_mission(uuid,uuid),public.v2_admin_update_character(uuid,text,bigint,bigint,text,text,text,text) from public,anon;
grant execute on function public.v2_accept_mission(uuid,uuid),public.v2_admin_update_character(uuid,text,bigint,bigint,text,text,text,text) to authenticated;

commit;
