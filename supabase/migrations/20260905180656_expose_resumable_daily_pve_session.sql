create or replace function public.v2_get_pve_daily_status(p_character_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare daily_limit integer := 5; daily_used integer := 0;
local_today date := timezone('America/Sao_Paulo', now())::date;
active_session uuid;
begin
if (select auth.uid()) is null or not exists(select 1 from public.v2_characters where id=p_character_id and user_id=(select auth.uid())) then
raise exception 'Personagem inválido.' using errcode='42501'; end if;
select coalesce((value #>> '{}')::integer,5) into daily_limit from public.v2_game_settings where key='arena.pve_daily_limit' and status='published';
daily_limit := greatest(1,coalesce(daily_limit,5));
select count(*)::integer into daily_used from public.v2_arena_sessions where character_id=p_character_id and mode='pve' and (created_at at time zone 'America/Sao_Paulo')::date=local_today;
select id into active_session from public.v2_arena_sessions where character_id=p_character_id and user_id=(select auth.uid()) and mode='pve' and status='open' and (created_at at time zone 'America/Sao_Paulo')::date=local_today and created_at>=now()-interval '12 hours' order by created_at desc limit 1;
return jsonb_build_object('limit',daily_limit,'used',daily_used,'remaining',greatest(0,daily_limit-daily_used),'activeSessionId',active_session,'resetsAt',((local_today+1)::timestamp at time zone 'America/Sao_Paulo'));
end; $$;
revoke execute on function public.v2_get_pve_daily_status(uuid) from public,anon;
grant execute on function public.v2_get_pve_daily_status(uuid) to authenticated;
