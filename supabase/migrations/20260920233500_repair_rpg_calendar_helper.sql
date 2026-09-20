begin;

-- Later PvE migrations call these helpers. Some production databases skipped
-- the original calendar migration, so keep this repair additive and idempotent.
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

commit;
