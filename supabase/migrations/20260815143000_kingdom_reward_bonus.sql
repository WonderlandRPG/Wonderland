begin;

create or replace function public.v2_claim_arena_victory(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare session_row public.v2_arena_sessions; character_row public.v2_characters;
  base_xp bigint; base_wg bigint; reward_xp bigint; reward_wg bigint; multiplier numeric;
begin
  select * into session_row from public.v2_arena_sessions
  where id=p_session_id and user_id=(select auth.uid()) and mode='pve' and status='open' for update;
  if session_row.id is null or session_row.created_at<now()-interval '12 hours' then
    raise exception 'Esta batalha expirou. Inicie um novo confronto PvE.' using errcode='P0001';
  end if;
  select * into character_row from public.v2_characters where id=session_row.character_id and user_id=(select auth.uid()) for update;
  if character_row.id is null then raise exception 'Personagem da batalha não encontrado' using errcode='P0002'; end if;
  base_xp:=case character_row.adventure_rank when 'E' then 500 when 'D' then 1000 when 'C' then 2000 when 'B' then 4000 when 'A' then 8000 when 'S' then 15000 when 'EX' then 30000 else 500 end;
  base_wg:=case character_row.adventure_rank when 'E' then 100 when 'D' then 250 when 'C' then 600 when 'B' then 1500 when 'A' then 4000 when 'S' then 10000 when 'EX' then 25000 else 100 end;
  multiplier:=public.v2_kingdom_reward_multiplier(character_row.kingdom);
  reward_xp:=round(base_xp*multiplier); reward_wg:=round(base_wg*multiplier);
  update public.v2_characters set xp=xp+reward_xp,gold=gold+reward_wg,updated_at=now() where id=character_row.id;
  update public.v2_arena_sessions set status='victory',completed_at=now() where id=session_row.id;
  return jsonb_build_object('xp',reward_xp,'wg',reward_wg,'baseXp',base_xp,'baseWg',base_wg,
    'kingdomBonusPercent',round((multiplier-1)*100),'rank',character_row.adventure_rank,'character_id',character_row.id);
end; $$;

create or replace function public.v2_resolve_mission(p_assignment_id uuid,p_completed boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare assignment public.v2_mission_assignments; mission public.v2_missions; chosen public.v2_characters;
  applied_xp bigint:=0; applied_gold bigint:=0; multiplier numeric:=1;
begin
  if not public.v2_is_mission_manager() then raise exception 'Acesso de liderança necessário' using errcode='42501'; end if;
  select * into assignment from public.v2_mission_assignments where id=p_assignment_id for update;
  if assignment.id is null or assignment.status<>'in_progress' then raise exception 'Missão já resolvida ou inexistente'; end if;
  select * into mission from public.v2_missions where id=assignment.mission_id for update;
  select * into chosen from public.v2_characters where id=assignment.character_id for update;
  if p_completed then
    multiplier:=public.v2_kingdom_reward_multiplier(chosen.kingdom);
    applied_xp:=round(mission.reward_xp*multiplier); applied_gold:=round(mission.reward_gold*multiplier);
    update public.v2_mission_assignments set status='completed',resolved_at=now(),resolved_by=(select auth.uid()),reward_xp=applied_xp,reward_gold=applied_gold where id=assignment.id;
    update public.v2_characters set xp=xp+applied_xp,gold=gold+applied_gold,
      adventure_rank=case when mission.is_rank_trial and adventure_rank=mission.rank then mission.promotion_rank else adventure_rank end where id=chosen.id;
    update public.v2_missions set available_after=now()+interval '7 days' where id=mission.id;
  else
    update public.v2_mission_assignments set status='failed',resolved_at=now(),resolved_by=(select auth.uid()),retry_after=now()+interval '24 hours' where id=assignment.id;
  end if;
  insert into public.v2_admin_history(actor_id,action,target_type,target_id,details)
  values((select auth.uid()),case when p_completed then 'mission.completed' else 'mission.failed' end,'mission_assignment',assignment.id::text,
    jsonb_build_object('character_id',chosen.id,'mission_id',mission.id,'kingdom_bonus_percent',round((multiplier-1)*100)));
  return jsonb_build_object('status',case when p_completed then 'completed' else 'failed' end,'xp',applied_xp,'gold',applied_gold,
    'kingdomBonusPercent',round((multiplier-1)*100),'newRank',case when p_completed and mission.is_rank_trial then mission.promotion_rank else chosen.adventure_rank end);
end;
$$;

revoke all on function public.v2_claim_arena_victory(uuid),public.v2_resolve_mission(uuid,boolean) from public,anon;
grant execute on function public.v2_claim_arena_victory(uuid),public.v2_resolve_mission(uuid,boolean) to authenticated;

commit;
