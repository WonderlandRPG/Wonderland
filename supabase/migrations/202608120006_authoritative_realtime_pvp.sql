-- PvP autoritativo: ambos os jogadores leem e alteram uma única sala versionada.
begin;

create table if not exists public.v2_pvp_matches (
  id uuid primary key,
  player_one_user_id uuid not null references auth.users(id) on delete cascade,
  player_one_character_id uuid not null references public.v2_characters(id) on delete cascade,
  player_two_user_id uuid not null references auth.users(id) on delete cascade,
  player_two_character_id uuid not null references public.v2_characters(id) on delete cascade,
  rank text not null check (rank in ('E','D','C','B','A','S','EX')),
  state jsonb,
  version integer not null default 0 check (version >= 0),
  status text not null default 'active' check (status in ('active','finished','abandoned')),
  winner_character_id uuid references public.v2_characters(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint v2_pvp_match_distinct_users check (player_one_user_id <> player_two_user_id),
  constraint v2_pvp_match_distinct_characters check (player_one_character_id <> player_two_character_id)
);

create index if not exists v2_pvp_matches_player_one_idx on public.v2_pvp_matches(player_one_user_id,updated_at desc);
create index if not exists v2_pvp_matches_player_two_idx on public.v2_pvp_matches(player_two_user_id,updated_at desc);
alter table public.v2_pvp_matches enable row level security;
drop policy if exists "pvp participants read match" on public.v2_pvp_matches;
create policy "pvp participants read match" on public.v2_pvp_matches for select to authenticated
using ((select auth.uid()) in (player_one_user_id,player_two_user_id));
revoke all on public.v2_pvp_matches from public,anon,authenticated;
grant select on public.v2_pvp_matches to authenticated;

create or replace function public.v2_create_pvp_match_room()
returns trigger language plpgsql security definer set search_path='' as $$
declare other_entry public.v2_pvp_queue;
begin
  if new.status <> 'matched' or new.match_id is null then return new; end if;
  select * into other_entry from public.v2_pvp_queue
  where match_id=new.match_id and status='matched' and id<>new.id order by matched_at limit 1;
  if other_entry.id is not null then
    insert into public.v2_pvp_matches(id,player_one_user_id,player_one_character_id,player_two_user_id,player_two_character_id,rank)
    values(new.match_id,other_entry.user_id,other_entry.character_id,new.user_id,new.character_id,new.rank)
    on conflict (id) do nothing;
  end if;
  return new;
end; $$;

drop trigger if exists v2_pvp_queue_create_match_room on public.v2_pvp_queue;
create trigger v2_pvp_queue_create_match_room after insert or update of status,match_id on public.v2_pvp_queue
for each row execute function public.v2_create_pvp_match_room();

insert into public.v2_pvp_matches(id,player_one_user_id,player_one_character_id,player_two_user_id,player_two_character_id,rank)
select a.match_id,a.user_id,a.character_id,b.user_id,b.character_id,a.rank
from public.v2_pvp_queue a join public.v2_pvp_queue b on b.match_id=a.match_id and b.id>a.id
where a.status='matched' and b.status='matched' and a.match_id is not null
on conflict (id) do nothing;

create or replace function public.v2_pvp_room_payload(p_match public.v2_pvp_matches)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'matchId',p_match.id,'version',p_match.version,
    'ownCharacterId',case when p_match.player_one_user_id=(select auth.uid()) then p_match.player_one_character_id else p_match.player_two_character_id end,
    'opponentCharacterId',case when p_match.player_one_user_id=(select auth.uid()) then p_match.player_two_character_id else p_match.player_one_character_id end,
    'state',p_match.state,'status',p_match.status
  )
$$;

create or replace function public.v2_initialize_pvp_match(p_match_id uuid,p_state jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
declare room public.v2_pvp_matches;
begin
  select * into room from public.v2_pvp_matches where id=p_match_id for update;
  if room.id is null or (select auth.uid()) not in (room.player_one_user_id,room.player_two_user_id) then raise exception 'Partida PvP não encontrada' using errcode='42501'; end if;
  if room.state is null then
    if p_state is null or p_state->>'status'<>'active' or not (p_state ? 'fighters') or not (p_state ? 'positions') then raise exception 'Estado inicial inválido' using errcode='22023'; end if;
    update public.v2_pvp_matches set state=p_state,version=1,updated_at=now() where id=room.id;
  end if;
  return true;
end; $$;

create or replace function public.v2_get_pvp_match_state(p_match_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare room public.v2_pvp_matches;
begin
  select * into room from public.v2_pvp_matches where id=p_match_id;
  if room.id is null or room.state is null or (select auth.uid()) not in (room.player_one_user_id,room.player_two_user_id) then raise exception 'Sala PvP não encontrada' using errcode='42501'; end if;
  return public.v2_pvp_room_payload(room);
end; $$;

create or replace function public.v2_update_pvp_match_state(p_match_id uuid,p_expected_version integer,p_state jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare room public.v2_pvp_matches; next_status text; next_winner uuid;
begin
  select * into room from public.v2_pvp_matches where id=p_match_id for update;
  if room.id is null or (select auth.uid()) not in (room.player_one_user_id,room.player_two_user_id) then raise exception 'Partida PvP não encontrada' using errcode='42501'; end if;
  if room.version<>p_expected_version then return public.v2_pvp_room_payload(room); end if;
  if room.status<>'active' then return public.v2_pvp_room_payload(room); end if;
  if room.player_one_user_id=(select auth.uid()) and room.player_one_character_id<>(room.state->>'activeCharacterId')::uuid then raise exception 'Não é o seu turno' using errcode='42501'; end if;
  if room.player_two_user_id=(select auth.uid()) and room.player_two_character_id<>(room.state->>'activeCharacterId')::uuid then raise exception 'Não é o seu turno' using errcode='42501'; end if;
  next_status:=coalesce(p_state->>'status','active');
  if next_status not in ('active','finished','abandoned') then raise exception 'Estado PvP inválido' using errcode='22023'; end if;
  next_winner:=nullif(p_state->>'winnerCharacterId','')::uuid;
  if next_winner is not null and next_winner not in (room.player_one_character_id,room.player_two_character_id) then raise exception 'Vencedor inválido' using errcode='22023'; end if;
  update public.v2_pvp_matches set state=p_state,version=version+1,status=next_status,winner_character_id=next_winner,
    updated_at=now(),finished_at=case when next_status='finished' then now() else null end where id=room.id returning * into room;
  return public.v2_pvp_room_payload(room);
end; $$;

revoke all on function public.v2_create_pvp_match_room(),public.v2_pvp_room_payload(public.v2_pvp_matches),public.v2_initialize_pvp_match(uuid,jsonb),public.v2_get_pvp_match_state(uuid),public.v2_update_pvp_match_state(uuid,integer,jsonb) from public,anon;
revoke execute on function public.v2_create_pvp_match_room(),public.v2_pvp_room_payload(public.v2_pvp_matches) from authenticated;
grant execute on function public.v2_initialize_pvp_match(uuid,jsonb),public.v2_get_pvp_match_state(uuid),public.v2_update_pvp_match_state(uuid,integer,jsonb) to authenticated;

do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='v2_pvp_matches') then
    alter publication supabase_realtime add table public.v2_pvp_matches;
  end if;
end $$;

commit;
