-- Item 12: ranqueada 2x2, temporadas, PdL, posicionamento e integridade competitiva.

alter table public.v2_pvp_queue
  add column if not exists mode text not null default 'casual',
  add column if not exists season_id uuid,
  add column if not exists ranked_pdl integer,
  add column if not exists ranked_tier text,
  add column if not exists team_signature text;

alter table public.v2_pvp_queue drop constraint if exists v2_pvp_queue_mode_check;
alter table public.v2_pvp_queue add constraint v2_pvp_queue_mode_check check(mode in ('casual','ranked'));

alter table public.v2_pvp_matches
  add column if not exists mode text not null default 'casual',
  add column if not exists season_id uuid,
  add column if not exists player_one_team_signature text,
  add column if not exists player_two_team_signature text,
  add column if not exists abandoned_user_id uuid references auth.users(id) on delete set null,
  add column if not exists ranked_processed_at timestamptz;

alter table public.v2_pvp_matches drop constraint if exists v2_pvp_matches_mode_check;
alter table public.v2_pvp_matches add constraint v2_pvp_matches_mode_check check(mode in ('casual','ranked'));

create table if not exists public.v2_ranked_seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled' check(status in ('scheduled','active','finished')),
  created_at timestamptz not null default now(),
  check(ends_at>starts_at)
);

create unique index if not exists v2_ranked_one_active_season_idx
  on public.v2_ranked_seasons(status) where status='active';

create table if not exists public.v2_ranked_ratings (
  season_id uuid not null references public.v2_ranked_seasons(id) on delete cascade,
  character_id uuid not null references public.v2_characters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  pdl integer not null default 0 check(pdl>=0),
  placement_matches smallint not null default 0 check(placement_matches between 0 and 5),
  wins integer not null default 0 check(wins>=0),
  losses integer not null default 0 check(losses>=0),
  abandons integer not null default 0 check(abandons>=0),
  penalty_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key(season_id,character_id)
);

create table if not exists public.v2_ranked_history (
  id bigint generated always as identity primary key,
  season_id uuid not null references public.v2_ranked_seasons(id) on delete cascade,
  match_id uuid not null references public.v2_pvp_matches(id) on delete cascade,
  character_id uuid not null references public.v2_characters(id) on delete cascade,
  team_signature text not null,
  opponent_signature text not null,
  result text not null check(result in ('victory','defeat','draw','abandonment')),
  pdl_before integer not null,
  pdl_delta integer not null,
  pdl_after integer not null,
  created_at timestamptz not null default now(),
  unique(match_id,character_id)
);

create index if not exists v2_ranked_ratings_standing_idx on public.v2_ranked_ratings(season_id,pdl desc);
create index if not exists v2_ranked_history_character_idx on public.v2_ranked_history(character_id,created_at desc);
create index if not exists v2_ranked_history_pair_idx on public.v2_ranked_history(team_signature,opponent_signature,created_at desc);
create index if not exists v2_ranked_queue_search_idx on public.v2_pvp_queue(mode,ranked_tier,joined_at) where status='searching';

alter table public.v2_ranked_seasons enable row level security;
alter table public.v2_ranked_ratings enable row level security;
alter table public.v2_ranked_history enable row level security;
revoke all on public.v2_ranked_seasons,public.v2_ranked_ratings,public.v2_ranked_history from public,anon,authenticated;

insert into public.v2_ranked_seasons(name,starts_at,ends_at,status)
select 'Temporada Inaugural',date_trunc('day',now()),date_trunc('day',now())+interval '90 days','active'
where not exists(select 1 from public.v2_ranked_seasons where status='active');

create or replace function public.v2_ranked_tier(p_pdl integer)
returns text language sql immutable set search_path='' as $$
  select case
    when greatest(p_pdl,0)>=2400 then 'Lenda'
    when greatest(p_pdl,0)>=2100 then 'Grão-Mestre'
    when greatest(p_pdl,0)>=1800 then 'Mestre'
    when greatest(p_pdl,0)>=1500 then 'Diamante'
    when greatest(p_pdl,0)>=1200 then 'Platina'
    when greatest(p_pdl,0)>=900 then 'Ouro'
    when greatest(p_pdl,0)>=600 then 'Prata'
    when greatest(p_pdl,0)>=300 then 'Bronze'
    else 'Ferro' end
$$;

create or replace function public.v2_ranked_tier_index(p_tier text)
returns integer language sql immutable set search_path='' as $$
  select array_position(array['Ferro','Bronze','Prata','Ouro','Platina','Diamante','Mestre','Grão-Mestre','Lenda'],p_tier)-1
$$;

create or replace function public.v2_ranked_division(p_pdl integer)
returns text language sql immutable set search_path='' as $$
  select case when greatest(p_pdl,0)>=1800 then null else (array['IV','III','II','I'])[least(4,floor((greatest(p_pdl,0)%300)/75)::integer+1)] end
$$;

create or replace function public.v2_ranked_team_signature(p_first uuid,p_second uuid)
returns text language sql immutable set search_path='' as $$
  select md5(least(p_first::text,p_second::text)||':'||greatest(p_first::text,p_second::text))
$$;

create or replace function public.v2_get_ranked_profile(p_character_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); v_season public.v2_ranked_seasons; v_rating public.v2_ranked_ratings; v_history jsonb; v_standings jsonb;
begin
  if v_user is null or not exists(select 1 from public.v2_characters where id=p_character_id and user_id=v_user) then raise exception 'Personagem inválido' using errcode='42501'; end if;
  select * into v_season from public.v2_ranked_seasons where status='active' and starts_at<=now() and ends_at>now() order by starts_at desc limit 1;
  if v_season.id is null then return jsonb_build_object('available',false); end if;
  insert into public.v2_ranked_ratings(season_id,character_id,user_id) values(v_season.id,p_character_id,v_user) on conflict do nothing;
  select * into v_rating from public.v2_ranked_ratings where season_id=v_season.id and character_id=p_character_id;
  select coalesce(jsonb_agg(x order by x.created_at desc),'[]'::jsonb) into v_history from (
    select h.created_at,jsonb_build_object('matchId',h.match_id,'result',h.result,'delta',h.pdl_delta,'pdlAfter',h.pdl_after,'createdAt',h.created_at) x
    from public.v2_ranked_history h where h.season_id=v_season.id and h.character_id=p_character_id order by h.created_at desc limit 10
  ) recent;
  select coalesce(jsonb_agg(jsonb_build_object('position',s.position,'characterId',s.character_id,'name',s.name,'pdl',s.pdl,'tier',public.v2_ranked_tier(s.pdl)) order by s.position),'[]'::jsonb) into v_standings from (
    select row_number() over(order by r.pdl desc,r.wins desc,r.updated_at) position,r.character_id,c.name,r.pdl from public.v2_ranked_ratings r join public.v2_characters c on c.id=r.character_id where r.season_id=v_season.id order by r.pdl desc,r.wins desc limit 20
  ) s;
  return jsonb_build_object('available',true,'season',jsonb_build_object('id',v_season.id,'name',v_season.name,'endsAt',v_season.ends_at),'rating',jsonb_build_object('pdl',v_rating.pdl,'tier',public.v2_ranked_tier(v_rating.pdl),'division',public.v2_ranked_division(v_rating.pdl),'placementMatches',v_rating.placement_matches,'placementRequired',5,'wins',v_rating.wins,'losses',v_rating.losses,'abandons',v_rating.abandons,'penaltyUntil',v_rating.penalty_until),'history',v_history,'standings',v_standings);
end; $$;

create or replace function public.v2_join_ranked_queue(p_character_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); chosen public.v2_characters; party_id uuid; member_count integer; users uuid[]; chars uuid[]; season public.v2_ranked_seasons; own_pdl integer; own_tier text; signature text; opponent public.v2_pvp_queue; own public.v2_pvp_queue; new_match uuid;
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  select * into chosen from public.v2_characters where id=p_character_id and user_id=v_user;
  if chosen.id is null then raise exception 'Personagem inválido' using errcode='42501'; end if;
  select * into season from public.v2_ranked_seasons where status='active' and starts_at<=now() and ends_at>now() limit 1;
  if season.id is null then raise exception 'Não há temporada ranqueada ativa' using errcode='P0001'; end if;
  select pm.party_id into party_id from public.v2_pvp_party_members pm where pm.user_id=v_user and pm.character_id=chosen.id;
  select count(*),array_agg(pm.user_id order by pm.slot),array_agg(pm.character_id order by pm.slot) into member_count,users,chars from public.v2_pvp_party_members pm where pm.party_id=party_id;
  if party_id is null or member_count<>2 then raise exception 'A ranqueada é exclusivamente 2x2: forme uma dupla com exatamente dois jogadores' using errcode='P0001'; end if;
  if exists(select 1 from public.v2_characters c where c.id=any(chars) and c.adventure_rank<>chosen.adventure_rank) then raise exception 'A dupla precisa estar no mesmo Rank de aventura' using errcode='P0001'; end if;
  if exists(select 1 from unnest(chars) x(id) where public.v2_character_has_active_mission(x.id)) then raise exception 'Um integrante está em missão' using errcode='P0001'; end if;
  insert into public.v2_ranked_ratings(season_id,character_id,user_id) select season.id,c.id,c.user_id from public.v2_characters c where c.id=any(chars) on conflict do nothing;
  if exists(select 1 from public.v2_ranked_ratings r where r.season_id=season.id and r.character_id=any(chars) and r.penalty_until>now()) then raise exception 'A dupla possui penalidade de abandono ativa' using errcode='P0001'; end if;
  select floor(avg(pdl))::integer into own_pdl from public.v2_ranked_ratings where season_id=season.id and character_id=any(chars);
  own_tier:=public.v2_ranked_tier(own_pdl); signature:=public.v2_ranked_team_signature(chars[1],chars[2]);
  perform pg_advisory_xact_lock(hashtext('wonderland-ranked-'||season.id::text));
  update public.v2_pvp_queue set status='expired' where status='searching' and mode='ranked' and joined_at<now()-interval '15 minutes';
  update public.v2_pvp_queue set status='cancelled' where status='searching' and (user_id=any(users) or secondary_user_id=any(users));
  select * into opponent from public.v2_pvp_queue q where q.status='searching' and q.mode='ranked' and q.format='duo' and q.season_id=season.id
    and abs(public.v2_ranked_tier_index(q.ranked_tier)-public.v2_ranked_tier_index(own_tier))<=1
    and not(array_remove(array[q.user_id,q.secondary_user_id],null)&&users)
    and not exists(select 1 from public.v2_ranked_history h where h.season_id=season.id and ((h.team_signature=signature and h.opponent_signature=q.team_signature) or (h.team_signature=q.team_signature and h.opponent_signature=signature)) and h.created_at>now()-interval '30 minutes')
    order by abs(coalesce(q.ranked_pdl,0)-own_pdl),q.joined_at limit 1 for update skip locked;
  if opponent.id is null then
    insert into public.v2_pvp_queue(user_id,character_id,secondary_user_id,secondary_character_id,rank,format,mode,season_id,ranked_pdl,ranked_tier,team_signature) values(users[1],chars[1],users[2],chars[2],chosen.adventure_rank,'duo','ranked',season.id,own_pdl,own_tier,signature) returning * into own;
    return public.v2_pvp_queue_payload(own)||jsonb_build_object('mode','ranked');
  end if;
  new_match:=gen_random_uuid();
  update public.v2_pvp_queue set status='matched',opponent_character_id=chars[1],opponent_secondary_character_id=chars[2],match_id=new_match,matched_at=now() where id=opponent.id;
  insert into public.v2_pvp_queue(user_id,character_id,secondary_user_id,secondary_character_id,rank,format,mode,season_id,ranked_pdl,ranked_tier,team_signature,status,opponent_character_id,opponent_secondary_character_id,match_id,matched_at) values(users[1],chars[1],users[2],chars[2],chosen.adventure_rank,'duo','ranked',season.id,own_pdl,own_tier,signature,'matched',opponent.character_id,opponent.secondary_character_id,new_match,now()) returning * into own;
  return public.v2_pvp_queue_payload(own)||jsonb_build_object('mode','ranked');
end; $$;

create or replace function public.v2_join_pvp_queue_v2(p_character_id uuid,p_format text default 'solo')
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); chosen public.v2_characters; normalized text:=lower(coalesce(p_format,'solo')); party_id uuid; member_count integer; users uuid[]; chars uuid[]; opponent public.v2_pvp_queue; own public.v2_pvp_queue; new_match uuid;
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  if normalized not in ('solo','duo','trio') then raise exception 'Formato PvP inválido' using errcode='22023'; end if;
  select * into chosen from public.v2_characters where id=p_character_id and user_id=v_user;
  if chosen.id is null then raise exception 'Personagem inválido' using errcode='42501'; end if;
  if normalized='solo' then users:=array[v_user]; chars:=array[chosen.id];
  else
    select pm.party_id into party_id from public.v2_pvp_party_members pm where pm.user_id=v_user and pm.character_id=chosen.id;
    select count(*),array_agg(pm.user_id order by pm.slot),array_agg(pm.character_id order by pm.slot) into member_count,users,chars from public.v2_pvp_party_members pm where pm.party_id=party_id;
    if party_id is null or member_count<>(case when normalized='duo' then 2 else 3 end) then raise exception 'Sua equipe precisa ter exatamente % jogadores para esta fila',case when normalized='duo' then 2 else 3 end using errcode='P0001'; end if;
    if exists(select 1 from public.v2_characters c where c.id=any(chars) and c.adventure_rank<>chosen.adventure_rank) then raise exception 'Todos os personagens precisam estar no mesmo Rank' using errcode='P0001'; end if;
    if exists(select 1 from unnest(chars) selected(character_id) where public.v2_character_has_active_mission(selected.character_id)) then raise exception 'Um integrante está em missão e não pode entrar na Arena' using errcode='P0001'; end if;
  end if;
  perform pg_advisory_xact_lock(hashtext('wonderland-pvp-casual-'||normalized||'-'||chosen.adventure_rank));
  update public.v2_pvp_queue set status='expired' where status='searching' and mode='casual' and joined_at<now()-interval '15 minutes';
  update public.v2_pvp_queue set status='cancelled' where status='searching' and (user_id=any(users) or secondary_user_id=any(users) or tertiary_user_id=any(users));
  select * into opponent from public.v2_pvp_queue q where q.status='searching' and q.mode='casual' and q.rank=chosen.adventure_rank and q.format=normalized and not(array_remove(array[q.user_id,q.secondary_user_id,q.tertiary_user_id],null)&&users) and(normalized='solo' or q.secondary_user_id is not null) and(normalized<>'trio' or q.tertiary_user_id is not null) order by q.joined_at limit 1 for update skip locked;
  if opponent.id is null then insert into public.v2_pvp_queue(user_id,character_id,secondary_user_id,secondary_character_id,tertiary_user_id,tertiary_character_id,rank,format,mode) values(users[1],chars[1],users[2],chars[2],users[3],chars[3],chosen.adventure_rank,normalized,'casual') returning * into own; return public.v2_pvp_queue_payload(own)||jsonb_build_object('mode','casual'); end if;
  new_match:=gen_random_uuid();
  update public.v2_pvp_queue set status='matched',opponent_character_id=chars[1],opponent_secondary_character_id=chars[2],opponent_tertiary_character_id=chars[3],match_id=new_match,matched_at=now() where id=opponent.id;
  insert into public.v2_pvp_queue(user_id,character_id,secondary_user_id,secondary_character_id,tertiary_user_id,tertiary_character_id,rank,format,mode,status,opponent_character_id,opponent_secondary_character_id,opponent_tertiary_character_id,match_id,matched_at) values(users[1],chars[1],users[2],chars[2],users[3],chars[3],chosen.adventure_rank,normalized,'casual','matched',opponent.character_id,opponent.secondary_character_id,opponent.tertiary_character_id,new_match,now()) returning * into own;
  return public.v2_pvp_queue_payload(own)||jsonb_build_object('mode','casual');
end; $$;

-- Impede que filas casuais consumam equipes ranqueadas.
create or replace function public.v2_create_pvp_match_room()
returns trigger language plpgsql security definer set search_path='' as $$ declare other_entry public.v2_pvp_queue; begin
  if new.status<>'matched' or new.match_id is null then return new; end if;
  select * into other_entry from public.v2_pvp_queue where match_id=new.match_id and status='matched' and id<>new.id and mode=new.mode order by matched_at limit 1;
  if other_entry.id is not null then insert into public.v2_pvp_matches(id,player_one_user_id,player_one_character_id,player_one_secondary_user_id,player_one_secondary_character_id,player_one_tertiary_user_id,player_one_tertiary_character_id,player_two_user_id,player_two_character_id,player_two_secondary_user_id,player_two_secondary_character_id,player_two_tertiary_user_id,player_two_tertiary_character_id,rank,format,mode,season_id,player_one_team_signature,player_two_team_signature,status,accepted_user_ids,accept_deadline) values(new.match_id,other_entry.user_id,other_entry.character_id,other_entry.secondary_user_id,other_entry.secondary_character_id,other_entry.tertiary_user_id,other_entry.tertiary_character_id,new.user_id,new.character_id,new.secondary_user_id,new.secondary_character_id,new.tertiary_user_id,new.tertiary_character_id,new.rank,new.format,new.mode,new.season_id,other_entry.team_signature,new.team_signature,'awaiting_acceptance','{}'::uuid[],now()+interval '30 seconds') on conflict(id) do nothing; end if;
  return new; end; $$;

create or replace function public.v2_process_ranked_result()
returns trigger language plpgsql security definer set search_path='' as $$
declare chars uuid[]; winners uuid[]; c uuid; before_pdl integer; opponent_pdl integer; delta integer; won boolean; sig text; opp_sig text; result text;
begin
  if new.mode<>'ranked' or new.status<>'finished' or old.status='finished' or new.ranked_processed_at is not null then return new; end if;
  chars:=array_remove(array[new.player_one_character_id,new.player_one_secondary_character_id,new.player_two_character_id,new.player_two_secondary_character_id],null);
  if new.winner_character_id=any(array_remove(array[new.player_one_character_id,new.player_one_secondary_character_id],null)) then winners:=array_remove(array[new.player_one_character_id,new.player_one_secondary_character_id],null);
  elsif new.winner_character_id=any(array_remove(array[new.player_two_character_id,new.player_two_secondary_character_id],null)) then winners:=array_remove(array[new.player_two_character_id,new.player_two_secondary_character_id],null); else winners:='{}'::uuid[]; end if;
  foreach c in array chars loop
    select pdl into before_pdl from public.v2_ranked_ratings where season_id=new.season_id and character_id=c for update;
    won:=c=any(winners); sig:=case when c=any(array[new.player_one_character_id,new.player_one_secondary_character_id]) then new.player_one_team_signature else new.player_two_team_signature end; opp_sig:=case when sig=new.player_one_team_signature then new.player_two_team_signature else new.player_one_team_signature end;
    select floor(avg(r.pdl))::integer into opponent_pdl from public.v2_ranked_ratings r where r.season_id=new.season_id and r.character_id=any(case when sig=new.player_one_team_signature then array[new.player_two_character_id,new.player_two_secondary_character_id] else array[new.player_one_character_id,new.player_one_secondary_character_id] end);
    if cardinality(winners)=0 then delta:=0; result:='draw'; else delta:=round((case when (select placement_matches from public.v2_ranked_ratings where season_id=new.season_id and character_id=c)<5 then 64 else 32 end)*((case when won then 1 else 0 end)-(1.0/(1.0+power(10.0,(coalesce(opponent_pdl,0)-before_pdl)/400.0)))))::integer; result:=case when won then 'victory' else 'defeat' end; end if;
    if new.abandoned_user_id=(select user_id from public.v2_ranked_ratings where season_id=new.season_id and character_id=c) then delta:=least(delta,-32); result:='abandonment'; end if;
    update public.v2_ranked_ratings set pdl=greatest(0,pdl+delta),placement_matches=least(5,placement_matches+1),wins=wins+(case when won then 1 else 0 end),losses=losses+(case when cardinality(winners)>0 and not won then 1 else 0 end),abandons=abandons+(case when result='abandonment' then 1 else 0 end),penalty_until=case when result='abandonment' then now()+make_interval(mins=>least(120,15*(abandons+1))) else penalty_until end,updated_at=now() where season_id=new.season_id and character_id=c;
    insert into public.v2_ranked_history(season_id,match_id,character_id,team_signature,opponent_signature,result,pdl_before,pdl_delta,pdl_after) values(new.season_id,new.id,c,sig,opp_sig,result,before_pdl,delta,greatest(0,before_pdl+delta)) on conflict do nothing;
  end loop;
  new.ranked_processed_at:=now(); return new;
end; $$;

drop trigger if exists v2_process_ranked_result_trigger on public.v2_pvp_matches;
create trigger v2_process_ranked_result_trigger before update of status on public.v2_pvp_matches for each row execute function public.v2_process_ranked_result();

create or replace function public.v2_leave_combat_screen(p_kind text,p_combat_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); changed integer:=0; room public.v2_pvp_matches; winner uuid;
begin
 if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
 if p_kind='arena' then update public.v2_arena_sessions set status='abandoned',completed_at=coalesce(completed_at,now()) where id=p_combat_id and user_id=v_user and status='open'; get diagnostics changed=row_count;
 elsif p_kind='pvp' then
  select * into room from public.v2_pvp_matches where id=p_combat_id for update;
  if room.id is null or not(v_user=any(array_remove(array[room.player_one_user_id,room.player_one_secondary_user_id,room.player_one_tertiary_user_id,room.player_two_user_id,room.player_two_secondary_user_id,room.player_two_tertiary_user_id],null))) then raise exception 'Combate não encontrado' using errcode='42501'; end if;
  if room.status='active' then
   if room.mode='ranked' then winner:=case when v_user=any(array_remove(array[room.player_one_user_id,room.player_one_secondary_user_id],null)) then room.player_two_character_id else room.player_one_character_id end; update public.v2_pvp_matches set status='finished',winner_character_id=winner,abandoned_user_id=v_user,state=coalesce(state,'{}'::jsonb)||jsonb_build_object('status','finished','winnerCharacterId',winner,'message','Partida encerrada por abandono.'),updated_at=now(),finished_at=now() where id=room.id;
   else update public.v2_pvp_matches set status='abandoned',state=coalesce(state,'{}'::jsonb)||jsonb_build_object('status','abandoned'),updated_at=now(),finished_at=now() where id=room.id; end if; changed:=1;
   update public.v2_pvp_queue set status='expired' where match_id=p_combat_id and status='matched';
  end if;
 elsif p_kind='dungeon' then update public.v2_dungeon_runs r set status='cancelled',state=coalesce(r.state,'{}'::jsonb)||jsonb_build_object('status','abandoned'),finished_at=coalesce(r.finished_at,now()) where r.id=p_combat_id and r.status='active' and exists(select 1 from public.v2_characters c where c.user_id=v_user and c.id=any(r.party_character_ids)); get diagnostics changed=row_count;
 else raise exception 'Tipo de combate inválido' using errcode='22023'; end if;
 return changed>0;
end; $$;

revoke all on function public.v2_get_ranked_profile(uuid),public.v2_join_ranked_queue(uuid) from public,anon;
grant execute on function public.v2_get_ranked_profile(uuid),public.v2_join_ranked_queue(uuid) to authenticated;
