create or replace function public.v2_admin_manage_ranked_season(p_name text,p_starts_at timestamptz,p_ends_at timestamptz,p_activate boolean default false)
returns uuid language plpgsql security definer set search_path='' as $$
declare season_id uuid;
begin
  if not public.v2_is_admin() then raise exception 'Acesso administrativo necessário' using errcode='42501'; end if;
  if length(trim(p_name))<3 or p_ends_at<=p_starts_at then raise exception 'Dados da temporada inválidos' using errcode='22023'; end if;
  if p_activate then update public.v2_ranked_seasons set status='finished' where status='active'; end if;
  insert into public.v2_ranked_seasons(name,starts_at,ends_at,status) values(trim(p_name),p_starts_at,p_ends_at,case when p_activate then 'active' else 'scheduled' end) returning id into season_id;
  insert into public.v2_admin_history(actor_id,action,target_type,target_id,details) values(auth.uid(),'ranked.season.created','ranked_season',season_id::text,jsonb_build_object('name',trim(p_name),'active',p_activate,'starts_at',p_starts_at,'ends_at',p_ends_at));
  return season_id;
end; $$;

create or replace function public.v2_admin_set_ranked_season_status(p_season_id uuid,p_status text)
returns boolean language plpgsql security definer set search_path='' as $$
begin
  if not public.v2_is_admin() then raise exception 'Acesso administrativo necessário' using errcode='42501'; end if;
  if p_status not in ('scheduled','active','finished') then raise exception 'Estado inválido' using errcode='22023'; end if;
  if p_status='active' then update public.v2_ranked_seasons set status='finished' where status='active' and id<>p_season_id; end if;
  update public.v2_ranked_seasons set status=p_status where id=p_season_id;
  if not found then raise exception 'Temporada não encontrada' using errcode='P0002'; end if;
  insert into public.v2_admin_history(actor_id,action,target_type,target_id,details) values(auth.uid(),'ranked.season.status','ranked_season',p_season_id::text,jsonb_build_object('status',p_status));
  return true;
end; $$;

create policy "ranked seasons admin read" on public.v2_ranked_seasons for select to authenticated using(public.v2_is_admin());
grant select on public.v2_ranked_seasons to authenticated;
revoke all on function public.v2_admin_manage_ranked_season(text,timestamptz,timestamptz,boolean),public.v2_admin_set_ranked_season_status(uuid,text) from public,anon;
grant execute on function public.v2_admin_manage_ranked_season(text,timestamptz,timestamptz,boolean),public.v2_admin_set_ranked_season_status(uuid,text) to authenticated;
