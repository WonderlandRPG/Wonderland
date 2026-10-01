begin;

create table public.v2_pvp_reward_audit (
  match_id uuid not null references public.v2_pvp_matches(id),
  character_id uuid not null references public.v2_characters(id),
  user_id uuid not null,
  mode text not null check (mode in ('casual', 'ranked')),
  rank text not null,
  base_xp bigint not null check (base_xp >= 0),
  base_wg bigint not null check (base_wg >= 0),
  xp bigint not null check (xp >= 0),
  wg bigint not null check (wg >= 0),
  awarded_at timestamptz not null default now(),
  primary key (match_id, character_id)
);

create index v2_pvp_reward_audit_character_time_idx
  on public.v2_pvp_reward_audit (character_id, awarded_at desc);

alter table public.v2_pvp_reward_audit enable row level security;
revoke all on public.v2_pvp_reward_audit from public, anon, authenticated;

create or replace function public.v2_award_pvp_victory()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  winner_ids uuid[];
  winner_users uuid[];
  opponent_users uuid[];
  member_id uuid;
  member_index integer;
  character_row public.v2_characters%rowtype;
  mission_xp bigint;
  mission_wg bigint;
  multiplier numeric;
  reward_xp bigint;
  reward_wg bigint;
  prior_progression_source text := current_setting('wonderland.progression_source', true);
  prior_gold_source text := current_setting('wonderland.gold_source', true);
  bigint_max constant numeric := 9223372036854775807;
begin
  if new.status <> 'finished' or old.status = 'finished'
    or new.winner_character_id is null or new.abandoned_user_id is not null
    or new.mode not in ('casual', 'ranked')
    or new.state is null or new.state->>'status' <> 'finished'
    or new.state->>'winnerCharacterId' is distinct from new.winner_character_id::text
  then
    return new;
  end if;

  if new.winner_character_id = any(array_remove(array[
    new.player_one_character_id, new.player_one_secondary_character_id,
    new.player_one_tertiary_character_id], null)) then
    winner_ids := array[new.player_one_character_id, new.player_one_secondary_character_id,
      new.player_one_tertiary_character_id];
    winner_users := array[new.player_one_user_id, new.player_one_secondary_user_id,
      new.player_one_tertiary_user_id];
    opponent_users := array_remove(array[new.player_two_user_id,
      new.player_two_secondary_user_id, new.player_two_tertiary_user_id], null);
  elsif new.winner_character_id = any(array_remove(array[
    new.player_two_character_id, new.player_two_secondary_character_id,
    new.player_two_tertiary_character_id], null)) then
    winner_ids := array[new.player_two_character_id, new.player_two_secondary_character_id,
      new.player_two_tertiary_character_id];
    winner_users := array[new.player_two_user_id, new.player_two_secondary_user_id,
      new.player_two_tertiary_user_id];
    opponent_users := array_remove(array[new.player_one_user_id,
      new.player_one_secondary_user_id, new.player_one_tertiary_user_id], null);
  else
    return new;
  end if;

  for member_index in 1..array_length(winner_ids, 1) loop
    member_id := winner_ids[member_index];
    if member_id is null then continue; end if;
    select * into character_row from public.v2_characters
      where id = member_id for update;
    if character_row.id is null
      or character_row.user_id is distinct from winner_users[member_index]
      or character_row.user_id = any(opponent_users) then
      raise exception 'Participantes PvP inválidos para recompensa' using errcode = '22023';
    end if;

    -- As missões comuns publicadas têm um valor único por rank.
    select min(m.reward_xp), min(m.reward_gold)
      into mission_xp, mission_wg
      from public.v2_missions m
      where m.rank = character_row.adventure_rank
        and m.active and not m.is_rank_trial;
    if mission_xp is null or mission_wg is null then
      raise exception 'Recompensa de missão indisponível para rank %',
        character_row.adventure_rank using errcode = '22023';
    end if;

    multiplier := public.v2_kingdom_reward_multiplier(character_row.kingdom);
    reward_xp := least(round(mission_xp::numeric * multiplier),
      greatest(0, bigint_max - character_row.xp::numeric))::bigint;
    reward_wg := least(round(mission_wg::numeric * multiplier),
      greatest(0, bigint_max - character_row.gold::numeric))::bigint;

    insert into public.v2_pvp_reward_audit
      (match_id, character_id, user_id, mode, rank, base_xp, base_wg, xp, wg)
      values (new.id, character_row.id, character_row.user_id, new.mode,
        character_row.adventure_rank, mission_xp, mission_wg, reward_xp, reward_wg)
      on conflict (match_id, character_id) do nothing;
    if not found then continue; end if;

    perform pg_catalog.set_config('wonderland.progression_source', 'arena', true);
    perform pg_catalog.set_config('wonderland.gold_source', 'arena', true);
    update public.v2_characters set xp = xp + reward_xp,
      gold = gold + reward_wg where id = character_row.id;
    perform pg_catalog.set_config('wonderland.progression_source',
      coalesce(prior_progression_source, ''), true);
    perform pg_catalog.set_config('wonderland.gold_source',
      coalesce(prior_gold_source, ''), true);
  end loop;

  return new;
end;
$$;

revoke all on function public.v2_award_pvp_victory() from public, anon, authenticated;
create trigger v2_award_pvp_victory_trigger
  after update of status on public.v2_pvp_matches
  for each row execute function public.v2_award_pvp_victory();

commit;
