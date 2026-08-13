-- Fila cooperativa ao vivo e início administrativo das Dungeons.
begin;

create table if not exists public.v2_dungeon_queue (
  id uuid primary key default gen_random_uuid(),
  dungeon_key text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.v2_characters(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (dungeon_key,user_id),
  unique (dungeon_key,character_id)
);

create table if not exists public.v2_dungeon_runs (
  id uuid primary key default gen_random_uuid(),
  dungeon_key text not null,
  party_character_ids uuid[] not null,
  started_by uuid not null references auth.users(id) on delete restrict,
  forced_start boolean not null default false,
  status text not null default 'active' check (status in ('active','finished','cancelled')),
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.v2_dungeon_queue enable row level security;
alter table public.v2_dungeon_runs enable row level security;
drop policy if exists "dungeon admins read queue" on public.v2_dungeon_queue;
drop policy if exists "dungeon admins read runs" on public.v2_dungeon_runs;
create policy "dungeon admins read queue" on public.v2_dungeon_queue for select to authenticated
using ((select public.v2_is_admin()));
create policy "dungeon admins read runs" on public.v2_dungeon_runs for select to authenticated
using ((select public.v2_is_admin()));

revoke all on public.v2_dungeon_queue,public.v2_dungeon_runs from public,anon,authenticated;
grant select on public.v2_dungeon_queue,public.v2_dungeon_runs to authenticated;

create or replace function public.v2_join_dungeon_queue(p_dungeon_key text,p_character_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if (select auth.uid()) is null or not public.v2_is_admin() then
    raise exception 'Acesso administrativo necessário' using errcode='42501';
  end if;
  if p_dungeon_key <> 'ruinas-de-verdantia' then
    raise exception 'Dungeon indisponível' using errcode='22023';
  end if;
  if not exists (
    select 1 from public.v2_characters c
    join public.v2_active_characters a on a.character_id=c.id and a.user_id=c.user_id
    where c.id=p_character_id and c.user_id=(select auth.uid())
  ) then
    raise exception 'Selecione seu personagem ativo antes de entrar' using errcode='42501';
  end if;
  insert into public.v2_dungeon_queue(dungeon_key,user_id,character_id,joined_at)
  values(p_dungeon_key,(select auth.uid()),p_character_id,now())
  on conflict(dungeon_key,user_id) do update
    set character_id=excluded.character_id,joined_at=excluded.joined_at;
end $$;

create or replace function public.v2_leave_dungeon_queue(p_dungeon_key text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if (select auth.uid()) is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  delete from public.v2_dungeon_queue
  where dungeon_key=p_dungeon_key and user_id=(select auth.uid());
end $$;

create or replace function public.v2_get_dungeon_queue(p_dungeon_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not public.v2_is_admin() then raise exception 'Acesso negado' using errcode='42501'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',q.id,'userId',q.user_id,'characterId',q.character_id,'joinedAt',q.joined_at,
      'name',c.name,'level',c.level,'rank',c.adventure_rank,'imageUrl',c.image_url
    ) order by q.joined_at)
    from public.v2_dungeon_queue q join public.v2_characters c on c.id=q.character_id
    where q.dungeon_key=p_dungeon_key
  ),'[]'::jsonb);
end $$;

create or replace function public.v2_start_dungeon(p_dungeon_key text,p_force boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare party uuid[]; party_size integer; created public.v2_dungeon_runs;
begin
  if not public.v2_is_admin() then raise exception 'Acesso administrativo necessário' using errcode='42501'; end if;
  select array_agg(character_id order by joined_at),count(*)::integer into party,party_size
  from public.v2_dungeon_queue where dungeon_key=p_dungeon_key;
  if party_size=0 then raise exception 'A fila está vazia' using errcode='22023'; end if;
  if not p_force and party_size<4 then raise exception 'São necessários quatro jogadores' using errcode='22023'; end if;
  insert into public.v2_dungeon_runs(dungeon_key,party_character_ids,started_by,forced_start)
  values(p_dungeon_key,party,(select auth.uid()),p_force) returning * into created;
  delete from public.v2_dungeon_queue where dungeon_key=p_dungeon_key;
  return jsonb_build_object('runId',created.id,'partySize',party_size,'forced',p_force,'startedAt',created.started_at);
end $$;

revoke all on function public.v2_join_dungeon_queue(text,uuid),public.v2_leave_dungeon_queue(text),
  public.v2_get_dungeon_queue(text),public.v2_start_dungeon(text,boolean) from public,anon;
grant execute on function public.v2_join_dungeon_queue(text,uuid),public.v2_leave_dungeon_queue(text),
  public.v2_get_dungeon_queue(text),public.v2_start_dungeon(text,boolean) to authenticated;

do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='v2_dungeon_queue') then
    alter publication supabase_realtime add table public.v2_dungeon_queue;
  end if;
end $$;

commit;
