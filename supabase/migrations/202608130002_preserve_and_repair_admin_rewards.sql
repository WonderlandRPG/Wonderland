-- Preserva itens já concedidos e repara entregas registradas no console administrativo.

alter table public.v2_character_inventory
  drop constraint if exists v2_character_inventory_item_id_fkey;

alter table public.v2_character_inventory
  add constraint v2_character_inventory_item_id_fkey
  foreign key (item_id) references public.v2_shop_items(id) on delete restrict;

insert into public.v2_shop_items(
  slug,name,description,category,price,slot,rarity,attributes,two_handed,
  sort_order,special_effects,active
)
values (
  'titulo-desperto-de-wonderland',
  'Desperto de Wonderland',
  'Concedido àqueles que atenderam ao chamado quando Wonderland despertou novamente.',
  'Título',0,'title','awakened',
  '{"FOR":10,"DEF":10,"RES":10,"INI":10,"INT":10,"ARC":10}'::jsonb,
  false,99999,'[]'::jsonb,false
)
on conflict (slug) do update set
  name=excluded.name,
  description=excluded.description,
  category=excluded.category,
  price=excluded.price,
  slot=excluded.slot,
  rarity=excluded.rarity,
  attributes=excluded.attributes,
  two_handed=excluded.two_handed,
  special_effects=excluded.special_effects,
  active=excluded.active,
  updated_at=now();

with reward_events as (
  select
    details->>'target' as target_name,
    details->>'reward' as reward_name,
    greatest(1,coalesce((details->>'amount')::integer,1)) as amount
  from public.v2_admin_history
  where action='reward.granted'
    and details->>'type' in ('item','titulo')
), expected as (
  select
    character.id as character_id,
    item.id as item_id,
    sum(event.amount)::integer as quantity
  from reward_events event
  join public.v2_characters character
    on lower(event.target_name)='todos'
    or lower(character.name)=lower(event.target_name)
  join lateral (
    select candidate.id
    from public.v2_shop_items candidate
    where lower(candidate.name)=lower(event.reward_name)
    order by candidate.created_at, candidate.id
    limit 1
  ) item on true
  group by character.id,item.id
)
insert into public.v2_character_inventory(character_id,item_id,quantity)
select character_id,item_id,quantity from expected
on conflict(character_id,item_id) do update set
  quantity=greatest(public.v2_character_inventory.quantity,excluded.quantity),
  updated_at=now();
