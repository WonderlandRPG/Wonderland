begin;

-- Daily systems follow the RPG calendar, not a rolling 24-hour cooldown and
-- not the database server's timezone.  Both functions are centralized so new
-- daily features use exactly the same boundary.
create or replace function public.v2_rpg_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (statement_timestamp() at time zone 'America/Sao_Paulo')::date;
$$;

create or replace function public.v2_next_daily_reset_at()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select ((public.v2_rpg_today() + 1)::timestamp at time zone 'America/Sao_Paulo');
$$;

revoke all on function public.v2_rpg_today() from public, anon, authenticated;
revoke all on function public.v2_next_daily_reset_at() from public, anon, authenticated;

create or replace function public.v2_get_pve_daily_status(p_character_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  daily_limit integer := 5;
  daily_used integer := 0;
  local_today date := public.v2_rpg_today();
begin
  if (select auth.uid()) is null or not exists(
    select 1
    from public.v2_characters
    where id = p_character_id and user_id = (select auth.uid())
  ) then
    raise exception 'Personagem inválido.' using errcode = '42501';
  end if;

  select coalesce((value #>> '{}')::integer, 5)
  into daily_limit
  from public.v2_game_settings
  where key = 'arena.pve_daily_limit' and status = 'published';
  daily_limit := greatest(1, coalesce(daily_limit, 5));

  select count(*)::integer
  into daily_used
  from public.v2_arena_sessions
  where character_id = p_character_id
    and mode = 'pve'
    and (created_at at time zone 'America/Sao_Paulo')::date = local_today;

  return jsonb_build_object(
    'limit', daily_limit,
    'used', daily_used,
    'remaining', greatest(0, daily_limit - daily_used),
    'resetsAt', public.v2_next_daily_reset_at()
  );
end;
$$;

create or replace function public.v2_start_arena_session(p_character_id uuid, p_mode text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  result uuid;
  daily_limit integer := 5;
  daily_used integer := 0;
  local_today date := public.v2_rpg_today();
begin
  if (select auth.uid()) is null or p_mode not in ('pve', 'pvp') or not exists(
    select 1
    from public.v2_characters
    where id = p_character_id and user_id = (select auth.uid())
  ) then
    raise exception 'Sessão inválida.' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_character_id::text), hashtext(local_today::text));

  select id
  into result
  from public.v2_arena_sessions
  where user_id = (select auth.uid())
    and character_id = p_character_id
    and mode = p_mode
    and status = 'open'
    and (
      p_mode <> 'pve'
      or (created_at at time zone 'America/Sao_Paulo')::date = local_today
    )
    and created_at >= now() - interval '12 hours'
  order by created_at desc
  limit 1
  for update;

  if result is not null then
    return result;
  end if;

  if p_mode = 'pve' then
    select coalesce((value #>> '{}')::integer, 5)
    into daily_limit
    from public.v2_game_settings
    where key = 'arena.pve_daily_limit' and status = 'published';
    daily_limit := greatest(1, coalesce(daily_limit, 5));

    select count(*)::integer
    into daily_used
    from public.v2_arena_sessions
    where character_id = p_character_id
      and mode = 'pve'
      and (created_at at time zone 'America/Sao_Paulo')::date = local_today;

    if daily_used >= daily_limit then
      raise exception 'Limite diário de % expedições PvE atingido para este personagem.', daily_limit
        using errcode = 'P0001';
    end if;
  end if;

  update public.v2_arena_sessions
  set status = 'abandoned', completed_at = now()
  where user_id = (select auth.uid())
    and character_id = p_character_id
    and mode = p_mode
    and status = 'open';

  insert into public.v2_arena_sessions(user_id, character_id, mode)
  values((select auth.uid()), p_character_id, p_mode)
  returning id into result;

  return result;
end;
$$;

-- The implementation was made private by
-- 20260826124000_authorize_presence_and_event_progression.sql.  Keep its
-- authorization wrapper and change only the calendar boundary it consumes.
create or replace function public.v2_claim_daily_reward_impl()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := (select auth.uid());
  chosen uuid;
  character_row public.v2_characters;
  reward_row public.v2_presence_rewards;
  config_row public.v2_presence_pass_config;
  existing_claim public.v2_presence_claims;
  local_today date := public.v2_rpg_today();
  claimed_count integer;
  next_day integer;
  item_slot text;
begin
  if caller_id is null then
    raise exception 'Autenticação necessária' using errcode = '42501';
  end if;

  select * into config_row from public.v2_presence_pass_config where id = true;
  if config_row.id is null or local_today < config_row.starts_on or local_today > config_row.ends_on then
    raise exception 'A Presença não está disponível nesta data';
  end if;

  select character_id into chosen
  from public.v2_active_characters
  where user_id = caller_id;
  if chosen is null then raise exception 'Selecione um personagem antes de marcar presença'; end if;

  select * into character_row
  from public.v2_characters
  where id = chosen and user_id = caller_id
  for update;
  if character_row.id is null then raise exception 'Personagem inválido' using errcode = '42501'; end if;

  select * into existing_claim
  from public.v2_presence_claims
  where character_id = chosen
    and campaign_start = config_row.starts_on
    and claim_date = local_today;
  if existing_claim.character_id is not null then
    return jsonb_build_object(
      'character_id', chosen,
      'day', existing_claim.day_number,
      'already_claimed', true
    );
  end if;

  select count(*) into claimed_count
  from public.v2_presence_claims
  where character_id = chosen and campaign_start = config_row.starts_on;
  if claimed_count >= config_row.day_count then
    raise exception 'Todas as recompensas desta Presença já foram resgatadas';
  end if;

  next_day := claimed_count + 1;
  select * into reward_row
  from public.v2_presence_rewards
  where active and day_number = next_day;
  if reward_row.day_number is null then raise exception 'A recompensa deste dia ainda não foi configurada'; end if;

  if reward_row.reward_type = 'wg' then
    update public.v2_characters set gold = gold + reward_row.amount where id = chosen;
  elsif reward_row.reward_type = 'xp' then
    update public.v2_characters set xp = xp + reward_row.amount where id = chosen;
  elsif reward_row.reward_type in ('item','title') then
    select slot into item_slot from public.v2_shop_items where id = reward_row.item_id;
    if item_slot is null then raise exception 'A recompensa configurada não existe'; end if;
    if reward_row.reward_type = 'title' and item_slot <> 'title' then raise exception 'A recompensa configurada não é um Título'; end if;
    if reward_row.reward_type = 'item' and item_slot = 'title' then raise exception 'Use o tipo Título para esta recompensa'; end if;
    insert into public.v2_character_inventory(character_id, item_id, quantity)
    values (chosen, reward_row.item_id, reward_row.amount)
    on conflict(character_id, item_id) do update
    set quantity = public.v2_character_inventory.quantity + excluded.quantity,
        updated_at = now();
  else
    raise exception 'Tipo de recompensa inválido';
  end if;

  insert into public.v2_presence_claims(character_id, campaign_start, claim_date, day_number)
  values (chosen, config_row.starts_on, local_today, next_day);
  update public.v2_characters
  set daily_streak = next_day, last_daily_claim = local_today, updated_at = now()
  where id = chosen;

  return jsonb_build_object(
    'character_id', chosen,
    'day', next_day,
    'reward_type', reward_row.reward_type,
    'amount', reward_row.amount,
    'item_id', reward_row.item_id,
    'already_claimed', false
  );
end;
$$;

revoke all on function public.v2_claim_daily_reward_impl() from public, anon, authenticated;
revoke all on function public.v2_get_pve_daily_status(uuid) from public, anon;
revoke all on function public.v2_start_arena_session(uuid, text) from public, anon;
grant execute on function public.v2_get_pve_daily_status(uuid) to authenticated;
grant execute on function public.v2_start_arena_session(uuid, text) to authenticated;

comment on function public.v2_rpg_today() is
  'Official Wonderland calendar day in America/Sao_Paulo. Daily systems reset at 00:00 local time.';
comment on function public.v2_next_daily_reset_at() is
  'Next Wonderland daily reset instant: midnight in America/Sao_Paulo.';

commit;
