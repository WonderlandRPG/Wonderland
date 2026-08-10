begin;

create or replace function public.v2_start_arena_session(p_character_id uuid,p_mode text)
returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
  if (select auth.uid()) is null or p_mode not in ('pve','pvp') or not exists(
    select 1 from public.v2_characters where id=p_character_id and user_id=(select auth.uid())
  ) then raise exception 'Sessão inválida' using errcode='42501'; end if;

  select id into result from public.v2_arena_sessions
  where user_id=(select auth.uid()) and character_id=p_character_id and mode=p_mode
    and status='open' and created_at >= now()-interval '12 hours'
  order by created_at desc limit 1 for update;
  if result is not null then return result; end if;

  update public.v2_arena_sessions set status='abandoned',completed_at=now()
  where user_id=(select auth.uid()) and character_id=p_character_id and mode=p_mode and status='open';
  insert into public.v2_arena_sessions(user_id,character_id,mode)
  values((select auth.uid()),p_character_id,p_mode) returning id into result;
  return result;
end; $$;

create or replace function public.v2_claim_arena_victory(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare session_row public.v2_arena_sessions; character_row public.v2_characters; reward_xp bigint; reward_wg bigint;
begin
  select * into session_row from public.v2_arena_sessions
  where id=p_session_id and user_id=(select auth.uid()) and mode='pve' and status='open' for update;
  if session_row.id is null or session_row.created_at < now()-interval '12 hours' then
    raise exception 'Esta batalha expirou. Inicie um novo confronto PvE.' using errcode='P0001';
  end if;
  select * into character_row from public.v2_characters
  where id=session_row.character_id and user_id=(select auth.uid()) for update;
  if character_row.id is null then raise exception 'Personagem da batalha não encontrado' using errcode='P0002'; end if;
  reward_xp := case character_row.adventure_rank when 'E' then 500 when 'D' then 1000 when 'C' then 2000 when 'B' then 4000 when 'A' then 8000 when 'S' then 15000 when 'EX' then 30000 else 500 end;
  reward_wg := case character_row.adventure_rank when 'E' then 100 when 'D' then 250 when 'C' then 600 when 'B' then 1500 when 'A' then 4000 when 'S' then 10000 when 'EX' then 25000 else 100 end;
  update public.v2_characters set xp=xp+reward_xp,gold=gold+reward_wg,updated_at=now() where id=character_row.id;
  update public.v2_arena_sessions set status='victory',completed_at=now() where id=session_row.id;
  return jsonb_build_object('xp',reward_xp,'wg',reward_wg,'rank',character_row.adventure_rank,'character_id',character_row.id);
end; $$;

create table if not exists public.v2_pvp_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.v2_characters(id) on delete cascade,
  rank text not null check(rank in ('E','D','C','B','A','S','EX')),
  status text not null default 'searching' check(status in ('searching','matched','cancelled','expired')),
  opponent_character_id uuid references public.v2_characters(id) on delete set null,
  match_id uuid,
  joined_at timestamptz not null default now(),
  matched_at timestamptz
);
create index if not exists v2_pvp_queue_rank_searching_idx on public.v2_pvp_queue(rank,joined_at) where status='searching';
create unique index if not exists v2_pvp_queue_one_search_per_user_idx on public.v2_pvp_queue(user_id) where status='searching';
alter table public.v2_pvp_queue enable row level security;
drop policy if exists "pvp queue read own" on public.v2_pvp_queue;
create policy "pvp queue read own" on public.v2_pvp_queue for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.v2_pvp_queue from anon,authenticated;
grant select on public.v2_pvp_queue to authenticated;

create or replace function public.v2_join_pvp_queue(p_character_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare chosen public.v2_characters; opponent public.v2_pvp_queue; own_queue public.v2_pvp_queue; new_match uuid;
begin
  select * into chosen from public.v2_characters where id=p_character_id and user_id=(select auth.uid());
  if chosen.id is null then raise exception 'Personagem inválido' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtext('wonderland-pvp-'||chosen.adventure_rank));
  update public.v2_pvp_queue set status='expired' where status='searching' and joined_at < now()-interval '15 minutes';
  update public.v2_pvp_queue set status='cancelled' where user_id=(select auth.uid()) and status='searching';
  select * into opponent from public.v2_pvp_queue
  where status='searching' and rank=chosen.adventure_rank and user_id<>(select auth.uid())
  order by joined_at limit 1 for update skip locked;
  if opponent.id is null then
    insert into public.v2_pvp_queue(user_id,character_id,rank)
    values((select auth.uid()),chosen.id,chosen.adventure_rank) returning * into own_queue;
    return jsonb_build_object('status','searching','queueId',own_queue.id,'rank',chosen.adventure_rank);
  end if;
  new_match := gen_random_uuid();
  update public.v2_pvp_queue set status='matched',opponent_character_id=chosen.id,match_id=new_match,matched_at=now() where id=opponent.id;
  insert into public.v2_pvp_queue(user_id,character_id,rank,status,opponent_character_id,match_id,matched_at)
  values((select auth.uid()),chosen.id,chosen.adventure_rank,'matched',opponent.character_id,new_match,now()) returning * into own_queue;
  return jsonb_build_object('status','matched','queueId',own_queue.id,'matchId',new_match,'rank',chosen.adventure_rank);
end; $$;

create or replace function public.v2_poll_pvp_queue(p_queue_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare entry public.v2_pvp_queue; opponent public.v2_characters;
begin
  select * into entry from public.v2_pvp_queue where id=p_queue_id and user_id=(select auth.uid());
  if entry.id is null then raise exception 'Fila não encontrada' using errcode='P0002'; end if;
  if entry.status='searching' and entry.joined_at < now()-interval '15 minutes' then
    update public.v2_pvp_queue set status='expired' where id=entry.id; entry.status := 'expired';
  end if;
  if entry.opponent_character_id is not null then select * into opponent from public.v2_characters where id=entry.opponent_character_id; end if;
  return jsonb_build_object('status',entry.status,'queueId',entry.id,'matchId',entry.match_id,'rank',entry.rank,
    'opponent',case when opponent.id is null then null else jsonb_build_object('id',opponent.id,'name',opponent.name,'level',opponent.level,'rank',opponent.adventure_rank,'imageUrl',opponent.image_url) end);
end; $$;

create or replace function public.v2_cancel_pvp_queue(p_queue_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  update public.v2_pvp_queue set status='cancelled'
  where id=p_queue_id and user_id=(select auth.uid()) and status='searching';
end; $$;

revoke execute on function public.v2_start_arena_session(uuid,text),public.v2_claim_arena_victory(uuid),public.v2_join_pvp_queue(uuid),public.v2_poll_pvp_queue(uuid),public.v2_cancel_pvp_queue(uuid) from public,anon;
grant execute on function public.v2_start_arena_session(uuid,text),public.v2_claim_arena_victory(uuid),public.v2_join_pvp_queue(uuid),public.v2_poll_pvp_queue(uuid),public.v2_cancel_pvp_queue(uuid) to authenticated;

commit;
