begin;

alter table public.v2_arena_sessions
  add column if not exists creature_id uuid references public.v2_creatures(id) on delete restrict,
  add column if not exists map_id text,
  add column if not exists battle_state jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists v2_arena_sessions_open_pve_character_idx
  on public.v2_arena_sessions(character_id, created_at desc)
  where mode = 'pve' and status = 'open';

create or replace function public.v2_start_arena_session(p_character_id uuid, p_mode text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  result uuid;
  selected_creature uuid;
  selected_map text;
  character_rank text;
  daily_limit integer := 5;
  daily_used integer := 0;
  local_today date := public.v2_rpg_today();
  map_ids text[] := array['ruinas-centrais','corredor-quebrado','clareira-partida','santuario-lunar','ruinas-crepusculo'];
begin
  if (select auth.uid()) is null or p_mode not in ('pve', 'pvp') then
    raise exception 'Sessão inválida.' using errcode = '42501';
  end if;

  select adventure_rank into character_rank
  from public.v2_characters
  where id = p_character_id and user_id = (select auth.uid());
  if character_rank is null then raise exception 'Personagem inválido.' using errcode = '42501'; end if;

  perform pg_advisory_xact_lock(hashtext(p_character_id::text), hashtext(local_today::text));

  select id into result
  from public.v2_arena_sessions
  where user_id = (select auth.uid()) and character_id = p_character_id and mode = p_mode
    and status = 'open'
    and (p_mode <> 'pve' or (created_at at time zone 'America/Sao_Paulo')::date = local_today)
    and created_at >= now() - interval '12 hours'
  order by created_at desc limit 1 for update;
  if result is not null then return result; end if;

  if p_mode = 'pve' then
    select coalesce((value #>> '{}')::integer, 5) into daily_limit
    from public.v2_game_settings where key = 'arena.pve_daily_limit' and status = 'published';
    daily_limit := greatest(1, coalesce(daily_limit, 5));
    select count(*)::integer into daily_used from public.v2_arena_sessions
    where character_id = p_character_id and mode = 'pve'
      and (created_at at time zone 'America/Sao_Paulo')::date = local_today;
    if daily_used >= daily_limit then
      raise exception 'Limite diário de % expedições PvE atingido para este personagem.', daily_limit using errcode = 'P0001';
    end if;
    select id into selected_creature from public.v2_creatures
      where active and rank = character_rank order by random() limit 1;
    if selected_creature is null then
      raise exception 'Não existe criatura ativa compatível com o Rank %.', character_rank using errcode = 'P0001';
    end if;
    selected_map := map_ids[1 + floor(random() * array_length(map_ids, 1))::integer];
  end if;

  update public.v2_arena_sessions set status = 'abandoned', completed_at = now(), updated_at = now()
  where user_id = (select auth.uid()) and character_id = p_character_id and mode = p_mode and status = 'open';

  insert into public.v2_arena_sessions(user_id, character_id, mode, creature_id, map_id, battle_state)
  values((select auth.uid()), p_character_id, p_mode, selected_creature, selected_map,
    case when p_mode = 'pve' then jsonb_build_object('version', 1, 'outcome', 'ongoing') else '{}'::jsonb end)
  returning id into result;
  return result;
end;
$$;

create or replace function public.v2_save_pve_battle_state(p_session_id uuid, p_state jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_state is null or jsonb_typeof(p_state) <> 'object' or pg_column_size(p_state) > 131072 then
    raise exception 'Estado de combate inválido.' using errcode = '22023';
  end if;
  update public.v2_arena_sessions set battle_state = p_state, updated_at = now()
  where id = p_session_id and user_id = (select auth.uid()) and mode = 'pve' and status = 'open'
    and created_at >= now() - interval '12 hours';
  if not found then raise exception 'Sessão PvE aberta não encontrada.' using errcode = 'P0002'; end if;
end;
$$;

create or replace function public.v2_finish_pve_defeat(p_session_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.v2_arena_sessions
  set status = 'defeat', completed_at = now(), updated_at = now(),
      battle_state = battle_state || jsonb_build_object('outcome', 'defeat')
  where id = p_session_id and user_id = (select auth.uid()) and mode = 'pve' and status = 'open';
  if not found then raise exception 'Sessão PvE aberta não encontrada.' using errcode = 'P0002'; end if;
end;
$$;

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
  if coalesce(session_row.battle_state->>'outcome','') <> 'victory' then
    raise exception 'A vitória tática ainda não foi confirmada.' using errcode='P0001';
  end if;
  select * into character_row from public.v2_characters where id=session_row.character_id and user_id=(select auth.uid()) for update;
  if character_row.id is null then raise exception 'Personagem da batalha não encontrado' using errcode='P0002'; end if;
  base_xp:=case character_row.adventure_rank when 'E' then 500 when 'D' then 1000 when 'C' then 2000 when 'B' then 4000 when 'A' then 8000 when 'S' then 15000 when 'EX' then 30000 else 500 end;
  base_wg:=case character_row.adventure_rank when 'E' then 100 when 'D' then 250 when 'C' then 600 when 'B' then 1500 when 'A' then 4000 when 'S' then 10000 when 'EX' then 25000 else 100 end;
  multiplier:=public.v2_kingdom_reward_multiplier(character_row.kingdom);
  reward_xp:=round(base_xp*multiplier); reward_wg:=round(base_wg*multiplier);
  update public.v2_characters set xp=xp+reward_xp,gold=gold+reward_wg,updated_at=now() where id=character_row.id;
  update public.v2_arena_sessions set status='victory',completed_at=now(),updated_at=now() where id=session_row.id;
  return jsonb_build_object('xp',reward_xp,'wg',reward_wg,'baseXp',base_xp,'baseWg',base_wg,
    'kingdomBonusPercent',round((multiplier-1)*100),'rank',character_row.adventure_rank,'character_id',character_row.id);
end; $$;

revoke all on function public.v2_start_arena_session(uuid,text), public.v2_save_pve_battle_state(uuid,jsonb),
  public.v2_finish_pve_defeat(uuid), public.v2_claim_arena_victory(uuid) from public, anon;
grant execute on function public.v2_start_arena_session(uuid,text), public.v2_save_pve_battle_state(uuid,jsonb),
  public.v2_finish_pve_defeat(uuid), public.v2_claim_arena_victory(uuid) to authenticated;

commit;
