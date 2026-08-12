-- Histórico competitivo imutável e ranking por taxa de vitória.
begin;

create table if not exists public.v2_pvp_history (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.v2_pvp_matches(id) on delete cascade,
  character_id uuid not null references public.v2_characters(id) on delete cascade,
  opponent_character_id uuid not null references public.v2_characters(id) on delete cascade,
  result text not null check (result in ('victory','defeat')),
  rank text not null check (rank in ('E','D','C','B','A','S','EX')),
  rounds integer not null default 1 check (rounds > 0),
  finished_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(match_id,character_id)
);
create index if not exists v2_pvp_history_character_finished_idx on public.v2_pvp_history(character_id,finished_at desc);
create index if not exists v2_pvp_history_result_idx on public.v2_pvp_history(character_id,result);
alter table public.v2_pvp_history enable row level security;
drop policy if exists "players read own pvp history" on public.v2_pvp_history;
create policy "players read own pvp history" on public.v2_pvp_history for select to authenticated
using (exists(select 1 from public.v2_characters c where c.id=character_id and c.user_id=(select auth.uid())));
revoke all on public.v2_pvp_history from public,anon,authenticated;
grant select on public.v2_pvp_history to authenticated;

create or replace function public.v2_record_pvp_result()
returns trigger language plpgsql security definer set search_path='' as $$
declare rounds_played integer;
begin
  if new.status<>'finished' or new.winner_character_id is null or (old.status='finished' and old.winner_character_id is not null) then return new; end if;
  rounds_played:=greatest(1,coalesce((new.state->>'turn')::integer,1));
  insert into public.v2_pvp_history(match_id,character_id,opponent_character_id,result,rank,rounds,finished_at)
  values
    (new.id,new.player_one_character_id,new.player_two_character_id,case when new.winner_character_id=new.player_one_character_id then 'victory' else 'defeat' end,new.rank,rounds,coalesce(new.finished_at,now())),
    (new.id,new.player_two_character_id,new.player_one_character_id,case when new.winner_character_id=new.player_two_character_id then 'victory' else 'defeat' end,new.rank,rounds,coalesce(new.finished_at,now()))
  on conflict(match_id,character_id) do nothing;
  return new;
end; $$;
drop trigger if exists v2_pvp_match_record_result on public.v2_pvp_matches;
create trigger v2_pvp_match_record_result after update of status,winner_character_id on public.v2_pvp_matches
for each row execute function public.v2_record_pvp_result();

insert into public.v2_pvp_history(match_id,character_id,opponent_character_id,result,rank,rounds,finished_at)
select m.id,m.player_one_character_id,m.player_two_character_id,case when m.winner_character_id=m.player_one_character_id then 'victory' else 'defeat' end,m.rank,greatest(1,coalesce((m.state->>'turn')::integer,1)),coalesce(m.finished_at,m.updated_at)
from public.v2_pvp_matches m where m.status='finished' and m.winner_character_id is not null
union all
select m.id,m.player_two_character_id,m.player_one_character_id,case when m.winner_character_id=m.player_two_character_id then 'victory' else 'defeat' end,m.rank,greatest(1,coalesce((m.state->>'turn')::integer,1)),coalesce(m.finished_at,m.updated_at)
from public.v2_pvp_matches m where m.status='finished' and m.winner_character_id is not null
on conflict(match_id,character_id) do nothing;

create or replace function public.v2_pvp_ranking()
returns table(id uuid,user_id uuid,name text,level integer,image_url text,race_name text,class_name text,adventure_rank text,matches bigint,victories bigint,defeats bigint,win_rate numeric)
language sql stable security definer set search_path='' as $$
  select c.id,c.user_id,c.name,c.level,c.image_url,r.name,cl.name,c.adventure_rank,
    count(h.id) as matches,
    count(h.id) filter(where h.result='victory') as victories,
    count(h.id) filter(where h.result='defeat') as defeats,
    round((count(h.id) filter(where h.result='victory')::numeric/nullif(count(h.id),0))*100,1) as win_rate
  from public.v2_pvp_history h
  join public.v2_characters c on c.id=h.character_id
  join public.v2_content r on r.id=c.race_id
  join public.v2_content cl on cl.id=c.class_id
  group by c.id,c.user_id,c.name,c.level,c.image_url,r.name,cl.name,c.adventure_rank
  order by win_rate desc,victories desc,matches desc,c.name
  limit 100
$$;

create or replace function public.v2_my_pvp_history(p_character_id uuid)
returns table(match_id uuid,result text,rank text,rounds integer,finished_at timestamptz,opponent_id uuid,opponent_name text,opponent_image_url text)
language sql stable security definer set search_path='' as $$
  select h.match_id,h.result,h.rank,h.rounds,h.finished_at,o.id,o.name,o.image_url
  from public.v2_pvp_history h join public.v2_characters own on own.id=h.character_id join public.v2_characters o on o.id=h.opponent_character_id
  where h.character_id=p_character_id and own.user_id=(select auth.uid()) order by h.finished_at desc limit 100
$$;

revoke all on function public.v2_record_pvp_result(),public.v2_pvp_ranking(),public.v2_my_pvp_history(uuid) from public,anon;
revoke execute on function public.v2_record_pvp_result() from authenticated;
grant execute on function public.v2_pvp_ranking(),public.v2_my_pvp_history(uuid) to authenticated;

commit;
