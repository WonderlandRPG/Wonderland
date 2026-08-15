begin;

update public.v2_kingdom_economy_config
set weekly_purchase_limit = 30,
    updated_at = now()
where id = true;

create or replace function public.v2_buy_kingdom_resource(
  p_character_id uuid,
  p_resource text,
  p_percent integer,
  p_beneficiary text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.v2_characters;
  cfg public.v2_kingdom_economy_config;
  s public.v2_kingdom_states;
  target_kingdom text;
  cost_per bigint;
  cost bigint;
  already integer;
  current_value integer;
  cycle date;
  purchase_limit integer;
begin
  perform public.v2_process_kingdom_cycles();
  if p_resource not in ('infrastructure','provisions','arsenal','livestock')
     or p_percent < 1 or p_percent > 30 then
    raise exception 'Compra inválida';
  end if;

  select * into c
  from public.v2_characters
  where id = p_character_id and user_id = (select auth.uid());

  if c.id is null or not exists(
    select 1 from public.v2_kingdom_leadership
    where character_id = c.id and office = 'monarch'
  ) then
    raise exception 'Somente o Rei ou a Rainha pode comprar recursos' using errcode = '42501';
  end if;

  target_kingdom := coalesce(nullif(p_beneficiary,''), c.kingdom);
  if target_kingdom <> c.kingdom and not exists(
    select 1 from public.v2_kingdom_peace_agreements
    where active
      and kingdom_one = least(c.kingdom,target_kingdom)
      and kingdom_two = greatest(c.kingdom,target_kingdom)
  ) then
    raise exception 'Esse reino não possui acordo de paz ativo';
  end if;

  select * into cfg from public.v2_kingdom_economy_config where id = true;
  cycle := timezone('America/Sao_Paulo',now())::date
    - extract(dow from timezone('America/Sao_Paulo',now()))::integer;
  purchase_limit := case when target_kingdom = c.kingdom then cfg.weekly_purchase_limit else 6 end;

  select coalesce(sum(percent),0) into already
  from public.v2_kingdom_resource_purchases
  where buyer_kingdom = c.kingdom
    and beneficiary_kingdom = target_kingdom
    and cycle_start = cycle;

  if already + p_percent > purchase_limit then
    raise exception 'Restam apenas %%% deste orçamento semanal', greatest(0,purchase_limit-already);
  end if;

  select * into s from public.v2_kingdom_states where kingdom = target_kingdom for update;
  if s.kingdom is null then raise exception 'Reino beneficiário inválido'; end if;
  current_value := case p_resource
    when 'infrastructure' then s.infrastructure
    when 'provisions' then s.provisions
    when 'arsenal' then s.arsenal
    else s.livestock
  end;
  if current_value + p_percent > 100 then raise exception 'Essa compra ultrapassa 100%%'; end if;

  cost_per := case p_resource
    when 'infrastructure' then cfg.infrastructure_cost
    when 'provisions' then cfg.provisions_cost
    when 'arsenal' then cfg.arsenal_cost
    else cfg.livestock_cost
  end;
  cost := cost_per * p_percent;

  update public.v2_kingdom_states
  set treasury = treasury - cost
  where kingdom = c.kingdom and treasury >= cost;
  if not found then raise exception 'Fundo Real insuficiente'; end if;

  update public.v2_kingdom_states
  set infrastructure = case when p_resource='infrastructure' then infrastructure+p_percent else infrastructure end,
      provisions = case when p_resource='provisions' then provisions+p_percent else provisions end,
      arsenal = case when p_resource='arsenal' then arsenal+p_percent else arsenal end,
      livestock = case when p_resource='livestock' then livestock+p_percent else livestock end
  where kingdom = target_kingdom;

  insert into public.v2_kingdom_resource_purchases(
    buyer_kingdom,beneficiary_kingdom,resource,percent,cost,cycle_start,purchased_by
  ) values(c.kingdom,target_kingdom,p_resource,p_percent,cost,cycle,c.id);

  return jsonb_build_object(
    'resource',p_resource,
    'percent',p_percent,
    'cost',cost,
    'beneficiary',target_kingdom,
    'weeklyRemaining',purchase_limit-already-p_percent
  );
end;
$$;

create or replace function public.v2_admin_set_kingdom_resources(
  p_kingdom text,
  p_infrastructure integer,
  p_provisions integer,
  p_arsenal integer,
  p_livestock integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.v2_is_admin() then raise exception 'Acesso administrativo necessário'; end if;
  if least(p_infrastructure,p_provisions,p_arsenal,p_livestock) < 0
     or greatest(p_infrastructure,p_provisions,p_arsenal,p_livestock) > 100 then
    raise exception 'Os recursos precisam estar entre 0%% e 100%%';
  end if;
  update public.v2_kingdom_states
  set infrastructure = p_infrastructure,
      provisions = p_provisions,
      arsenal = p_arsenal,
      livestock = p_livestock,
      updated_at = now(),
      updated_by = (select auth.uid())
  where kingdom = p_kingdom;
  if not found then raise exception 'Reino inválido'; end if;
  insert into public.v2_admin_history(actor_id,action,target_type,target_id,details)
  values(
    (select auth.uid()),
    'kingdom.resources_updated',
    'kingdom',
    p_kingdom,
    jsonb_build_object(
      'infrastructure',p_infrastructure,
      'provisions',p_provisions,
      'arsenal',p_arsenal,
      'livestock',p_livestock
    )
  );
end;
$$;

revoke all on function public.v2_admin_set_kingdom_resources(text,integer,integer,integer,integer)
from public,anon;
grant execute on function public.v2_admin_set_kingdom_resources(text,integer,integer,integer,integer)
to authenticated;

commit;
