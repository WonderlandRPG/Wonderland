begin;

insert into public.v2_game_settings(
  key, category, label, description, value, status, published_at
)
values(
  'arena.pve_daily_limit',
  'arena',
  'Entradas diárias no PvE',
  'Quantidade de expedições PvE que cada personagem pode iniciar por dia.',
  '5'::jsonb,
  'published',
  now()
)
on conflict (key) do nothing;

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
  local_today date := timezone('America/Sao_Paulo', now())::date;
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
    'resetsAt', ((local_today + 1)::timestamp at time zone 'America/Sao_Paulo')
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
  local_today date := timezone('America/Sao_Paulo', now())::date;
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

revoke execute on function public.v2_get_pve_daily_status(uuid) from public, anon;
revoke execute on function public.v2_start_arena_session(uuid, text) from public, anon;
grant execute on function public.v2_get_pve_daily_status(uuid) to authenticated;
grant execute on function public.v2_start_arena_session(uuid, text) to authenticated;

commit;
