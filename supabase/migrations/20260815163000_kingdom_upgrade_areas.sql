begin;
alter table public.v2_kingdom_states add column if not exists academy_stars smallint not null default 0 check (academy_stars between 0 and 5);
alter table public.v2_kingdom_states add column if not exists market_stars smallint not null default 0 check (market_stars between 0 and 5);

create or replace function public.v2_kingdom_reward_multiplier(p_kingdom text,p_reward_type text)
returns numeric language sql stable security definer set search_path='' as $$
 select 1+coalesce((select requested_stars*.10+case when p_reward_type='xp' then academy_stars*.05 when p_reward_type='wg' then market_stars*.05 else 0 end from public.v2_kingdom_states where kingdom=p_kingdom),0);
$$;

create or replace function public.v2_get_current_kingdom(p_character_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare chosen public.v2_characters; state public.v2_kingdom_states; own_office text;
begin
 select * into chosen from public.v2_characters where id=p_character_id and user_id=(select auth.uid());
 if chosen.id is null or not exists(select 1 from public.v2_active_characters where user_id=(select auth.uid()) and character_id=chosen.id) then raise exception 'Selecione um personagem ativo válido' using errcode='42501'; end if;
 select * into state from public.v2_kingdom_states where kingdom=chosen.kingdom;
 select office into own_office from public.v2_kingdom_leadership where character_id=chosen.id;
 return jsonb_build_object('kingdom',chosen.kingdom,'characterId',chosen.id,'characterGold',chosen.gold,'ownOffice',own_office,'areas',jsonb_build_array(
 jsonb_build_object('key','requested','stars',state.requested_stars,'bonusPercent',state.requested_stars*10,'nextStarCost',public.v2_kingdom_star_cost(state.requested_stars+1)),
 jsonb_build_object('key','academy','stars',state.academy_stars,'bonusPercent',state.academy_stars*5,'nextStarCost',public.v2_kingdom_star_cost(state.academy_stars+1)),
 jsonb_build_object('key','market','stars',state.market_stars,'bonusPercent',state.market_stars*5,'nextStarCost',public.v2_kingdom_star_cost(state.market_stars+1))),
 'leadership',coalesce((select jsonb_agg(jsonb_build_object('office',l.office,'characterId',c.id,'userId',c.user_id,'name',c.name,'level',c.level,'rank',c.adventure_rank,'imageUrl',c.image_url) order by case l.office when 'monarch' then 1 when 'realm_councilor' then 2 else 3 end) from public.v2_kingdom_leadership l join public.v2_characters c on c.id=l.character_id where l.kingdom=chosen.kingdom),'[]'::jsonb));
end; $$;

drop function if exists public.v2_buy_kingdom_star(uuid);
create function public.v2_buy_kingdom_star(p_character_id uuid,p_area text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare chosen public.v2_characters; state public.v2_kingdom_states; current_stars integer; next_star integer; cost bigint;
begin
 if p_area not in ('requested','academy','market') then raise exception 'Área de melhoria inválida'; end if;
 select * into chosen from public.v2_characters where id=p_character_id and user_id=(select auth.uid()) for update;
 if chosen.id is null or not exists(select 1 from public.v2_active_characters where user_id=(select auth.uid()) and character_id=chosen.id) then raise exception 'Selecione seu personagem ativo' using errcode='42501'; end if;
 if not exists(select 1 from public.v2_kingdom_leadership where kingdom=chosen.kingdom and office='monarch' and character_id=chosen.id) then raise exception 'Somente o Rei ou a Rainha deste reino pode comprar estrelas' using errcode='42501'; end if;
 select * into state from public.v2_kingdom_states where kingdom=chosen.kingdom for update;
 current_stars:=case p_area when 'requested' then state.requested_stars when 'academy' then state.academy_stars else state.market_stars end;
 if current_stars>=5 then raise exception 'Esta melhoria já possui cinco estrelas'; end if;
 next_star:=current_stars+1; cost:=public.v2_kingdom_star_cost(next_star);
 if chosen.gold<cost then raise exception 'WG insuficiente para a próxima estrela'; end if;
 update public.v2_characters set gold=gold-cost,updated_at=now() where id=chosen.id;
 update public.v2_kingdom_states set requested_stars=case when p_area='requested' then next_star else requested_stars end,academy_stars=case when p_area='academy' then next_star else academy_stars end,market_stars=case when p_area='market' then next_star else market_stars end,updated_at=now(),updated_by=(select auth.uid()) where kingdom=chosen.kingdom;
 insert into public.v2_admin_history(actor_id,action,target_type,target_id,details) values((select auth.uid()),'kingdom.star_purchased','kingdom',chosen.kingdom,jsonb_build_object('area',p_area,'star',next_star,'cost',cost,'character_id',chosen.id));
 return jsonb_build_object('kingdom',chosen.kingdom,'area',p_area,'stars',next_star,'cost',cost,'remainingGold',chosen.gold-cost);
end; $$;

create or replace function public.v2_admin_set_kingdom_stars(p_kingdom text,p_area text,p_stars integer)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.v2_is_admin() then raise exception 'Acesso administrativo necessário' using errcode='42501'; end if;
 if p_area not in ('requested','academy','market') or p_stars not between 0 and 5 then raise exception 'Área ou quantidade de estrelas inválida'; end if;
 update public.v2_kingdom_states set requested_stars=case when p_area='requested' then p_stars else requested_stars end,academy_stars=case when p_area='academy' then p_stars else academy_stars end,market_stars=case when p_area='market' then p_stars else market_stars end,updated_at=now(),updated_by=(select auth.uid()) where kingdom=p_kingdom;
 if not found then raise exception 'Reino inválido'; end if;
 insert into public.v2_admin_history(actor_id,action,target_type,target_id,details) values((select auth.uid()),'kingdom.stars_updated','kingdom',p_kingdom,jsonb_build_object('area',p_area,'stars',p_stars));
end; $$;

revoke all on function public.v2_kingdom_reward_multiplier(text,text),public.v2_get_current_kingdom(uuid),public.v2_buy_kingdom_star(uuid,text),public.v2_admin_set_kingdom_stars(text,text,integer) from public,anon;
grant execute on function public.v2_get_current_kingdom(uuid),public.v2_buy_kingdom_star(uuid,text),public.v2_admin_set_kingdom_stars(text,text,integer) to authenticated;
revoke execute on function public.v2_kingdom_reward_multiplier(text,text) from authenticated;
commit;
