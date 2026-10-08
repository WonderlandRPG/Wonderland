begin;

-- Guild leaders can deliver only authorized, monotonic mission progression.
CREATE OR REPLACE FUNCTION public.v2_guard_character()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  allowed_points integer := 100;
  maximum_slots integer := 3;
  valid_arena_reward boolean := false;
  valid_path_choice boolean := false;
  trusted_progression_source text := current_setting('wonderland.progression_source', true);
  trusted_gold_source text := current_setting('wonderland.gold_source', true);
begin
  select coalesce((value #>> '{}')::integer,100) into allowed_points from public.v2_game_settings where key='character.distributable_points' and status='published';
  select coalesce((value #>> '{}')::integer,3) into maximum_slots from public.v2_game_settings where key='character.maximum_slots' and status='published';
  allowed_points:=coalesce(allowed_points,100); maximum_slots:=coalesce(maximum_slots,3);

  if tg_op='INSERT' and not public.v2_is_admin() then new.user_id:=auth.uid(); new.level:=1; new.xp:=0; new.class_path_key:=null; end if;

  if auth.uid() is null or (new.user_id<>auth.uid() and not public.v2_is_admin()) then
    if not ((tg_op='UPDATE' and trusted_gold_source in ('kingdom_salary','arena') and new.user_id=old.user_id and new.gold<>old.gold)
      or (tg_op='UPDATE' and trusted_progression_source='mission' and public.v2_is_mission_manager() and new.user_id=old.user_id)) then
      raise exception 'Acesso negado.' using errcode='42501';
    end if;
  end if;

  if tg_op='INSERT' and (select count(*) from public.v2_characters where user_id=new.user_id)>=maximum_slots then raise exception 'Limite de personagens atingido.' using errcode='23514'; end if;
  if public.v2_character_attribute_total(new.allocated_attributes)<>allowed_points then raise exception 'Distribua exatamente % pontos.',allowed_points using errcode='23514'; end if;
  if not exists(select 1 from public.v2_content where id=new.race_id and content_type='race' and status='published') then raise exception 'Raça inválida ou não publicada.' using errcode='23514'; end if;
  if not exists(select 1 from public.v2_content where id=new.class_id and content_type='class' and status='published') then raise exception 'Classe inválida ou não publicada.' using errcode='23514'; end if;

  if tg_op='UPDATE' and not public.v2_is_admin() then
    valid_path_choice := old.class_path_key is null and new.class_path_key is not null and old.level>=50
      and new.user_id=old.user_id and new.race_id=old.race_id and new.class_id=old.class_id
      and new.level=old.level and new.xp=old.xp and new.allocated_attributes=old.allocated_attributes
      and exists(select 1 from public.v2_content c join public.v2_rework_class_paths p on p.class_slug=c.slug where c.id=old.class_id and c.content_type='class' and c.status='published' and p.path_id=new.class_path_key);

    valid_arena_reward := trusted_progression_source='arena'
      and trusted_gold_source='arena'
      and new.user_id=old.user_id
      and new.race_id=old.race_id
      and new.class_id=old.class_id
      and new.allocated_attributes=old.allocated_attributes
      and new.class_path_key is not distinct from old.class_path_key
      and new.xp>=old.xp
      and new.gold>=old.gold
      and new.level>=old.level;

    if new.user_id<>old.user_id or new.race_id<>old.race_id or new.class_id<>old.class_id or new.level<>old.level or new.xp<>old.xp or new.allocated_attributes<>old.allocated_attributes or new.class_path_key is distinct from old.class_path_key then
      if trusted_progression_source in ('presence','event')
        or (trusted_progression_source='mission' and public.v2_is_mission_manager()) then
        if new.user_id<>old.user_id or new.race_id<>old.race_id or new.class_id<>old.class_id
          or new.allocated_attributes<>old.allocated_attributes
          or new.class_path_key is distinct from old.class_path_key
          or new.xp<old.xp or new.level<old.level then
          raise exception 'Recompensa tentou alterar campos protegidos.' using errcode='42501';
        end if;
      elsif not valid_arena_reward and not valid_path_choice then
        raise exception 'Campos de progressão não podem ser alterados diretamente.' using errcode='42501';
      end if;
    end if;
  end if;

  new.updated_at:=now(); return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.v2_resolve_mission(p_assignment_id uuid, p_completed boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 assignment public.v2_mission_assignments;
 mission public.v2_missions;
 chosen public.v2_characters;
 desired_xp numeric:=0;
 desired_gold numeric:=0;
 applied_xp bigint:=0;
 applied_gold bigint:=0;
 multiplier numeric:=1;
 applied_candies integer:=0;
 prior_progression_source text:=current_setting('wonderland.progression_source',true);
 bigint_max constant numeric:=9223372036854775807;
begin
 if not public.v2_is_mission_manager() then raise exception 'Acesso de liderança necessário' using errcode='42501'; end if;
 select * into assignment from public.v2_mission_assignments where id=p_assignment_id for update;
 if assignment.id is null or assignment.status<>'in_progress' then raise exception 'Missão já resolvida ou inexistente'; end if;
 select * into mission from public.v2_missions where id=assignment.mission_id for update;
 select * into chosen from public.v2_characters where id=assignment.character_id for update;
 if p_completed then
  if mission.event_key is not null then
   desired_xp:=public.v2_festival_rank_xp(chosen.adventure_rank);
   desired_gold:=0;
   applied_candies:=mission.reward_candies;
  else
   multiplier:=public.v2_kingdom_reward_multiplier(chosen.kingdom);
  desired_xp:=greatest(0,round(mission.reward_xp::numeric*multiplier));
  desired_gold:=greatest(0,round(mission.reward_gold::numeric*multiplier));
  end if;
  applied_xp:=least(desired_xp,greatest(0,bigint_max-chosen.xp::numeric))::bigint;
  applied_gold:=least(desired_gold,greatest(0,bigint_max-chosen.gold::numeric))::bigint;
  update public.v2_mission_assignments set status='completed',resolved_at=now(),resolved_by=(select auth.uid()),
    retry_after=null,reward_xp=applied_xp,reward_gold=applied_gold,reward_candies=applied_candies where id=assignment.id;
  perform set_config('wonderland.progression_source','mission',true);
  update public.v2_characters set xp=xp+applied_xp,gold=gold+applied_gold,
   adventure_rank=case when mission.is_rank_trial and adventure_rank=mission.rank then mission.promotion_rank else adventure_rank end where id=chosen.id;
  perform set_config('wonderland.progression_source',coalesce(prior_progression_source,''),true);
  if mission.event_key is null then
   update public.v2_missions set available_after=now()+interval '7 days' where id=mission.id;
  else
   insert into public.v2_festival_wallets(character_id,event_key,candies)
     values(chosen.id,mission.event_key,applied_candies)
   on conflict(character_id,event_key) do update
     set candies=public.v2_festival_wallets.candies+excluded.candies,updated_at=now();
  end if;
 else
  update public.v2_mission_assignments set status='failed',resolved_at=now(),resolved_by=(select auth.uid()),retry_after=null where id=assignment.id;
 end if;
 insert into public.v2_admin_history(actor_id,action,target_type,target_id,details)
 values((select auth.uid()),case when p_completed then 'mission.completed' else 'mission.failed' end,'mission_assignment',assignment.id::text,
  jsonb_build_object('character_id',chosen.id,'mission_id',mission.id,'kingdom_bonus_percent',round((multiplier-1)*100),'desired_xp',desired_xp,'desired_gold',desired_gold,'applied_xp',applied_xp,'applied_gold',applied_gold,'event_day',mission.event_day,'reward_candies',applied_candies));
 return jsonb_build_object('status',case when p_completed then 'completed' else 'failed' end,'xp',applied_xp,'gold',applied_gold,'candies',applied_candies,
  'kingdomBonusPercent',round((multiplier-1)*100),'newRank',case when p_completed and mission.is_rank_trial then mission.promotion_rank else chosen.adventure_rank end);
end;
$function$;

commit;
