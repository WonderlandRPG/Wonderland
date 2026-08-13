begin;
alter table public.v2_dungeon_runs add column if not exists state jsonb;
alter table public.v2_dungeon_runs add column if not exists version integer not null default 0;
create or replace function public.v2_get_dungeon_run(p_run_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare run public.v2_dungeon_runs;
begin
  select * into run from public.v2_dungeon_runs where id=p_run_id;
  if run.id is null or not public.v2_is_admin() then raise exception 'Expedição indisponível' using errcode='42501'; end if;
  return jsonb_build_object('runId',run.id,'version',run.version,'state',run.state,'status',run.status,'forced',run.forced_start);
end $$;
create or replace function public.v2_initialize_dungeon_run(p_run_id uuid,p_state jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare run public.v2_dungeon_runs;
begin
  select * into run from public.v2_dungeon_runs where id=p_run_id for update;
  if run.id is null or not public.v2_is_admin() then raise exception 'Expedição indisponível' using errcode='42501'; end if;
  if run.state is null then update public.v2_dungeon_runs set state=p_state,version=1 where id=p_run_id returning * into run; end if;
  return jsonb_build_object('runId',run.id,'version',run.version,'state',run.state,'status',run.status,'forced',run.forced_start);
end $$;
create or replace function public.v2_update_dungeon_run(p_run_id uuid,p_expected_version integer,p_state jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare run public.v2_dungeon_runs; next_status text;
begin
  select * into run from public.v2_dungeon_runs where id=p_run_id for update;
  if run.id is null or not public.v2_is_admin() then raise exception 'Expedição indisponível' using errcode='42501'; end if;
  if run.version=p_expected_version and run.status='active' then
    next_status:=case p_state->>'status' when 'victory' then 'finished' when 'defeat' then 'finished' else 'active' end;
    update public.v2_dungeon_runs set state=p_state,version=version+1,status=next_status,finished_at=case when next_status='finished' then now() else null end where id=p_run_id returning * into run;
  end if;
  return jsonb_build_object('runId',run.id,'version',run.version,'state',run.state,'status',run.status,'forced',run.forced_start);
end $$;
revoke all on function public.v2_get_dungeon_run(uuid),public.v2_initialize_dungeon_run(uuid,jsonb),public.v2_update_dungeon_run(uuid,integer,jsonb) from public,anon;
grant execute on function public.v2_get_dungeon_run(uuid),public.v2_initialize_dungeon_run(uuid,jsonb),public.v2_update_dungeon_run(uuid,integer,jsonb) to authenticated;
commit;
