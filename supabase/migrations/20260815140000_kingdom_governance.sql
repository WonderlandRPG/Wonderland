begin;

create table if not exists public.v2_kingdom_states (
  kingdom text primary key check (kingdom in ('aokigahara','darkya','oymyakon','lesedi','namida','skypiece')),
  requested_stars smallint not null default 0 check (requested_stars between 0 and 5),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.v2_kingdom_states(kingdom)
values ('aokigahara'),('darkya'),('oymyakon'),('lesedi'),('namida'),('skypiece')
on conflict (kingdom) do nothing;

create table if not exists public.v2_kingdom_leadership (
  kingdom text not null references public.v2_kingdom_states(kingdom) on delete cascade,
  office text not null check (office in ('monarch','realm_councilor','war_councilor')),
  character_id uuid not null references public.v2_characters(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (kingdom, office),
  unique (character_id)
);

alter table public.v2_kingdom_states enable row level security;
alter table public.v2_kingdom_leadership enable row level security;

drop policy if exists "kingdom states authenticated read" on public.v2_kingdom_states;
create policy "kingdom states authenticated read" on public.v2_kingdom_states
for select to authenticated using (true);
drop policy if exists "kingdom leadership authenticated read" on public.v2_kingdom_leadership;
create policy "kingdom leadership authenticated read" on public.v2_kingdom_leadership
for select to authenticated using (true);

revoke all on public.v2_kingdom_states, public.v2_kingdom_leadership from public, anon, authenticated;
grant select on public.v2_kingdom_states, public.v2_kingdom_leadership to authenticated;

create or replace function public.v2_kingdom_star_cost(p_next_star integer)
returns bigint language sql immutable set search_path='' as $$
  select case p_next_star when 1 then 250000 when 2 then 1000000 when 3 then 5000000
    when 4 then 25000000 when 5 then 100000000 else null end;
$$;

create or replace function public.v2_kingdom_reward_multiplier(p_kingdom text)
returns numeric language sql stable security definer set search_path='' as $$
  select 1 + coalesce((select requested_stars from public.v2_kingdom_states where kingdom=p_kingdom),0) * 0.10;
$$;

create or replace function public.v2_get_current_kingdom(p_character_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare chosen public.v2_characters; state public.v2_kingdom_states; own_office text;
begin
  select * into chosen from public.v2_characters
  where id=p_character_id and user_id=(select auth.uid());
  if chosen.id is null or not exists(select 1 from public.v2_active_characters where user_id=(select auth.uid()) and character_id=chosen.id) then
    raise exception 'Selecione um personagem ativo válido' using errcode='42501';
  end if;
  select * into state from public.v2_kingdom_states where kingdom=chosen.kingdom;
  select office into own_office from public.v2_kingdom_leadership where character_id=chosen.id;
  return jsonb_build_object(
    'kingdom',chosen.kingdom,'characterId',chosen.id,'characterGold',chosen.gold,
    'stars',coalesce(state.requested_stars,0),'bonusPercent',coalesce(state.requested_stars,0)*10,
    'nextStarCost',public.v2_kingdom_star_cost(coalesce(state.requested_stars,0)+1),
    'ownOffice',own_office,
    'leadership',coalesce((select jsonb_agg(jsonb_build_object(
      'office',l.office,'characterId',c.id,'userId',c.user_id,'name',c.name,'level',c.level,
      'rank',c.adventure_rank,'imageUrl',c.image_url
    ) order by case l.office when 'monarch' then 1 when 'realm_councilor' then 2 else 3 end)
    from public.v2_kingdom_leadership l join public.v2_characters c on c.id=l.character_id
    where l.kingdom=chosen.kingdom),'[]'::jsonb)
  );
end;
$$;

create or replace function public.v2_buy_kingdom_star(p_character_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare chosen public.v2_characters; state public.v2_kingdom_states; cost bigint; next_star integer;
begin
  select * into chosen from public.v2_characters where id=p_character_id and user_id=(select auth.uid()) for update;
  if chosen.id is null or not exists(select 1 from public.v2_active_characters where user_id=(select auth.uid()) and character_id=chosen.id) then
    raise exception 'Selecione seu personagem ativo' using errcode='42501';
  end if;
  if not exists(select 1 from public.v2_kingdom_leadership where kingdom=chosen.kingdom and office='monarch' and character_id=chosen.id) then
    raise exception 'Somente o Rei ou a Rainha deste reino pode comprar estrelas' using errcode='42501';
  end if;
  select * into state from public.v2_kingdom_states where kingdom=chosen.kingdom for update;
  if state.requested_stars>=5 then raise exception 'O Reino Requisitado já possui cinco estrelas'; end if;
  next_star:=state.requested_stars+1; cost:=public.v2_kingdom_star_cost(next_star);
  if chosen.gold<cost then raise exception 'WG insuficiente para a próxima estrela'; end if;
  update public.v2_characters set gold=gold-cost,updated_at=now() where id=chosen.id;
  update public.v2_kingdom_states set requested_stars=next_star,updated_at=now(),updated_by=(select auth.uid()) where kingdom=chosen.kingdom;
  insert into public.v2_admin_history(actor_id,action,target_type,target_id,details)
  values((select auth.uid()),'kingdom.star_purchased','kingdom',chosen.kingdom,jsonb_build_object('star',next_star,'cost',cost,'character_id',chosen.id));
  return jsonb_build_object('kingdom',chosen.kingdom,'stars',next_star,'bonusPercent',next_star*10,'cost',cost,'remainingGold',chosen.gold-cost,'nextStarCost',public.v2_kingdom_star_cost(next_star+1));
end;
$$;

create or replace function public.v2_admin_set_kingdom_office(p_kingdom text,p_office text,p_character_id uuid default null)
returns void language plpgsql security definer set search_path='' as $$
declare chosen public.v2_characters;
begin
  if not public.v2_is_admin() then raise exception 'Acesso administrativo necessário' using errcode='42501'; end if;
  if p_kingdom not in ('aokigahara','darkya','oymyakon','lesedi','namida','skypiece') or p_office not in ('monarch','realm_councilor','war_councilor') then
    raise exception 'Reino ou cargo inválido' using errcode='22023';
  end if;
  delete from public.v2_kingdom_leadership where kingdom=p_kingdom and office=p_office;
  if p_character_id is not null then
    select * into chosen from public.v2_characters where id=p_character_id;
    if chosen.id is null or chosen.kingdom<>p_kingdom then raise exception 'O personagem precisa pertencer ao reino selecionado'; end if;
    delete from public.v2_kingdom_leadership where character_id=p_character_id;
    insert into public.v2_kingdom_leadership(kingdom,office,character_id,assigned_by) values(p_kingdom,p_office,p_character_id,(select auth.uid()));
  end if;
  insert into public.v2_admin_history(actor_id,action,target_type,target_id,details)
  values((select auth.uid()),'kingdom.office_updated','kingdom',p_kingdom,jsonb_build_object('office',p_office,'character_id',p_character_id));
end;
$$;

revoke all on function public.v2_kingdom_star_cost(integer), public.v2_kingdom_reward_multiplier(text),
  public.v2_get_current_kingdom(uuid), public.v2_buy_kingdom_star(uuid),
  public.v2_admin_set_kingdom_office(text,text,uuid) from public, anon;
grant execute on function public.v2_get_current_kingdom(uuid), public.v2_buy_kingdom_star(uuid) to authenticated;
grant execute on function public.v2_admin_set_kingdom_office(text,text,uuid) to authenticated;
revoke execute on function public.v2_kingdom_star_cost(integer), public.v2_kingdom_reward_multiplier(text) from authenticated;

commit;
