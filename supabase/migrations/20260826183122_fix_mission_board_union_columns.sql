begin;

-- The weekly selection carries the internal family_position window column.
-- Project only the mission fields before combining it with the rank trial so
-- both branches of the UNION ALL expose the same shape.
create or replace function public.v2_get_mission_board(p_character_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  chosen public.v2_characters;
  active_assignment jsonb;
  completed_count integer;
  needed integer;
  locked_until timestamptz;
  mission_list jsonb;
begin
  select * into chosen from public.v2_characters
  where id=p_character_id and user_id=(select auth.uid());
  if chosen.id is null then raise exception 'Personagem não encontrado' using errcode='P0002'; end if;

  select jsonb_build_object(
    'id',a.id,'missionId',m.id,'name',m.name,'rank',m.rank,'kingdom',m.kingdom,
    'objective',m.objective,'acceptedAt',a.accepted_at,'isRankTrial',m.is_rank_trial
  ) into active_assignment
  from public.v2_mission_assignments a join public.v2_missions m on m.id=a.mission_id
  where a.character_id=chosen.id and a.status='in_progress' limit 1;

  select count(*)::integer into completed_count
  from public.v2_mission_assignments a join public.v2_missions m on m.id=a.mission_id
  where a.character_id=chosen.id and a.status='completed'
    and not m.is_rank_trial and m.rank=chosen.adventure_rank;

  select required_completions into needed from public.v2_rank_mission_requirements
  where rank=chosen.adventure_rank;

  select max(retry_after) into locked_until from public.v2_mission_assignments
  where character_id=chosen.id and status='failed' and retry_after>now();

  with eligible as (
    select m.*,
      row_number() over (
        partition by coalesce((regexp_match(m.slug, '-[edcba]-([0-9]{2})-'))[1], m.slug)
        order by md5(m.id::text || chosen.id::text || date_trunc('week', now())::text)
      ) as family_position
    from public.v2_missions m
    where m.active and m.kingdom=chosen.kingdom and m.rank=chosen.adventure_rank
      and not m.is_rank_trial
      and (m.available_after is null or m.available_after<=now())
      and chosen.level>=m.min_level
      and not exists (
        select 1 from public.v2_mission_assignments recent
        where recent.character_id=chosen.id and recent.mission_id=m.id
          and recent.status='completed' and recent.resolved_at > now() - interval '7 days'
      )
  ), weekly_selection as (
    select * from eligible where family_position <= 2
    order by md5(id::text || chosen.id::text || date_trunc('week', now())::text)
    limit 12
  ), visible as (
    select
      id,slug,name,description,objective,kingdom,rank,min_level,reward_xp,reward_gold,
      is_rank_trial,promotion_rank
    from weekly_selection
    union all
    select
      m.id,m.slug,m.name,m.description,m.objective,m.kingdom,m.rank,m.min_level,
      m.reward_xp,m.reward_gold,m.is_rank_trial,m.promotion_rank
    from public.v2_missions m
    where m.active and m.kingdom=chosen.kingdom and m.rank=chosen.adventure_rank
      and m.is_rank_trial and completed_count>=coalesce(needed,2147483647)
      and chosen.level>=m.min_level
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',m.id,'slug',m.slug,'name',m.name,'description',m.description,'objective',m.objective,
    'rank',m.rank,'kingdom',m.kingdom,'minLevel',m.min_level,'rewardXp',m.reward_xp,
    'rewardGold',m.reward_gold,'isRankTrial',m.is_rank_trial,'promotionRank',m.promotion_rank
  ) order by m.is_rank_trial desc,m.name),'[]'::jsonb) into mission_list
  from visible m;

  return jsonb_build_object(
    'character',jsonb_build_object('id',chosen.id,'name',chosen.name,'rank',chosen.adventure_rank,
      'level',chosen.level,'kingdom',chosen.kingdom,'imageUrl',chosen.image_url),
    'missions',mission_list,'activeAssignment',active_assignment,
    'completedForRank',completed_count,'requiredForTrial',needed,'lockedUntil',locked_until,
    'canManage',public.v2_is_mission_manager()
  );
end;
$function$;

comment on function public.v2_get_mission_board(uuid) is
  'Returns a weekly rotating, family-diverse selection of up to 12 contracts plus an eligible rank trial.';

commit;
