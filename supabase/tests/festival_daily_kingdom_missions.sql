-- Integration checks use existing accounts only inside a rolled-back transaction.
-- No XP, candies, assignments, roles or character changes survive this script.
begin;
do $test$
declare
  manager_user uuid;
  players uuid[];
  owners uuid[];
  first_mission uuid;
  future_mission uuid;
  assignment_id uuid;
  second_assignment uuid;
  board jsonb;
  result jsonb;
  before_xp bigint;
  before_gold bigint;
  denied boolean;
begin
  select user_id into manager_user from public.v2_user_roles where role in ('admin','founder') limit 1;
  select array_agg(id),array_agg(user_id) into players,owners from (
    select distinct on(c.user_id) c.id,c.user_id from public.v2_characters c
    where c.user_id<>manager_user and c.rework_attributes is not null
      and not exists(select 1 from public.v2_user_roles r where r.user_id=c.user_id and r.role in ('admin','founder','guild_leader'))
      and not exists(select 1 from public.v2_mission_assignments a where a.user_id=c.user_id and (a.status='in_progress' or a.event_key is not null))
      and not exists(select 1 from public.v2_arena_sessions s where s.character_id=c.id and s.status='open' and s.created_at>=now()-interval '2 hours')
      and not exists(select 1 from public.v2_pvp_queue q join public.v2_pvp_matches m on m.id=q.match_id where q.character_id=c.id and m.status='active' and m.updated_at>=now()-interval '2 hours')
      and not exists(select 1 from public.v2_dungeon_runs d where c.id=any(d.party_character_ids) and d.status='active' and d.started_at>=now()-interval '12 hours')
      and exists(select 1 from public.v2_content r where r.id=c.race_id and r.status='published')
      and exists(select 1 from public.v2_content r where r.id=c.class_id and r.status='published')
    order by c.user_id,c.id limit 2
  ) candidates;
  assert manager_user is not null and cardinality(players)=2,'Two idle player accounts and a manager are needed';
  perform set_config('request.jwt.claim.sub',manager_user::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',manager_user,'role','authenticated')::text,true);
  update public.v2_characters set kingdom='aokigahara',adventure_rank='S' where id=players[1];
  update public.v2_characters set kingdom='aokigahara',adventure_rank='E' where id=players[2];
  select xp,gold into before_xp,before_gold from public.v2_characters where id=players[1];
  insert into public.v2_active_characters(user_id,character_id) values(owners[1],players[1]),(owners[2],players[2])
    on conflict(user_id) do update set character_id=excluded.character_id;
  select id into first_mission from public.v2_missions where event_key='noites-apavorantes-2026' and kingdom='aokigahara' and event_day=date '2026-10-08';
  select id into future_mission from public.v2_missions where event_key='noites-apavorantes-2026' and kingdom='aokigahara' and event_day=date '2026-10-25';

  perform set_config('request.jwt.claim.sub',owners[1]::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owners[1],'role','authenticated')::text,true);
  board:=public.v2_get_mission_board(players[1]);
  assert board#>>'{festival,mission,eventDay}'='2026-10-08','The first day must be offered first';
  assert (board#>>'{festival,mission,rewardXp}')::bigint=30000,'S reward must be doubled';
  assert not exists(select 1 from jsonb_array_elements(board->'missions') m where m->>'slug' like 'festival-%'),'Festival must not mix into weekly rank selection';
  denied:=false;
  begin perform public.v2_get_mission_board(players[2]); exception when sqlstate 'P0002' then denied:=true; end;
  assert denied,'Another player character must be inaccessible';
  if (now() at time zone 'America/Sao_Paulo')::date<date '2026-10-25' then
    denied:=false;
    begin perform public.v2_accept_mission(future_mission,players[1]); exception when others then denied:=true; end;
    assert denied,'A future mission must be rejected';
  end if;
  result:=public.v2_accept_mission(first_mission,players[1]);
  assignment_id:=(result->>'assignmentId')::uuid;
  denied:=false;
  begin perform public.v2_resolve_mission(assignment_id,true); exception when sqlstate '42501' then denied:=true; end;
  assert denied,'A player cannot grant their own rewards';

  perform set_config('request.jwt.claim.sub',manager_user::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',manager_user,'role','authenticated')::text,true);
  -- Emulate a Guild leader without administrator privileges; reverted by rollback.
  update public.v2_user_roles set role='guild_leader' where user_id=manager_user;
  assert not public.v2_is_admin() and public.v2_is_mission_manager(),'Guild-only permission is required for this test';
  result:=public.v2_resolve_mission(assignment_id,true);
  assert (result->>'xp')::bigint=30000 and (result->>'gold')::bigint=0 and (result->>'candies')::integer=10,'Festival reward must be exactly rank XP x2 plus 10 candies';
  assert (select xp=before_xp+30000 and gold=before_gold from public.v2_characters where id=players[1]),'Character balance mismatch';
  assert (select candies=10 from public.v2_festival_wallets where character_id=players[1] and event_key='noites-apavorantes-2026'),'Candies must be persisted';
  assert (select available_after is null from public.v2_missions where id=first_mission),'A completion must not lock the shared contract';
  denied:=false;
  begin perform public.v2_resolve_mission(assignment_id,true); exception when others then denied:=true; end;
  assert denied,'A second reward grant must fail';

  perform set_config('request.jwt.claim.sub',owners[1]::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owners[1],'role','authenticated')::text,true);
  board:=public.v2_get_mission_board(players[1]);
  assert (board#>>'{festival,completedCount}')::integer=1,'Festival progress must advance';
  assert (board#>>'{festival,candyBalance}')::integer=10,'Wallet must be visible on the board';
  denied:=false;
  begin perform public.v2_accept_mission(first_mission,players[1]); exception when others then denied:=true; end;
  assert denied,'A completed event day cannot be repeated';
  if (now() at time zone 'America/Sao_Paulo')::date=date '2026-10-08' then
    assert board#>>'{festival,nextReleaseDate}'='2026-10-09' and board#>'{festival,mission}'='null'::jsonb,'Tomorrow must remain hidden';
  end if;

  perform set_config('request.jwt.claim.sub',owners[2]::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owners[2],'role','authenticated')::text,true);
  result:=public.v2_accept_mission(first_mission,players[2]);
  second_assignment:=(result->>'assignmentId')::uuid;
  assert second_assignment is not null,'Other players must still be able to accept the same contract';
  perform set_config('request.jwt.claim.sub',manager_user::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',manager_user,'role','authenticated')::text,true);
  result:=public.v2_resolve_mission(second_assignment,false);
  assert (result->>'xp')::integer=0 and (result->>'candies')::integer=0,'Failure must not grant rewards';
  assert not exists(select 1 from public.v2_festival_wallets where character_id=players[2]),'Failure must not create candy balance';
end;
$test$;
rollback;
select 'festival integration checks passed; all fixture changes rolled back' as result;
