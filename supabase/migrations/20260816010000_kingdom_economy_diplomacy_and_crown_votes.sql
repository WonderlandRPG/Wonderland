begin;

alter table public.v2_kingdom_states add column if not exists treasury bigint not null default 0 check(treasury>=0);
alter table public.v2_kingdom_states add column if not exists infrastructure smallint not null default 100 check(infrastructure between 0 and 100);
alter table public.v2_kingdom_states add column if not exists provisions smallint not null default 100 check(provisions between 0 and 100);
alter table public.v2_kingdom_states add column if not exists arsenal smallint not null default 100 check(arsenal between 0 and 100);
alter table public.v2_kingdom_states add column if not exists livestock smallint not null default 100 check(livestock between 0 and 100);
alter table public.v2_kingdom_states add column if not exists last_weekly_cycle date not null default (current_date-extract(dow from current_date)::integer);

create table if not exists public.v2_kingdom_economy_config(
 id boolean primary key default true check(id), monarch_salary bigint not null default 50000,
 realm_councilor_salary bigint not null default 25000, war_councilor_salary bigint not null default 25000,
 infrastructure_drain smallint not null default 12, provisions_drain smallint not null default 20,
 arsenal_drain smallint not null default 15, livestock_drain smallint not null default 10,
 infrastructure_cost bigint not null default 20000, provisions_cost bigint not null default 12000,
 arsenal_cost bigint not null default 25000, livestock_cost bigint not null default 15000,
 weekly_purchase_limit smallint not null default 25 check(weekly_purchase_limit between 1 and 100), updated_at timestamptz not null default now()
);
insert into public.v2_kingdom_economy_config(id) values(true) on conflict(id) do nothing;
alter table public.v2_kingdom_economy_config enable row level security;
revoke all on public.v2_kingdom_economy_config from public,anon,authenticated;

create table if not exists public.v2_kingdom_resource_purchases(
 id bigint generated always as identity primary key, buyer_kingdom text not null references public.v2_kingdom_states(kingdom),
 beneficiary_kingdom text not null references public.v2_kingdom_states(kingdom), resource text not null check(resource in('infrastructure','provisions','arsenal','livestock')),
 percent smallint not null check(percent between 1 and 25), cost bigint not null, cycle_start date not null,
 purchased_by uuid not null references public.v2_characters(id), created_at timestamptz not null default now()
);
alter table public.v2_kingdom_resource_purchases enable row level security;
revoke all on public.v2_kingdom_resource_purchases from public,anon,authenticated;

create table if not exists public.v2_kingdom_peace_proposals(
 id uuid primary key default gen_random_uuid(), proposer_kingdom text not null references public.v2_kingdom_states(kingdom),
 recipient_kingdom text not null references public.v2_kingdom_states(kingdom), status text not null default'pending' check(status in('pending','accepted','declined','expired')),
 proposed_by uuid not null references public.v2_characters(id), responded_by uuid references public.v2_characters(id),
 created_at timestamptz not null default now(), expires_at timestamptz not null default(now()+interval'48 hours'), responded_at timestamptz,
 check(proposer_kingdom<>recipient_kingdom)
);
create unique index if not exists v2_peace_pending_pair on public.v2_kingdom_peace_proposals(least(proposer_kingdom,recipient_kingdom),greatest(proposer_kingdom,recipient_kingdom)) where status='pending';
alter table public.v2_kingdom_peace_proposals enable row level security;
revoke all on public.v2_kingdom_peace_proposals from public,anon,authenticated;

create table if not exists public.v2_kingdom_peace_agreements(
 id uuid primary key default gen_random_uuid(), kingdom_one text not null references public.v2_kingdom_states(kingdom), kingdom_two text not null references public.v2_kingdom_states(kingdom),
 active boolean not null default true, created_at timestamptz not null default now(), ended_at timestamptz, check(kingdom_one<kingdom_two), unique(kingdom_one,kingdom_two)
);
alter table public.v2_kingdom_peace_agreements enable row level security;
revoke all on public.v2_kingdom_peace_agreements from public,anon,authenticated;

create table if not exists public.v2_crown_votes(
 id uuid primary key default gen_random_uuid(), kingdom text not null references public.v2_kingdom_states(kingdom),
 office text not null check(office in('monarch','realm_councilor','war_councilor')), status text not null default'active' check(status in('active','passed','rejected')),
 initiated_by uuid not null references public.v2_characters(id), created_at timestamptz not null default now(), expires_at timestamptz not null default(now()+interval'48 hours'), resolved_at timestamptz
);
create unique index if not exists v2_crown_vote_active_office on public.v2_crown_votes(kingdom,office) where status='active';
alter table public.v2_crown_votes enable row level security;
revoke all on public.v2_crown_votes from public,anon,authenticated;

create table if not exists public.v2_crown_vote_ballots(
 vote_id uuid not null references public.v2_crown_votes(id) on delete cascade, character_id uuid not null references public.v2_characters(id),
 choice boolean not null, created_at timestamptz not null default now(), primary key(vote_id,character_id)
);
alter table public.v2_crown_vote_ballots enable row level security;
revoke all on public.v2_crown_vote_ballots from public,anon,authenticated;

alter table public.v2_kingdom_wars add column if not exists expires_at timestamptz not null default(now()+interval'48 hours');

create or replace function public.v2_process_kingdom_cycles()
returns void language plpgsql security definer set search_path='' as $$
declare cfg public.v2_kingdom_economy_config; s public.v2_kingdom_states; sunday date; leader record; salary bigint; pay bigint; expired record;
begin
 select * into cfg from public.v2_kingdom_economy_config where id;
 sunday:=(timezone('America/Sao_Paulo',now())::date-extract(dow from timezone('America/Sao_Paulo',now()))::integer);
 for s in select * from public.v2_kingdom_states where last_weekly_cycle<sunday for update loop
  update public.v2_kingdom_states set infrastructure=greatest(0,infrastructure-cfg.infrastructure_drain),provisions=greatest(0,provisions-cfg.provisions_drain),arsenal=greatest(0,arsenal-cfg.arsenal_drain),livestock=greatest(0,livestock-cfg.livestock_drain),last_weekly_cycle=sunday where kingdom=s.kingdom;
  for leader in select l.office,c.id from public.v2_kingdom_leadership l join public.v2_characters c on c.id=l.character_id where l.kingdom=s.kingdom order by case l.office when'monarch'then 1 else 2 end loop
   salary:=case leader.office when'monarch'then cfg.monarch_salary when'realm_councilor'then cfg.realm_councilor_salary else cfg.war_councilor_salary end;
   select least(treasury,salary) into pay from public.v2_kingdom_states where kingdom=s.kingdom for update;
   update public.v2_kingdom_states set treasury=treasury-pay where kingdom=s.kingdom;
   update public.v2_characters set gold=case when gold>9223372036854775807-pay then 9223372036854775807 else gold+pay end where id=leader.id;
  end loop;
 end loop;
 update public.v2_kingdom_peace_proposals set status='expired',responded_at=now() where status='pending' and expires_at<=now();
 for expired in update public.v2_kingdom_wars w set status='surrendered',winner_kingdom=attacker_kingdom,loser_kingdom=defender_kingdom,resolved_at=now() where w.status='pending' and w.expires_at<=now() returning defender_kingdom loop
  update public.v2_characters set gold=floor(gold*.5),updated_at=now()where kingdom=expired.defender_kingdom;
  update public.v2_kingdom_states set penalty_until=now()+interval'7 days',reward_penalty_percent=30,shop_markup_percent=0 where kingdom=expired.defender_kingdom;
 end loop;
 update public.v2_crown_votes set status='rejected',resolved_at=now() where status='active' and expires_at<=now();
end; $$;

create or replace function public.v2_kingdom_reward_multiplier(p_kingdom text)
returns numeric language plpgsql stable security definer set search_path='' as $$
declare s public.v2_kingdom_states; penalty numeric:=1;
begin select*into s from public.v2_kingdom_states where kingdom=p_kingdom;
 penalty:=penalty*greatest(.1,1-greatest(0,60-s.infrastructure)*.01)*greatest(.1,1-greatest(0,60-s.provisions)*.02)*greatest(.1,1-greatest(0,60-s.livestock)*.01);
 if s.penalty_until>now() then penalty:=penalty*(1-s.reward_penalty_percent*.01);end if;
 return greatest(0,(1+s.requested_stars*.10)*penalty); end; $$;
create or replace function public.v2_kingdom_reward_multiplier(p_kingdom text,p_reward_type text)
returns numeric language plpgsql stable security definer set search_path='' as $$
declare s public.v2_kingdom_states; base numeric;
begin base:=public.v2_kingdom_reward_multiplier(p_kingdom);select*into s from public.v2_kingdom_states where kingdom=p_kingdom;
 if p_reward_type='xp' then return base*greatest(.1,1-greatest(0,60-s.provisions)*.01);end if;
 if p_reward_type in('wg','gold') then return base*greatest(.1,1-greatest(0,60-s.livestock)*.01);end if;return base;end; $$;
create or replace function public.v2_kingdom_shop_multiplier(p_kingdom text)
returns numeric language plpgsql stable security definer set search_path='' as $$
declare s public.v2_kingdom_states; mult numeric;
begin select*into s from public.v2_kingdom_states where kingdom=p_kingdom;mult:=1-s.market_stars*.03;
 if s.arsenal<60 then mult:=mult*power(1.035,60-s.arsenal);end if;if s.penalty_until>now()then mult:=mult*(1+s.shop_markup_percent*.01);end if;return greatest(.01,mult);end; $$;

create or replace function public.v2_donate_to_kingdom(p_character_id uuid,p_amount bigint)
returns bigint language plpgsql security definer set search_path='' as $$
declare c public.v2_characters;
begin if p_amount<=0 then raise exception'Informe uma doação válida';end if;select*into c from public.v2_characters where id=p_character_id and user_id=(select auth.uid()) for update;
 if c.id is null or c.gold<p_amount then raise exception'WG insuficiente';end if;update public.v2_characters set gold=gold-p_amount where id=c.id;update public.v2_kingdom_states set treasury=treasury+p_amount where kingdom=c.kingdom;return p_amount;end; $$;

create or replace function public.v2_buy_kingdom_resource(p_character_id uuid,p_resource text,p_percent integer,p_beneficiary text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.v2_characters;cfg public.v2_kingdom_economy_config;s public.v2_kingdom_states;target_kingdom text;cost_per bigint;cost bigint;already integer;current_value integer;cycle date;peace boolean;purchase_limit integer;
begin perform public.v2_process_kingdom_cycles();if p_resource not in('infrastructure','provisions','arsenal','livestock')or p_percent not between 1 and 25 then raise exception'Compra inválida';end if;
 select*into c from public.v2_characters where id=p_character_id and user_id=(select auth.uid());if c.id is null or not exists(select 1 from public.v2_kingdom_leadership where character_id=c.id and office='monarch')then raise exception'Somente o Rei ou a Rainha pode comprar recursos' using errcode='42501';end if;
 target_kingdom:=coalesce(nullif(p_beneficiary,''),c.kingdom);peace:=target_kingdom=c.kingdom or exists(select 1 from public.v2_kingdom_peace_agreements where active and kingdom_one=least(c.kingdom,target_kingdom)and kingdom_two=greatest(c.kingdom,target_kingdom));if not peace then raise exception'Esse reino não possui acordo de paz ativo';end if;
 select*into cfg from public.v2_kingdom_economy_config where id=true;cycle:=(timezone('America/Sao_Paulo',now())::date-extract(dow from timezone('America/Sao_Paulo',now()))::integer);purchase_limit:=case when target_kingdom=c.kingdom then cfg.weekly_purchase_limit else 6 end;
 select coalesce(sum(percent),0)into already from public.v2_kingdom_resource_purchases where buyer_kingdom=c.kingdom and beneficiary_kingdom=target_kingdom and resource=p_resource and cycle_start=cycle;if already+p_percent>purchase_limit then raise exception'Limite semanal desta área excedido';end if;
 select*into s from public.v2_kingdom_states where kingdom=target_kingdom for update;if s.kingdom is null then raise exception'Reino beneficiário inválido';end if;current_value:=case p_resource when'infrastructure'then s.infrastructure when'provisions'then s.provisions when'arsenal'then s.arsenal else s.livestock end;if current_value+p_percent>100 then raise exception'Essa compra ultrapassa 100%%';end if;
 cost_per:=case p_resource when'infrastructure'then cfg.infrastructure_cost when'provisions'then cfg.provisions_cost when'arsenal'then cfg.arsenal_cost else cfg.livestock_cost end;cost:=cost_per*p_percent;update public.v2_kingdom_states set treasury=treasury-cost where kingdom=c.kingdom and treasury>=cost;if not found then raise exception'Fundo Real insuficiente';end if;
 update public.v2_kingdom_states set infrastructure=case when p_resource='infrastructure'then infrastructure+p_percent else infrastructure end,provisions=case when p_resource='provisions'then provisions+p_percent else provisions end,arsenal=case when p_resource='arsenal'then arsenal+p_percent else arsenal end,livestock=case when p_resource='livestock'then livestock+p_percent else livestock end where kingdom=target_kingdom;
 insert into public.v2_kingdom_resource_purchases(buyer_kingdom,beneficiary_kingdom,resource,percent,cost,cycle_start,purchased_by)values(c.kingdom,target_kingdom,p_resource,p_percent,cost,cycle,c.id);return jsonb_build_object('resource',p_resource,'percent',p_percent,'cost',cost,'beneficiary',target_kingdom);end; $$;

create or replace function public.v2_propose_peace(p_character_id uuid,p_recipient text)
returns uuid language plpgsql security definer set search_path='' as $$ declare c public.v2_characters;rid uuid;begin perform public.v2_process_kingdom_cycles();select*into c from public.v2_characters where id=p_character_id and user_id=(select auth.uid());if c.id is null or not exists(select 1 from public.v2_kingdom_leadership where character_id=c.id and office='monarch')then raise exception'Somente o monarca pode propor paz';end if;if p_recipient=c.kingdom or not exists(select 1 from public.v2_kingdom_states where kingdom=p_recipient)then raise exception'Reino inválido';end if;if exists(select 1 from public.v2_kingdom_peace_agreements where active and kingdom_one=least(c.kingdom,p_recipient)and kingdom_two=greatest(c.kingdom,p_recipient))then raise exception'Os reinos já possuem acordo de paz';end if;insert into public.v2_kingdom_peace_proposals(proposer_kingdom,recipient_kingdom,proposed_by)values(c.kingdom,p_recipient,c.id)returning id into rid;return rid;end; $$;
create or replace function public.v2_respond_peace(p_character_id uuid,p_proposal uuid,p_accept boolean)
returns boolean language plpgsql security definer set search_path='' as $$ declare c public.v2_characters;p public.v2_kingdom_peace_proposals;begin perform public.v2_process_kingdom_cycles();select*into c from public.v2_characters where id=p_character_id and user_id=(select auth.uid());select*into p from public.v2_kingdom_peace_proposals where id=p_proposal for update;if p.id is null or p.status<>'pending'or p.recipient_kingdom<>c.kingdom or not exists(select 1 from public.v2_kingdom_leadership where character_id=c.id and office='monarch')then raise exception'Proposta indisponível';end if;update public.v2_kingdom_peace_proposals set status=case when p_accept then'accepted'else'declined'end,responded_by=c.id,responded_at=now()where id=p.id;if p_accept then insert into public.v2_kingdom_peace_agreements(kingdom_one,kingdom_two,active,ended_at)values(least(p.proposer_kingdom,p.recipient_kingdom),greatest(p.proposer_kingdom,p.recipient_kingdom),true,null)on conflict(kingdom_one,kingdom_two)do update set active=true,created_at=now(),ended_at=null;end if;return p_accept;end; $$;

create or replace function public.v2_start_crown_vote(p_character_id uuid,p_office text)
returns uuid language plpgsql security definer set search_path='' as $$ declare c public.v2_characters;vid uuid;begin perform public.v2_process_kingdom_cycles();if p_office not in('monarch','realm_councilor','war_councilor')then raise exception'Cargo inválido';end if;select*into c from public.v2_characters where id=p_character_id and user_id=(select auth.uid());if c.id is null then raise exception'Personagem inválido';end if;if not exists(select 1 from public.v2_kingdom_leadership where kingdom=c.kingdom and office=p_office)then raise exception'Esse cargo está vago';end if;insert into public.v2_crown_votes(kingdom,office,initiated_by)values(c.kingdom,p_office,c.id)returning id into vid;insert into public.v2_crown_vote_ballots(vote_id,character_id,choice)values(vid,c.id,true);return vid;end; $$;
create or replace function public.v2_cast_crown_vote(p_character_id uuid,p_vote uuid,p_choice boolean)
returns jsonb language plpgsql security definer set search_path='' as $$ declare c public.v2_characters;v public.v2_crown_votes;yes_count integer;resident_count integer;begin perform public.v2_process_kingdom_cycles();select*into c from public.v2_characters where id=p_character_id and user_id=(select auth.uid());select*into v from public.v2_crown_votes where id=p_vote for update;if c.id is null or v.id is null or v.status<>'active'or v.kingdom<>c.kingdom then raise exception'Votação indisponível';end if;insert into public.v2_crown_vote_ballots(vote_id,character_id,choice)values(v.id,c.id,p_choice)on conflict(vote_id,character_id)do update set choice=excluded.choice,created_at=now();select count(*)into yes_count from public.v2_crown_vote_ballots where vote_id=v.id and choice;select count(*)into resident_count from public.v2_characters where kingdom=v.kingdom;if yes_count>resident_count/2 then update public.v2_crown_votes set status='passed',resolved_at=now()where id=v.id;delete from public.v2_kingdom_leadership where kingdom=v.kingdom and office=v.office;end if;return jsonb_build_object('yes',yes_count,'residents',resident_count,'passed',yes_count>resident_count/2);end; $$;

create or replace function public.v2_admin_set_kingdom_economy(p_monarch_salary bigint,p_realm_salary bigint,p_war_salary bigint,p_infrastructure_drain integer,p_provisions_drain integer,p_arsenal_drain integer,p_livestock_drain integer,p_infrastructure_cost bigint,p_provisions_cost bigint,p_arsenal_cost bigint,p_livestock_cost bigint,p_weekly_limit integer)
returns void language plpgsql security definer set search_path='' as $$ begin if not public.v2_is_admin()then raise exception'Acesso administrativo necessário';end if;if least(p_monarch_salary,p_realm_salary,p_war_salary,p_infrastructure_cost,p_provisions_cost,p_arsenal_cost,p_livestock_cost)<0 or p_weekly_limit not between 1 and 100 or least(p_infrastructure_drain,p_provisions_drain,p_arsenal_drain,p_livestock_drain)<0 or greatest(p_infrastructure_drain,p_provisions_drain,p_arsenal_drain,p_livestock_drain)>100 then raise exception'Configuração inválida';end if;update public.v2_kingdom_economy_config set monarch_salary=p_monarch_salary,realm_councilor_salary=p_realm_salary,war_councilor_salary=p_war_salary,infrastructure_drain=p_infrastructure_drain,provisions_drain=p_provisions_drain,arsenal_drain=p_arsenal_drain,livestock_drain=p_livestock_drain,infrastructure_cost=p_infrastructure_cost,provisions_cost=p_provisions_cost,arsenal_cost=p_arsenal_cost,livestock_cost=p_livestock_cost,weekly_purchase_limit=p_weekly_limit,updated_at=now()where id;end; $$;
create or replace function public.v2_admin_get_kingdom_economy()returns jsonb language plpgsql security definer set search_path='' as $$ begin if not public.v2_is_admin()then raise exception'Acesso administrativo necessário';end if;return(select to_jsonb(c)from public.v2_kingdom_economy_config c where id);end; $$;

create or replace function public.v2_get_kingdom_expansion(p_character_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.v2_characters;s public.v2_kingdom_states;cfg public.v2_kingdom_economy_config;own_office text;
begin perform public.v2_process_kingdom_cycles();select*into c from public.v2_characters where id=p_character_id and user_id=(select auth.uid());if c.id is null then raise exception'Personagem inválido';end if;select*into s from public.v2_kingdom_states where kingdom=c.kingdom;select*into cfg from public.v2_kingdom_economy_config where id;select office into own_office from public.v2_kingdom_leadership where character_id=c.id;
 return jsonb_build_object('treasury',s.treasury,'resources',jsonb_build_array(
  jsonb_build_object('key','infrastructure','value',s.infrastructure,'drain',cfg.infrastructure_drain,'cost',cfg.infrastructure_cost,'penalty','Abaixo de 60% reduz todas as recompensas em 1% por ponto faltante.'),
  jsonb_build_object('key','provisions','value',s.provisions,'drain',cfg.provisions_drain,'cost',cfg.provisions_cost,'penalty','Abaixo de 60% reduz ainda mais o XP recebido.'),
  jsonb_build_object('key','arsenal','value',s.arsenal,'drain',cfg.arsenal_drain,'cost',cfg.arsenal_cost,'penalty','Abaixo de 60% aumenta exponencialmente os preços da Loja.'),
  jsonb_build_object('key','livestock','value',s.livestock,'drain',cfg.livestock_drain,'cost',cfg.livestock_cost,'penalty','Abaixo de 60% reduz ainda mais o WG recebido.')),
  'weeklyLimit',cfg.weekly_purchase_limit,'ownOffice',own_office,'salaries',jsonb_build_object('monarch',cfg.monarch_salary,'realm_councilor',cfg.realm_councilor_salary,'war_councilor',cfg.war_councilor_salary),
  'peaceProposals',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'proposer',p.proposer_kingdom,'recipient',p.recipient_kingdom,'status',p.status,'expiresAt',p.expires_at))from public.v2_kingdom_peace_proposals p where c.kingdom in(p.proposer_kingdom,p.recipient_kingdom)and(p.status='pending'or p.responded_at>now()-interval'30 days')),'[]'::jsonb),
  'peaceAgreements',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'kingdom',case when a.kingdom_one=c.kingdom then a.kingdom_two else a.kingdom_one end,'createdAt',a.created_at))from public.v2_kingdom_peace_agreements a where a.active and c.kingdom in(a.kingdom_one,a.kingdom_two)),'[]'::jsonb),
  'wars',coalesce((select jsonb_agg(jsonb_build_object('id',w.id,'attacker',w.attacker_kingdom,'defender',w.defender_kingdom,'expiresAt',w.expires_at))from public.v2_kingdom_wars w where w.status='pending'and c.kingdom in(w.attacker_kingdom,w.defender_kingdom)),'[]'::jsonb),
  'votes',coalesce((select jsonb_agg(jsonb_build_object('id',v.id,'office',v.office,'expiresAt',v.expires_at,'yes',(select count(*)from public.v2_crown_vote_ballots b where b.vote_id=v.id and b.choice),'no',(select count(*)from public.v2_crown_vote_ballots b where b.vote_id=v.id and not b.choice),'residents',(select count(*)from public.v2_characters x where x.kingdom=c.kingdom),'ownChoice',(select b.choice from public.v2_crown_vote_ballots b where b.vote_id=v.id and b.character_id=c.id)))from public.v2_crown_votes v where v.kingdom=c.kingdom and v.status='active'),'[]'::jsonb));
end; $$;

create or replace function public.v2_buy_kingdom_star(p_character_id uuid,p_area text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.v2_characters;s public.v2_kingdom_states;current_stars integer;next_star integer;cost bigint;from_treasury bigint;from_monarch bigint;
begin if p_area not in('requested','market','defense','army')then raise exception'Área inválida';end if;select*into c from public.v2_characters where id=p_character_id and user_id=(select auth.uid())for update;if c.id is null or not exists(select 1 from public.v2_kingdom_leadership where character_id=c.id and office='monarch')then raise exception'Somente o monarca pode comprar estrelas';end if;select*into s from public.v2_kingdom_states where kingdom=c.kingdom for update;current_stars:=case p_area when'requested'then s.requested_stars when'market'then s.market_stars when'defense'then s.defense_stars else s.army_stars end;if current_stars>=5 then raise exception'Nível máximo';end if;next_star:=current_stars+1;cost:=public.v2_kingdom_star_cost(next_star);from_treasury:=least(s.treasury,cost);from_monarch:=cost-from_treasury;if c.gold<from_monarch then raise exception'Fundo Real e WG do monarca são insuficientes';end if;update public.v2_kingdom_states set treasury=treasury-from_treasury,requested_stars=case when p_area='requested'then next_star else requested_stars end,market_stars=case when p_area='market'then next_star else market_stars end,defense_stars=case when p_area='defense'then next_star else defense_stars end,army_stars=case when p_area='army'then next_star else army_stars end where kingdom=c.kingdom;update public.v2_characters set gold=gold-from_monarch where id=c.id;return jsonb_build_object('cost',cost,'fromTreasury',from_treasury,'fromMonarch',from_monarch);end; $$;

create or replace function public.v2_respond_kingdom_war(p_character_id uuid,p_war_id uuid,p_response text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.v2_characters;w public.v2_kingdom_wars;a public.v2_kingdom_states;d public.v2_kingdom_states;ascore int;dscore int;ares int;dres int;av int;dv int;winner text;loser text;
begin perform public.v2_process_kingdom_cycles();if p_response not in('surrender','fight')then raise exception'Resposta inválida';end if;select*into c from public.v2_characters where id=p_character_id and user_id=(select auth.uid());select*into w from public.v2_kingdom_wars where id=p_war_id for update;if w.id is null or w.status<>'pending'or c.kingdom<>w.defender_kingdom or not exists(select 1 from public.v2_kingdom_leadership where character_id=c.id and office='monarch')then raise exception'Guerra indisponível';end if;if p_response='surrender'then winner:=w.attacker_kingdom;loser:=w.defender_kingdom;update public.v2_characters set gold=floor(gold*.5)where kingdom=loser;update public.v2_kingdom_states set penalty_until=now()+interval'7 days',reward_penalty_percent=30,shop_markup_percent=0 where kingdom=loser;update public.v2_kingdom_wars set status='surrendered',winner_kingdom=winner,loser_kingdom=loser,responded_by=c.id,resolved_at=now()where id=w.id;else select*into a from public.v2_kingdom_states where kingdom=w.attacker_kingdom for update;select*into d from public.v2_kingdom_states where kingdom=w.defender_kingdom for update;ascore:=a.army_stars+a.defense_stars;dscore:=d.army_stars+d.defense_stars;ares:=a.infrastructure+a.provisions+a.arsenal+a.livestock;dres:=d.infrastructure+d.provisions+d.arsenal+d.livestock;select count(*)into av from public.v2_characters where kingdom=w.attacker_kingdom and level>50;select count(*)into dv from public.v2_characters where kingdom=w.defender_kingdom and level>50;if ascore>dscore or(ascore=dscore and ares>dres)or(ascore=dscore and ares=dres and av>dv)then winner:=w.attacker_kingdom;loser:=w.defender_kingdom;else winner:=w.defender_kingdom;loser:=w.attacker_kingdom;end if;update public.v2_characters set gold=0 where kingdom=loser;update public.v2_kingdom_states set requested_stars=0,market_stars=0,defense_stars=0,army_stars=0,penalty_until=now()+interval'7 days',reward_penalty_percent=0,shop_markup_percent=50 where kingdom=loser;update public.v2_kingdom_wars set status=case when winner=attacker_kingdom then'attacker_won'else'defender_won'end,winner_kingdom=winner,loser_kingdom=loser,attacker_score=ascore,defender_score=dscore,attacker_veterans=av,defender_veterans=dv,responded_by=c.id,resolved_at=now()where id=w.id;end if;return jsonb_build_object('winner',winner,'loser',loser);end; $$;

revoke all on function public.v2_process_kingdom_cycles(),public.v2_get_kingdom_expansion(uuid),public.v2_donate_to_kingdom(uuid,bigint),public.v2_buy_kingdom_resource(uuid,text,integer,text),public.v2_propose_peace(uuid,text),public.v2_respond_peace(uuid,uuid,boolean),public.v2_start_crown_vote(uuid,text),public.v2_cast_crown_vote(uuid,uuid,boolean),public.v2_admin_set_kingdom_economy(bigint,bigint,bigint,integer,integer,integer,integer,bigint,bigint,bigint,bigint,integer),public.v2_admin_get_kingdom_economy() from public,anon;
grant execute on function public.v2_get_kingdom_expansion(uuid),public.v2_donate_to_kingdom(uuid,bigint),public.v2_buy_kingdom_resource(uuid,text,integer,text),public.v2_propose_peace(uuid,text),public.v2_respond_peace(uuid,uuid,boolean),public.v2_start_crown_vote(uuid,text),public.v2_cast_crown_vote(uuid,uuid,boolean),public.v2_admin_set_kingdom_economy(bigint,bigint,bigint,integer,integer,integer,integer,bigint,bigint,bigint,bigint,integer),public.v2_admin_get_kingdom_economy() to authenticated;

commit;
