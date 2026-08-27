begin;

-- O aviso de uma atualização pode ser visto sem ser marcado como lido.
alter table public.v2_update_reads alter column read_at drop not null;
alter table public.v2_update_reads alter column read_at drop default;
alter table public.v2_update_reads add column if not exists seen_at timestamptz;
update public.v2_update_reads set seen_at=coalesce(seen_at,read_at,now()) where seen_at is null;

-- Remove imediatamente todas as penalidades antigas de missão.
update public.v2_mission_assignments set retry_after=null where retry_after is not null;

create or replace function public.v2_get_managed_missions()
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not public.v2_is_mission_manager() then raise exception 'Acesso de liderança necessário' using errcode='42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'assignmentId',a.id,'characterName',c.name,'characterRank',c.adventure_rank,'characterLevel',c.level,
    'missionName',m.name,'missionDescription',m.description,'missionObjective',m.objective,
    'missionRank',m.rank,'kingdom',m.kingdom,'acceptedAt',a.accepted_at,
    'rewardXp',m.reward_xp,'rewardGold',m.reward_gold,'isRankTrial',m.is_rank_trial
  ) order by a.accepted_at) from public.v2_mission_assignments a
    join public.v2_characters c on c.id=a.character_id
    join public.v2_missions m on m.id=a.mission_id
    where a.status='in_progress'),'[]'::jsonb);
end;
$$;

create or replace function public.v2_resolve_mission(p_assignment_id uuid,p_completed boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 assignment public.v2_mission_assignments;
 mission public.v2_missions;
 chosen public.v2_characters;
 desired_xp numeric:=0;
 desired_gold numeric:=0;
 applied_xp bigint:=0;
 applied_gold bigint:=0;
 multiplier numeric:=1;
 bigint_max constant numeric:=9223372036854775807;
begin
 if not public.v2_is_mission_manager() then raise exception 'Acesso de liderança necessário' using errcode='42501'; end if;
 select * into assignment from public.v2_mission_assignments where id=p_assignment_id for update;
 if assignment.id is null or assignment.status<>'in_progress' then raise exception 'Missão já resolvida ou inexistente'; end if;
 select * into mission from public.v2_missions where id=assignment.mission_id for update;
 select * into chosen from public.v2_characters where id=assignment.character_id for update;
 if p_completed then
  multiplier:=public.v2_kingdom_reward_multiplier(chosen.kingdom);
  desired_xp:=greatest(0,round(mission.reward_xp::numeric*multiplier));
  desired_gold:=greatest(0,round(mission.reward_gold::numeric*multiplier));
  applied_xp:=least(desired_xp,greatest(0,bigint_max-chosen.xp::numeric))::bigint;
  applied_gold:=least(desired_gold,greatest(0,bigint_max-chosen.gold::numeric))::bigint;
  update public.v2_mission_assignments set status='completed',resolved_at=now(),resolved_by=(select auth.uid()),
    retry_after=null,reward_xp=applied_xp,reward_gold=applied_gold where id=assignment.id;
  update public.v2_characters set xp=xp+applied_xp,gold=gold+applied_gold,
   adventure_rank=case when mission.is_rank_trial and adventure_rank=mission.rank then mission.promotion_rank else adventure_rank end where id=chosen.id;
  update public.v2_missions set available_after=now()+interval '7 days' where id=mission.id;
 else
  update public.v2_mission_assignments set status='failed',resolved_at=now(),resolved_by=(select auth.uid()),retry_after=null where id=assignment.id;
 end if;
 insert into public.v2_admin_history(actor_id,action,target_type,target_id,details)
 values((select auth.uid()),case when p_completed then 'mission.completed' else 'mission.failed' end,'mission_assignment',assignment.id::text,
  jsonb_build_object('character_id',chosen.id,'mission_id',mission.id,'kingdom_bonus_percent',round((multiplier-1)*100),'desired_xp',desired_xp,'desired_gold',desired_gold,'applied_xp',applied_xp,'applied_gold',applied_gold));
 return jsonb_build_object('status',case when p_completed then 'completed' else 'failed' end,'xp',applied_xp,'gold',applied_gold,
  'kingdomBonusPercent',round((multiplier-1)*100),'newRank',case when p_completed and mission.is_rank_trial then mission.promotion_rank else chosen.adventure_rank end);
end;
$$;

create or replace function public.v2_cancel_mission_assignment(p_assignment_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare assignment public.v2_mission_assignments;
begin
  if not public.v2_is_mission_manager() then raise exception 'Acesso de liderança necessário' using errcode='42501'; end if;
  select * into assignment from public.v2_mission_assignments where id=p_assignment_id and status='in_progress' for update;
  if assignment.id is null then raise exception 'Missão já resolvida ou inexistente'; end if;
  delete from public.v2_mission_assignments where id=assignment.id;
  insert into public.v2_admin_history(actor_id,action,target_type,target_id,details)
  values((select auth.uid()),'mission.cancelled','mission_assignment',assignment.id::text,
    jsonb_build_object('character_id',assignment.character_id,'mission_id',assignment.mission_id));
  return jsonb_build_object('status','cancelled','characterId',assignment.character_id);
end;
$$;

revoke all on function public.v2_cancel_mission_assignment(uuid) from public,anon;
grant execute on function public.v2_cancel_mission_assignment(uuid) to authenticated;

commit;
