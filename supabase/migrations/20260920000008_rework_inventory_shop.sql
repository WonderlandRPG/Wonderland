-- Item 6 do Rework: inventário, armazenamento, loja, histórico e conversão final dos itens.

create table if not exists public.v2_rework_economy_backups (
  character_id uuid primary key,
  gold bigint not null,
  inventory jsonb not null,
  captured_at timestamptz not null default now()
);

alter table public.v2_rework_economy_backups enable row level security;
revoke all on table public.v2_rework_economy_backups from public, anon, authenticated;

insert into public.v2_rework_economy_backups(character_id, gold, inventory)
select
  character.id,
  character.gold,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'inventory_id', inventory.id,
      'item_id', inventory.item_id,
      'quantity', inventory.quantity,
      'equipped_slot', inventory.equipped_slot,
      'equipped_slots', inventory.equipped_slots
    ) order by inventory.id)
    from public.v2_character_inventory inventory
    where inventory.character_id = character.id
  ), '[]'::jsonb)
from public.v2_characters character
on conflict (character_id) do nothing;

-- ARC deixou de existir no modelo oficial. O valor dos itens é preservado como HP.
update public.v2_shop_items
set
  name = regexp_replace(name, '\mARC\M', 'HP', 'g'),
  description = regexp_replace(description, '\mARC\M', 'HP', 'g'),
  attributes = (attributes - 'ARC') || case
    when attributes ? 'ARC' then jsonb_build_object(
      'HP', coalesce((attributes ->> 'HP')::numeric, 0) + coalesce((attributes ->> 'ARC')::numeric, 0)
    )
    else '{}'::jsonb
  end,
  special_effects = coalesce((
    select jsonb_agg(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            effect,
            '{name}',
            to_jsonb(regexp_replace(coalesce(effect ->> 'name', ''), '\mARC\M', 'HP', 'g')),
            true
          ),
          '{description}', to_jsonb(regexp_replace(coalesce(effect ->> 'description', ''), '\mARC\M', 'HP', 'g')), true
        ),
        '{modifiers}',
        (coalesce(effect -> 'modifiers', '{}'::jsonb) - 'ARC') || case
          when coalesce(effect -> 'modifiers', '{}'::jsonb) ? 'ARC' then jsonb_build_object(
            'HP',
            coalesce((effect -> 'modifiers' ->> 'HP')::numeric, 0) +
            coalesce((effect -> 'modifiers' ->> 'ARC')::numeric, 0)
          )
          else '{}'::jsonb
        end,
        true
      ) order by ordinal
    )
    from jsonb_array_elements(special_effects) with ordinality as effects(effect, ordinal)
  ), '[]'::jsonb),
  updated_at = now()
where attributes ? 'ARC'
   or special_effects::text ~ '\mARC\M'
   or name ~ '\mARC\M'
   or description ~ '\mARC\M';

alter table public.v2_shop_items drop constraint if exists v2_shop_items_rework_attributes;
alter table public.v2_shop_items add constraint v2_shop_items_rework_attributes check (
  attributes - 'FOR' - 'INT' - 'DEF' - 'RES' - 'HP' - 'INI' = '{}'::jsonb
  and special_effects::text !~ '\mARC\M'
  and name !~ '\mARC\M'
  and description !~ '\mARC\M'
);

alter table public.v2_character_inventory
  add column if not exists location text not null default 'bag';
alter table public.v2_character_inventory
  drop constraint if exists v2_character_inventory_location_check;
alter table public.v2_character_inventory
  add constraint v2_character_inventory_location_check check (location in ('bag', 'storage'));
alter table public.v2_character_inventory
  add constraint v2_character_inventory_storage_unequipped check (
    location = 'bag' or equipped_slot is null and cardinality(equipped_slots) = 0
  );

create table if not exists public.v2_shop_transactions (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.v2_characters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('purchase', 'sale')),
  item_id uuid references public.v2_shop_items(id) on delete set null,
  item_name text not null,
  rarity text not null,
  quantity integer not null check (quantity > 0),
  unit_price bigint not null check (unit_price >= 0),
  total bigint not null check (total >= 0),
  balance_after bigint not null check (balance_after >= 0),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists v2_shop_transactions_character_created_idx
  on public.v2_shop_transactions(character_id, created_at desc);
alter table public.v2_shop_transactions enable row level security;
revoke all on table public.v2_shop_transactions from public, anon, authenticated;
grant select on table public.v2_shop_transactions to authenticated;
create policy "shop transactions owner read" on public.v2_shop_transactions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "shop transactions admin read" on public.v2_shop_transactions
  for select to authenticated using (public.v2_is_admin());

create or replace function public.v2_set_inventory_location(p_inventory_id uuid, p_location text)
returns public.v2_character_inventory
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result public.v2_character_inventory;
  owner_id uuid;
begin
  if p_location not in ('bag', 'storage') then
    raise exception 'Destino inválido' using errcode = '23514';
  end if;
  select character.user_id into owner_id
  from public.v2_character_inventory inventory
  join public.v2_characters character on character.id = inventory.character_id
  where inventory.id = p_inventory_id for update of inventory;
  if owner_id is null then raise exception 'Item não encontrado' using errcode = 'P0002'; end if;
  if owner_id <> (select auth.uid()) then raise exception 'Acesso negado' using errcode = '42501'; end if;
  if p_location = 'storage' and exists (
    select 1 from public.v2_character_inventory
    where id = p_inventory_id and (equipped_slot is not null or cardinality(equipped_slots) > 0)
  ) then raise exception 'Desequipe o item antes de armazenar' using errcode = '23514'; end if;
  update public.v2_character_inventory
  set location = p_location, updated_at = now()
  where id = p_inventory_id returning * into result;
  return result;
end
$$;

-- Mantém as regras do Item 5 e impede equipar diretamente do armazém.
create or replace function public.v2_equip_inventory_item(p_inventory_id uuid, p_slot text)
returns public.v2_character_inventory
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  inventory_row public.v2_character_inventory; chosen uuid; owner_id uuid; item_slot text;
  item_two_handed boolean; owned_quantity integer; repeatable_item boolean; item_location text;
begin
  select inventory.character_id, character.user_id, item.slot, item.two_handed, inventory.quantity, inventory.location
  into chosen, owner_id, item_slot, item_two_handed, owned_quantity, item_location
  from public.v2_character_inventory inventory
  join public.v2_characters character on character.id = inventory.character_id
  join public.v2_shop_items item on item.id = inventory.item_id
  where inventory.id = p_inventory_id;
  if chosen is null then raise exception 'Item não encontrado' using errcode = 'P0002'; end if;
  if owner_id <> (select auth.uid()) then raise exception 'Acesso negado' using errcode = '42501'; end if;
  if item_location <> 'bag' then raise exception 'Mova o item para a mochila antes de equipar' using errcode = '23514'; end if;
  if p_slot not in ('head','torso','hands','legs','feet','main_weapon','off_weapon','necklace','ring_1','ring_2','earring_1','earring_2','cape','title') then raise exception 'Espaço de equipamento inválido' using errcode = '23514'; end if;
  if not (item_slot = p_slot or item_slot = 'ring' and p_slot in ('ring_1','ring_2') or item_slot = 'earring' and p_slot in ('earring_1','earring_2') or item_slot in ('main_weapon','off_weapon') and p_slot in ('main_weapon','off_weapon')) then raise exception 'Item incompatível com o espaço' using errcode = '23514'; end if;
  repeatable_item := item_slot in ('ring','earring') or item_slot in ('main_weapon','off_weapon') and not item_two_handed;
  update public.v2_character_inventory set equipped_slots=array_remove(equipped_slots,p_slot),equipped_slot=(array_remove(equipped_slots,p_slot))[1],updated_at=now() where character_id=chosen and p_slot=any(equipped_slots);
  if p_slot in ('main_weapon','off_weapon') and item_two_handed then
    update public.v2_character_inventory set equipped_slots='{}',equipped_slot=null,updated_at=now() where character_id=chosen and equipped_slots && array['main_weapon','off_weapon'];
  elsif p_slot in ('main_weapon','off_weapon') then
    update public.v2_character_inventory inventory set equipped_slots='{}',equipped_slot=null,updated_at=now() from public.v2_shop_items item where inventory.character_id=chosen and inventory.item_id=item.id and inventory.equipped_slots && array['main_weapon','off_weapon'] and item.two_handed;
  end if;
  update public.v2_character_inventory set equipped_slots=case when repeatable_item then array_append(array_remove(equipped_slots,p_slot),p_slot) else array[p_slot] end,equipped_slot=case when repeatable_item and cardinality(equipped_slots)>0 then equipped_slots[1] else p_slot end,updated_at=now()
  where id=p_inventory_id and (not repeatable_item or p_slot=any(equipped_slots) or cardinality(equipped_slots)<owned_quantity) returning * into inventory_row;
  if inventory_row.id is null then raise exception 'Você precisa possuir outra cópia deste item' using errcode = '23514'; end if;
  return inventory_row;
end
$$;

create or replace function public.v2_buy_shop_item(p_item_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare item public.v2_shop_items; chosen public.v2_characters; balance bigint; final_price bigint; final_balance bigint;
begin
  select c.* into chosen from public.v2_active_characters ac join public.v2_characters c on c.id=ac.character_id where ac.user_id=(select auth.uid());
  if chosen.id is null then raise exception 'Selecione um personagem antes de comprar'; end if;
  select * into item from public.v2_shop_items where id=p_item_id and active;
  if item.id is null then raise exception 'Item indisponível'; end if;
  final_price:=greatest(1,round(item.price*public.v2_kingdom_shop_multiplier(chosen.kingdom)));
  select gold into balance from public.v2_characters where id=chosen.id and user_id=(select auth.uid()) for update;
  if balance<final_price then raise exception 'WG insuficiente'; end if;
  final_balance:=balance-final_price;
  update public.v2_characters set gold=final_balance,updated_at=now() where id=chosen.id;
  insert into public.v2_character_inventory(character_id,item_id,location) values(chosen.id,item.id,'bag') on conflict(character_id,item_id) do update set quantity=public.v2_character_inventory.quantity+1,location='bag',updated_at=now();
  insert into public.v2_shop_transactions(character_id,user_id,transaction_type,item_id,item_name,rarity,quantity,unit_price,total,balance_after,metadata)
  values(chosen.id,(select auth.uid()),'purchase',item.id,item.name,item.rarity,1,final_price,final_price,final_balance,jsonb_build_object('source','single'));
end $$;

create or replace function public.v2_buy_shop_cart(p_item_ids uuid[])
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare chosen public.v2_characters; balance bigint; total bigint; invalid_count integer; entry record; multiplier numeric; final_balance bigint;
begin
  if coalesce(cardinality(p_item_ids),0)<1 or cardinality(p_item_ids)>50 then raise exception 'Carrinho inválido'; end if;
  select c.* into chosen from public.v2_active_characters ac join public.v2_characters c on c.id=ac.character_id where ac.user_id=(select auth.uid());
  if chosen.id is null then raise exception 'Selecione um personagem antes de comprar'; end if;
  select count(*) into invalid_count from unnest(p_item_ids) requested(id) left join public.v2_shop_items item on item.id=requested.id and item.active where item.id is null;
  if invalid_count>0 then raise exception 'Um item do carrinho está indisponível'; end if;
  multiplier:=public.v2_kingdom_shop_multiplier(chosen.kingdom);
  select coalesce(sum(greatest(1,round(item.price*multiplier))),0) into total from unnest(p_item_ids) requested(id) join public.v2_shop_items item on item.id=requested.id and item.active;
  select gold into balance from public.v2_characters where id=chosen.id and user_id=(select auth.uid()) for update;
  if balance<total then raise exception 'WG insuficiente'; end if;
  final_balance:=balance-total;
  update public.v2_characters set gold=final_balance,updated_at=now() where id=chosen.id;
  for entry in select item.*,count(*)::integer quantity,greatest(1,round(item.price*multiplier))::bigint final_price from unnest(p_item_ids) requested(id) join public.v2_shop_items item on item.id=requested.id group by item.id loop
    insert into public.v2_character_inventory(character_id,item_id,quantity,location) values(chosen.id,entry.id,entry.quantity,'bag') on conflict(character_id,item_id) do update set quantity=public.v2_character_inventory.quantity+excluded.quantity,location='bag',updated_at=now();
    insert into public.v2_shop_transactions(character_id,user_id,transaction_type,item_id,item_name,rarity,quantity,unit_price,total,balance_after,metadata)
    values(chosen.id,(select auth.uid()),'purchase',entry.id,entry.name,entry.rarity,entry.quantity,entry.final_price,entry.final_price*entry.quantity,final_balance,jsonb_build_object('source','cart'));
  end loop;
  return jsonb_build_object('total',total,'quantity',cardinality(p_item_ids),'balance',final_balance);
end $$;

create or replace function public.v2_sell_inventory_item(p_inventory_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare inventory_row public.v2_character_inventory; item_row public.v2_shop_items; owner_id uuid; sale_value bigint; final_balance bigint;
begin
  select inventory.* into inventory_row from public.v2_character_inventory inventory where inventory.id=p_inventory_id for update;
  if inventory_row.id is null then raise exception 'Item não encontrado'; end if;
  select user_id into owner_id from public.v2_characters where id=inventory_row.character_id for update;
  if owner_id is distinct from (select auth.uid()) then raise exception 'Acesso negado'; end if;
  if inventory_row.equipped_slot is not null or cardinality(inventory_row.equipped_slots)>0 then raise exception 'Desequipe o item antes de vender'; end if;
  select * into item_row from public.v2_shop_items where id=inventory_row.item_id;
  if item_row.id is null or item_row.slot='title' or item_row.price<=0 then raise exception 'Este item não pode ser vendido'; end if;
  sale_value:=floor(item_row.price::numeric/3)::bigint;
  if inventory_row.quantity>1 then update public.v2_character_inventory set quantity=quantity-1,updated_at=now() where id=inventory_row.id; else delete from public.v2_character_inventory where id=inventory_row.id; end if;
  update public.v2_characters set gold=gold+sale_value,updated_at=now() where id=inventory_row.character_id returning gold into final_balance;
  insert into public.v2_shop_transactions(character_id,user_id,transaction_type,item_id,item_name,rarity,quantity,unit_price,total,balance_after,metadata)
  values(inventory_row.character_id,(select auth.uid()),'sale',item_row.id,item_row.name,item_row.rarity,1,sale_value,sale_value,final_balance,jsonb_build_object('source_location',inventory_row.location));
  return jsonb_build_object('wg',sale_value,'item',item_row.name,'remaining',greatest(0,inventory_row.quantity-1),'balance',final_balance);
end $$;

revoke all on function public.v2_set_inventory_location(uuid,text), public.v2_equip_inventory_item(uuid,text), public.v2_buy_shop_item(uuid), public.v2_buy_shop_cart(uuid[]), public.v2_sell_inventory_item(uuid) from public, anon;
grant execute on function public.v2_set_inventory_location(uuid,text), public.v2_equip_inventory_item(uuid,text), public.v2_buy_shop_item(uuid), public.v2_buy_shop_cart(uuid[]), public.v2_sell_inventory_item(uuid) to authenticated;

comment on table public.v2_rework_economy_backups is 'Snapshot privado de WG e inventário antes do Item 6.';
comment on table public.v2_shop_transactions is 'Histórico imutável de compras e vendas da loja do Rework.';
