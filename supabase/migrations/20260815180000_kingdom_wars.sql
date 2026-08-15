begin;

alter table public.v2_kingdom_states drop column if exists academy_stars;
alter table public.v2_kingdom_states add column if not exists defense_stars smallint not null default 0 check (defense_stars between 0 and 5);
alter table public.v2_kingdom_states add column if not exists army_stars smallint not null default 0 check (army_stars between 0 and 5);
alter table public.v2_kingdom_states add column if not exists penalty_until timestamptz;
alter table public.v2_kingdom_states add column if not exists reward_penalty_percent smallint not null default 0 check (reward_penalty_percent between 0 and 100);
alter table public.v2_kingdom_states add column if not exists shop_markup_percent smallint not null default 0 check (shop_markup_percent between 0 and 100);

create table if not exists public.v2_kingdom_wars(
 id uuid primary key default gen_random_uuid(),
 attacker_kingdom text not null references public.v2_kingdom_states(kingdom),
 defender_kingdom text not null references public.v2_kingdom_states(kingdom),
 status text not null default 'pending' check(status in('pending','surrendered','attacker_won','defender_won')),
 winner_kingdom text references public.v2_kingdom_states(kingdom),
 loser_kingdom text references public.v2_kingdom_states(kingdom),
 attacker_score integer, defender_score integer, attacker_veterans integer, defender_veterans integer,
 declared_by uuid not null references public.v2_characters(id), responded_by uuid references public.v2_characters(id),
 declared_at timestamptz not null default now(), resolved_at timestamptz,
 check(attacker_kingdom<>defender_kingdom)
);
alter table public.v2_kingdom_wars enable row level security;
revoke all on public.v2_kingdom_wars from public,anon,authenticated;
grant select on public.v2_kingdom_wars to authenticated;
drop policy if exists "kingdom residents read wars" on public.v2_kingdom_wars;
create policy "kingdom residents read wars" on public.v2_kingdom_wars for select to authenticated using(exists(select 1 from public.v2_characters c where c.user_id=(select auth.uid()) and c.kingdom in(attacker_kingdom,defender_kingdom)));

create or replace function public.v2_kingdom_reward_multiplier(p_kingdom text)
returns numeric language sql stable security definer set search_path='' as $$
 select greatest(0,1+coalesce((select requested_stars*.10-case when penalty_until>now() then reward_penalty_percent*.01 else 0 end from public.v2_kingdom_states where kingdom=p_kingdom),0));
$$;
create or replace function public.v2_kingdom_reward_multiplier(p_kingdom text,p_reward_type text)
returns numeric language sql stable security definer set search_path='' as $$ select public.v2_kingdom_reward_multiplier(p_kingdom); $$;
create or replace function public.v2_kingdom_shop_multiplier(p_kingdom text)
returns numeric language sql stable security definer set search_path='' as $$
 select greatest(.01,1+coalesce((select -market_stars*.03+case when penalty_until>now() then shop_markup_percent*.01 else 0 end from public.v2_kingdom_states where kingdom=p_kingdom),0));
$$;

create or replace function public.v2_get_current_kingdom(p_character_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare chosen public.v2_characters; state public.v2_kingdom_states; own_office text;
begin
 select * into chosen from public.v2_characters where id=p_character_id and user_id=(select auth.uid());
 if chosen.id is null or not exists(select 1 from public.v2_active_characters where user_id=(select auth.uid()) and character_id=chosen.id) then raise exception 'Selecione um personagem ativo válido' using errcode='42501'; end if;
 select * into state from public.v2_kingdom_states where kingdom=chosen.kingdom;
 select office into own_office from public.v2_kingdom_leadership where character_id=chosen.id;
 return jsonb_build_object('kingdom',chosen.kingdom,'characterId',chosen.id,'characterGold',chosen.gold,'ownOffice',own_office,
 'areas',jsonb_build_array(
 jsonb_build_object('key','requested','stars',state.requested_stars,'bonusPercent',state.requested_stars*10,'nextStarCost',public.v2_kingdom_star_cost(state.requested_stars+1)),
 jsonb_build_object('key','market','stars',state.market_stars,'bonusPercent',state.market_stars*3,'nextStarCost',public.v2_kingdom_star_cost(state.market_stars+1)),
 jsonb_build_object('key','defense','stars',state.defense_stars,'bonusPercent',0,'nextStarCost',public.v2_kingdom_star_cost(state.defense_stars+1)),
 jsonb_build_object('key','army','stars',state.army_stars,'bonusPercent',0,'nextStarCost',public.v2_kingdom_star_cost(state.army_stars+1))),
 'penalty',case when state.penalty_until>now() then jsonb_build_object('until',state.penalty_until,'rewardPercent',state.reward_penalty_percent,'shopPercent',state.shop_markup_percent) else null end,
 'wars',coalesce((select jsonb_agg(jsonb_build_object('id',w.id,'attacker',w.attacker_kingdom,'defender',w.defender_kingdom,'status',w.status,'declaredAt',w.declared_at,'winner',w.winner_kingdom,'loser',w.loser_kingdom) order by w.declared_at desc) from public.v2_kingdom_wars w where chosen.kingdom in(w.attacker_kingdom,w.defender_kingdom) and (w.status='pending' or w.resolved_at>now()-interval '30 days')),'[]'::jsonb),
 'leadership',coalesce((select jsonb_agg(jsonb_build_object('office',l.office,'characterId',c.id,'userId',c.user_id,'name',c.name,'level',c.level,'rank',c.adventure_rank,'imageUrl',c.image_url) order by case l.office when 'monarch' then 1 when 'realm_councilor' then 2 else 3 end) from public.v2_kingdom_leadership l join public.v2_characters c on c.id=l.character_id where l.kingdom=chosen.kingdom),'[]'::jsonb));
end; $$;

create or replace function public.v2_buy_kingdom_star(p_character_id uuid,p_area text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare chosen public.v2_characters; state public.v2_kingdom_states; current_stars integer; next_star integer; cost bigint;
begin
 if p_area not in('requested','market','defense','army') then raise exception 'Área de melhoria inválida'; end if;
 select * into chosen from public.v2_characters where id=p_character_id and user_id=(select auth.uid()) for update;
 if chosen.id is null or not exists(select 1 from public.v2_active_characters where user_id=(select auth.uid()) and character_id=chosen.id) then raise exception 'Selecione seu personagem ativo' using errcode='42501'; end if;
 if not exists(select 1 from public.v2_kingdom_leadership where kingdom=chosen.kingdom and office='monarch' and character_id=chosen.id) then raise exception 'Somente o Rei ou a Rainha deste reino pode comprar estrelas' using errcode='42501'; end if;
 select * into state from public.v2_kingdom_states where kingdom=chosen.kingdom for update;
 current_stars:=case p_area when'requested'then state.requested_stars when'market'then state.market_stars when'defense'then state.defense_stars else state.army_stars end;
 if current_stars>=5 then raise exception 'Esta melhoria já possui cinco estrelas'; end if;
 next_star:=current_stars+1;cost:=public.v2_kingdom_star_cost(next_star);if chosen.gold<cost then raise exception 'WG insuficiente para a próxima estrela';end if;
 update public.v2_characters set gold=gold-cost,updated_at=now() where id=chosen.id;
 update public.v2_kingdom_states set requested_stars=case when p_area='requested'then next_star else requested_stars end,market_stars=case when p_area='market'then next_star else market_stars end,defense_stars=case when p_area='defense'then next_star else defense_stars end,army_stars=case when p_area='army'then next_star else army_stars end,updated_at=now(),updated_by=(select auth.uid()) where kingdom=chosen.kingdom;
 return jsonb_build_object('area',p_area,'stars',next_star,'cost',cost,'remainingGold',chosen.gold-cost);
end; $$;

create or replace function public.v2_admin_set_kingdom_stars(p_kingdom text,p_area text,p_stars integer)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.v2_is_admin() then raise exception 'Acesso administrativo necessário' using errcode='42501';end if;
 if p_area not in('requested','market','defense','army') or p_stars not between 0 and 5 then raise exception 'Área ou estrelas inválidas';end if;
 update public.v2_kingdom_states set requested_stars=case when p_area='requested'then p_stars else requested_stars end,market_stars=case when p_area='market'then p_stars else market_stars end,defense_stars=case when p_area='defense'then p_stars else defense_stars end,army_stars=case when p_area='army'then p_stars else army_stars end,updated_at=now(),updated_by=(select auth.uid()) where kingdom=p_kingdom;
 if not found then raise exception 'Reino inválido';end if;
end; $$;

create or replace function public.v2_declare_kingdom_war(p_character_id uuid,p_defender text)
returns uuid language plpgsql security definer set search_path='' as $$
declare chosen public.v2_characters; war_id uuid;
begin
 select * into chosen from public.v2_characters where id=p_character_id and user_id=(select auth.uid());
 if chosen.id is null or not exists(select 1 from public.v2_active_characters where user_id=(select auth.uid()) and character_id=chosen.id) then raise exception 'Personagem ativo inválido' using errcode='42501';end if;
 if not exists(select 1 from public.v2_kingdom_leadership where character_id=chosen.id and office='monarch')then raise exception 'Somente o Rei ou a Rainha pode declarar guerra' using errcode='42501';end if;
 if p_defender=chosen.kingdom or not exists(select 1 from public.v2_kingdom_states where kingdom=p_defender)then raise exception 'Reino adversário inválido';end if;
 perform pg_advisory_xact_lock(hashtext(least(chosen.kingdom,p_defender)),hashtext(greatest(chosen.kingdom,p_defender)));
 if exists(select 1 from public.v2_kingdom_wars where status='pending' and (chosen.kingdom in(attacker_kingdom,defender_kingdom) or p_defender in(attacker_kingdom,defender_kingdom)))then raise exception 'Um dos reinos já possui uma guerra pendente';end if;
 insert into public.v2_kingdom_wars(attacker_kingdom,defender_kingdom,declared_by)values(chosen.kingdom,p_defender,chosen.id)returning id into war_id;return war_id;
end; $$;

create or replace function public.v2_respond_kingdom_war(p_character_id uuid,p_war_id uuid,p_response text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare chosen public.v2_characters; war public.v2_kingdom_wars; a public.v2_kingdom_states;d public.v2_kingdom_states;ascore int;dscore int;av int;dv int;winner text;loser text;
begin
 if p_response not in('surrender','fight')then raise exception 'Resposta inválida';end if;
 select * into chosen from public.v2_characters where id=p_character_id and user_id=(select auth.uid());
 if chosen.id is null or not exists(select 1 from public.v2_active_characters where user_id=(select auth.uid()) and character_id=chosen.id)then raise exception 'Personagem ativo inválido' using errcode='42501';end if;
 select * into war from public.v2_kingdom_wars where id=p_war_id for update;
 if war.id is null or war.status<>'pending'then raise exception 'Esta guerra já foi respondida';end if;
 if chosen.kingdom<>war.defender_kingdom or not exists(select 1 from public.v2_kingdom_leadership where character_id=chosen.id and office='monarch')then raise exception 'Somente o Rei ou a Rainha do reino atacado pode responder' using errcode='42501';end if;
 if p_response='surrender'then
  winner:=war.attacker_kingdom;loser:=war.defender_kingdom;
  update public.v2_characters set gold=floor(gold*.5),updated_at=now()where kingdom=loser;
  update public.v2_kingdom_states set penalty_until=now()+interval'7 days',reward_penalty_percent=30,shop_markup_percent=0 where kingdom=loser;
  update public.v2_kingdom_wars set status='surrendered',winner_kingdom=winner,loser_kingdom=loser,responded_by=chosen.id,resolved_at=now()where id=war.id;
 else
  select * into a from public.v2_kingdom_states where kingdom=war.attacker_kingdom for update;select * into d from public.v2_kingdom_states where kingdom=war.defender_kingdom for update;
  ascore:=a.army_stars+a.defense_stars;dscore:=d.army_stars+d.defense_stars;
  select count(*) into av from public.v2_characters where kingdom=war.attacker_kingdom and level>50;select count(*) into dv from public.v2_characters where kingdom=war.defender_kingdom and level>50;
  if ascore>dscore or(ascore=dscore and av>dv)then winner:=war.attacker_kingdom;loser:=war.defender_kingdom;else winner:=war.defender_kingdom;loser:=war.attacker_kingdom;end if;
  update public.v2_characters set gold=0,updated_at=now()where kingdom=loser;
  update public.v2_kingdom_states set requested_stars=0,market_stars=0,defense_stars=0,army_stars=0,penalty_until=now()+interval'7 days',reward_penalty_percent=0,shop_markup_percent=50 where kingdom=loser;
  update public.v2_kingdom_wars set status=case when winner=attacker_kingdom then'attacker_won'else'defender_won'end,winner_kingdom=winner,loser_kingdom=loser,attacker_score=ascore,defender_score=dscore,attacker_veterans=av,defender_veterans=dv,responded_by=chosen.id,resolved_at=now()where id=war.id;
 end if;
 return jsonb_build_object('winner',winner,'loser',loser,'response',p_response);
end; $$;

create or replace function public.v2_buy_shop_item(p_item_id uuid)returns void language plpgsql security definer set search_path='public' as $$
declare item public.v2_shop_items;chosen public.v2_characters;balance bigint;final_price bigint;
begin select c.* into chosen from public.v2_active_characters ac join public.v2_characters c on c.id=ac.character_id where ac.user_id=(select auth.uid());if chosen.id is null then raise exception'Selecione um personagem antes de comprar';end if;select*into item from public.v2_shop_items where id=p_item_id and active;if item.id is null then raise exception'Item indisponível';end if;final_price:=greatest(1,round(item.price*public.v2_kingdom_shop_multiplier(chosen.kingdom)));select gold into balance from public.v2_characters where id=chosen.id and user_id=(select auth.uid())for update;if balance<final_price then raise exception'WG insuficiente';end if;update public.v2_characters set gold=gold-final_price,updated_at=now()where id=chosen.id;insert into public.v2_character_inventory(character_id,item_id)values(chosen.id,item.id)on conflict(character_id,item_id)do update set quantity=public.v2_character_inventory.quantity+1,updated_at=now();end;$$;

create or replace function public.v2_buy_shop_cart(p_item_ids uuid[])returns jsonb language plpgsql security definer set search_path='public' as $$
declare chosen public.v2_characters;balance bigint;total bigint;invalid_count integer;entry record;multiplier numeric;
begin if coalesce(cardinality(p_item_ids),0)<1 or cardinality(p_item_ids)>50 then raise exception'Carrinho inválido';end if;select c.*into chosen from public.v2_active_characters ac join public.v2_characters c on c.id=ac.character_id where ac.user_id=(select auth.uid());if chosen.id is null then raise exception'Selecione um personagem antes de comprar';end if;select count(*)into invalid_count from unnest(p_item_ids)requested(id)left join public.v2_shop_items item on item.id=requested.id and item.active where item.id is null;if invalid_count>0 then raise exception'Um item do carrinho está indisponível';end if;multiplier:=public.v2_kingdom_shop_multiplier(chosen.kingdom);select greatest(1,round(coalesce(sum(item.price),0)*multiplier))into total from unnest(p_item_ids)requested(id)join public.v2_shop_items item on item.id=requested.id and item.active;select gold into balance from public.v2_characters where id=chosen.id and user_id=(select auth.uid())for update;if balance<total then raise exception'WG insuficiente';end if;update public.v2_characters set gold=gold-total,updated_at=now()where id=chosen.id;for entry in select id,count(*)::integer quantity from unnest(p_item_ids)requested(id)group by id loop insert into public.v2_character_inventory(character_id,item_id,quantity)values(chosen.id,entry.id,entry.quantity)on conflict(character_id,item_id)do update set quantity=public.v2_character_inventory.quantity+excluded.quantity,updated_at=now();end loop;return jsonb_build_object('total',total,'quantity',cardinality(p_item_ids));end;$$;

revoke all on function public.v2_kingdom_shop_multiplier(text),public.v2_declare_kingdom_war(uuid,text),public.v2_respond_kingdom_war(uuid,uuid,text) from public,anon;
grant execute on function public.v2_declare_kingdom_war(uuid,text),public.v2_respond_kingdom_war(uuid,uuid,text) to authenticated;
revoke execute on function public.v2_kingdom_shop_multiplier(text) from authenticated;
commit;
