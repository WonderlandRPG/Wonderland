begin;

-- Emergency mitigation: the tactical result is still client supplied. Keep the
-- ordinary five-entry daily cap and record every payout until combat is replayed
-- authoritatively by the server.
create table if not exists public.v2_arena_reward_audit (
  session_id uuid primary key references public.v2_arena_sessions(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  character_id uuid not null references public.v2_characters(id) on delete restrict,
  xp bigint not null check (xp > 0),
  wg bigint not null check (wg > 0),
  battle_hash text not null,
  claimed_at timestamptz not null default now()
);
create index if not exists v2_arena_reward_audit_user_claimed_idx
  on public.v2_arena_reward_audit(user_id, claimed_at desc);
alter table public.v2_arena_reward_audit enable row level security;
revoke all on public.v2_arena_reward_audit from public, anon, authenticated;

create or replace function public.v2_claim_arena_victory(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  session_row public.v2_arena_sessions;
  character_row public.v2_characters;
  existing_reward public.v2_arena_reward_audit;
  battle jsonb;
  base_xp bigint;
  base_wg bigint;
  reward_xp bigint;
  reward_wg bigint;
  multiplier numeric;
begin
  if (select auth.uid()) is null then
    raise exception 'Autenticação necessária.' using errcode = '42501';
  end if;
  select * into session_row from public.v2_arena_sessions
    where id = p_session_id and user_id = (select auth.uid()) and mode = 'pve'
    for update;
  if session_row.id is null then
    raise exception 'Sessão PvE não encontrada.' using errcode = '42501';
  end if;
  if session_row.status = 'victory' then
    select * into existing_reward from public.v2_arena_reward_audit
      where session_id = session_row.id;
    if existing_reward.session_id is not null then
      return jsonb_build_object('xp', existing_reward.xp, 'wg', existing_reward.wg,
        'character_id', existing_reward.character_id, 'alreadyClaimed', true);
    end if;
  end if;
  if session_row.status <> 'open' or session_row.created_at < now() - interval '12 hours' then
    raise exception 'Esta batalha expirou ou já foi encerrada.' using errcode = 'P0001';
  end if;
  battle := session_row.battle_state;
  if battle is null or jsonb_typeof(battle) is distinct from 'object'
    or pg_column_size(battle) > 131072
    or battle->>'outcome' is distinct from 'victory'
    or battle->>'version' is distinct from '1'
    or battle->>'mapId' is distinct from session_row.map_id
    or battle->>'characterId' is distinct from session_row.character_id::text
    or battle->>'creatureId' is distinct from session_row.creature_id::text
    or jsonb_typeof(battle->'playerState') is distinct from 'object'
    or jsonb_typeof(battle->'enemyState') is distinct from 'object'
    or battle#>>'{playerState,id}' is distinct from session_row.character_id::text
    or battle#>>'{enemyState,id}' is distinct from session_row.creature_id::text
    or jsonb_typeof(battle#>'{playerState,hp}') is distinct from 'number'
    or jsonb_typeof(battle#>'{enemyState,hp}') is distinct from 'number'
    or jsonb_typeof(battle->'round') is distinct from 'number'
    or jsonb_typeof(battle->'log') is distinct from 'array'
    or jsonb_typeof(battle->'classTracker') is distinct from 'object'
    or jsonb_typeof(battle->'actionUsage') is distinct from 'object'
  then
    raise exception 'Resultado tático incompleto ou inconsistente.' using errcode = '22023';
  end if;
  if (battle#>>'{playerState,hp}')::numeric <= 0
    or (battle#>>'{enemyState,hp}')::numeric > 0
    or (battle->>'round')::numeric not between 1 and 100
    or jsonb_array_length(battle->'log') < 2
    or session_row.created_at > now() - interval '3 seconds'
  then
    raise exception 'Vitória tática ainda não comprovada.' using errcode = '22023';
  end if;

  select * into character_row from public.v2_characters
    where id = session_row.character_id and user_id = (select auth.uid()) for update;
  if character_row.id is null then
    raise exception 'Personagem da batalha não encontrado.' using errcode = 'P0002';
  end if;
  base_xp := case character_row.adventure_rank when 'E' then 500 when 'D' then 1000
    when 'C' then 2000 when 'B' then 4000 when 'A' then 8000 when 'S' then 15000
    when 'EX' then 30000 else 500 end;
  base_wg := case character_row.adventure_rank when 'E' then 100 when 'D' then 250
    when 'C' then 600 when 'B' then 1500 when 'A' then 4000 when 'S' then 10000
    when 'EX' then 25000 else 100 end;
  multiplier := public.v2_kingdom_reward_multiplier(character_row.kingdom);
  reward_xp := round(base_xp * multiplier);
  reward_wg := round(base_wg * multiplier);

  update public.v2_characters set xp = xp + reward_xp, gold = gold + reward_wg,
    updated_at = now() where id = character_row.id;
  update public.v2_arena_sessions set status = 'victory', completed_at = now(),
    updated_at = now() where id = session_row.id;
  insert into public.v2_arena_reward_audit
    (session_id, user_id, character_id, xp, wg, battle_hash)
    values (session_row.id, session_row.user_id, character_row.id,
      reward_xp, reward_wg, pg_catalog.md5(battle::text));
  return jsonb_build_object('xp', reward_xp, 'wg', reward_wg,
    'baseXp', base_xp, 'baseWg', base_wg,
    'kingdomBonusPercent', round((multiplier - 1) * 100),
    'rank', character_row.adventure_rank, 'character_id', character_row.id);
end;
$$;

revoke all on function public.v2_claim_arena_victory(uuid) from public, anon, authenticated;
grant execute on function public.v2_claim_arena_victory(uuid) to authenticated;

commit;
