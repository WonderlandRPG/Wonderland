-- Item 5 do Rework: catálogo canônico, conversão preservada e regras de equipamento.

create table if not exists public.v2_rework_item_backups (
  item_id uuid primary key,
  slot text not null,
  rarity text not null,
  attributes jsonb not null,
  special_effects jsonb not null,
  two_handed boolean not null,
  captured_at timestamptz not null default now()
);

create table if not exists public.v2_rework_equipment_backups (
  inventory_id uuid primary key,
  equipped_slot text,
  equipped_slots text[] not null,
  captured_at timestamptz not null default now()
);

alter table public.v2_rework_item_backups enable row level security;
alter table public.v2_rework_equipment_backups enable row level security;
revoke all on table public.v2_rework_item_backups from public, anon, authenticated;
revoke all on table public.v2_rework_equipment_backups from public, anon, authenticated;

insert into public.v2_rework_item_backups (
  item_id, slot, rarity, attributes, special_effects, two_handed
)
select id, slot, rarity, attributes, special_effects, two_handed
from public.v2_shop_items
on conflict (item_id) do nothing;

insert into public.v2_rework_equipment_backups (
  inventory_id, equipped_slot, equipped_slots
)
select id, equipped_slot, equipped_slots
from public.v2_character_inventory
on conflict (inventory_id) do nothing;

update public.v2_shop_items
set
  slot = case lower(slot)
    when 'weapon' then 'main_weapon'
    when 'shield' then 'off_weapon'
    when 'chest' then 'torso'
    when 'body' then 'torso'
    when 'pants' then 'legs'
    when 'boots' then 'feet'
    when 'amulet' then 'necklace'
    when 'cloak' then 'cape'
    else lower(slot)
  end,
  rarity = case lower(rarity)
    when 'normal' then 'common'
    when 'comum' then 'common'
    when 'incomum' then 'uncommon'
    when 'raro' then 'rare'
    when 'épico' then 'epic'
    when 'epico' then 'epic'
    when 'lendário' then 'legendary'
    when 'lendario' then 'legendary'
    when 'mítico' then 'mythic'
    when 'mitico' then 'mythic'
    else lower(rarity)
  end,
  attributes = case when jsonb_typeof(attributes) = 'object' then attributes else '{}'::jsonb end,
  special_effects = case
    when jsonb_typeof(special_effects) = 'array' then special_effects
    else '[]'::jsonb
  end,
  two_handed = two_handed and lower(slot) in ('weapon', 'main_weapon', 'off_weapon'),
  updated_at = now();

create or replace function public.v2_normalize_equipment_slot(p_slot text, p_item_slot text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case lower(p_slot)
    when 'weapon' then 'main_weapon'
    when 'shield' then 'off_weapon'
    when 'chest' then 'torso'
    when 'body' then 'torso'
    when 'pants' then 'legs'
    when 'boots' then case when p_item_slot = 'legs' then 'legs' else 'feet' end
    when 'feet' then case when p_item_slot = 'legs' then 'legs' else 'feet' end
    when 'amulet' then 'necklace'
    when 'cloak' then 'cape'
    when 'ring' then 'ring_1'
    when 'earring' then 'earring_1'
    else lower(p_slot)
  end
$$;

create or replace function public.v2_normalize_equipment_slots(
  p_slots text[],
  p_legacy_slot text,
  p_item_slot text,
  p_quantity integer
)
returns text[]
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  source_slots text[] := case
    when cardinality(coalesce(p_slots, '{}'::text[])) > 0 then p_slots
    when p_legacy_slot is not null then array[p_legacy_slot]
    else '{}'::text[]
  end;
  result_slots text[] := '{}'::text[];
  source_slot text;
  normalized_slot text;
  compatible boolean;
begin
  foreach source_slot in array source_slots loop
    normalized_slot := public.v2_normalize_equipment_slot(source_slot, p_item_slot);
    compatible := normalized_slot in (
      'head','torso','hands','legs','feet','main_weapon','off_weapon','necklace',
      'ring_1','ring_2','earring_1','earring_2','cape','title'
    ) and (
      normalized_slot = p_item_slot
      or p_item_slot = 'ring' and normalized_slot in ('ring_1','ring_2')
      or p_item_slot = 'earring' and normalized_slot in ('earring_1','earring_2')
      or p_item_slot in ('main_weapon','off_weapon')
        and normalized_slot in ('main_weapon','off_weapon')
    );
    if compatible
      and not normalized_slot = any(result_slots)
      and cardinality(result_slots) < greatest(1, p_quantity)
    then
      result_slots := array_append(result_slots, normalized_slot);
    end if;
  end loop;
  return result_slots;
end
$$;

revoke execute on function public.v2_normalize_equipment_slot(text, text) from public, anon, authenticated;
revoke execute on function public.v2_normalize_equipment_slots(text[], text, text, integer) from public, anon, authenticated;

with normalized as (
  select
    inventory.id,
    public.v2_normalize_equipment_slots(
      inventory.equipped_slots,
      inventory.equipped_slot,
      item.slot,
      inventory.quantity
    ) as slots
  from public.v2_character_inventory inventory
  join public.v2_shop_items item on item.id = inventory.item_id
)
update public.v2_character_inventory inventory
set
  equipped_slots = normalized.slots,
  equipped_slot = normalized.slots[1],
  updated_at = now()
from normalized
where normalized.id = inventory.id;

alter table public.v2_shop_items drop constraint if exists v2_shop_items_slot_check;
alter table public.v2_shop_items add constraint v2_shop_items_slot_check check (
  slot in (
    'head','torso','hands','legs','feet','main_weapon','off_weapon','necklace',
    'ring','earring','cape','title'
  )
);

alter table public.v2_shop_items drop constraint if exists v2_shop_items_rarity_check;
alter table public.v2_shop_items add constraint v2_shop_items_rarity_check check (
  rarity in ('common','uncommon','rare','epic','legendary','mythic')
  or slot = 'title' and rarity = 'awakened'
);

alter table public.v2_shop_items drop constraint if exists v2_shop_items_special_effects_array;
alter table public.v2_shop_items add constraint v2_shop_items_special_effects_array check (
  jsonb_typeof(special_effects) = 'array'
);
alter table public.v2_shop_items add constraint v2_shop_items_attributes_object check (
  jsonb_typeof(attributes) = 'object'
);
alter table public.v2_shop_items add constraint v2_shop_items_two_handed_weapon check (
  not two_handed or slot in ('main_weapon','off_weapon')
);

alter table public.v2_character_inventory
  drop constraint if exists v2_character_inventory_equipped_slot_check;
alter table public.v2_character_inventory
  add constraint v2_character_inventory_equipped_slot_check check (
    equipped_slot is null or equipped_slot in (
      'head','torso','hands','legs','feet','main_weapon','off_weapon','necklace',
      'ring_1','ring_2','earring_1','earring_2','cape','title'
    )
  );

alter table public.v2_character_inventory
  drop constraint if exists v2_character_inventory_equipped_slots_check;
alter table public.v2_character_inventory
  add constraint v2_character_inventory_equipped_slots_check check (
    equipped_slots <@ array[
      'head','torso','hands','legs','feet','main_weapon','off_weapon','necklace',
      'ring_1','ring_2','earring_1','earring_2','cape','title'
    ]::text[]
    and cardinality(equipped_slots) <= quantity
    and equipped_slot is not distinct from equipped_slots[1]
  );

create or replace function public.v2_equip_inventory_item(p_inventory_id uuid, p_slot text)
returns public.v2_character_inventory
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inventory_row public.v2_character_inventory;
  chosen uuid;
  owner_id uuid;
  item_slot text;
  item_two_handed boolean;
  owned_quantity integer;
  repeatable_item boolean;
begin
  select inventory.character_id, character.user_id, item.slot, item.two_handed, inventory.quantity
  into chosen, owner_id, item_slot, item_two_handed, owned_quantity
  from public.v2_character_inventory inventory
  join public.v2_characters character on character.id = inventory.character_id
  join public.v2_shop_items item on item.id = inventory.item_id
  where inventory.id = p_inventory_id;

  if chosen is null then raise exception 'Item não encontrado' using errcode = 'P0002'; end if;
  if owner_id <> (select auth.uid()) then raise exception 'Acesso negado' using errcode = '42501'; end if;
  if p_slot not in (
    'head','torso','hands','legs','feet','main_weapon','off_weapon','necklace',
    'ring_1','ring_2','earring_1','earring_2','cape','title'
  ) then raise exception 'Espaço de equipamento inválido' using errcode = '23514'; end if;
  if not (
    item_slot = p_slot
    or item_slot = 'ring' and p_slot in ('ring_1','ring_2')
    or item_slot = 'earring' and p_slot in ('earring_1','earring_2')
    or item_slot in ('main_weapon','off_weapon') and p_slot in ('main_weapon','off_weapon')
  ) then raise exception 'Item incompatível com o espaço' using errcode = '23514'; end if;

  repeatable_item := item_slot in ('ring','earring')
    or item_slot in ('main_weapon','off_weapon') and not item_two_handed;

  update public.v2_character_inventory
  set
    equipped_slots = array_remove(equipped_slots, p_slot),
    equipped_slot = (array_remove(equipped_slots, p_slot))[1],
    updated_at = now()
  where character_id = chosen and p_slot = any(equipped_slots);

  if p_slot in ('main_weapon','off_weapon') and item_two_handed then
    update public.v2_character_inventory
    set equipped_slots = '{}', equipped_slot = null, updated_at = now()
    where character_id = chosen and equipped_slots && array['main_weapon','off_weapon'];
  elsif p_slot in ('main_weapon','off_weapon') then
    update public.v2_character_inventory inventory
    set equipped_slots = '{}', equipped_slot = null, updated_at = now()
    from public.v2_shop_items item
    where inventory.character_id = chosen
      and inventory.item_id = item.id
      and inventory.equipped_slots && array['main_weapon','off_weapon']
      and item.two_handed;
  end if;

  update public.v2_character_inventory
  set
    equipped_slots = case
      when repeatable_item then array_append(array_remove(equipped_slots, p_slot), p_slot)
      else array[p_slot]
    end,
    equipped_slot = case
      when repeatable_item and cardinality(equipped_slots) > 0 then equipped_slots[1]
      else p_slot
    end,
    updated_at = now()
  where id = p_inventory_id
    and (
      not repeatable_item
      or p_slot = any(equipped_slots)
      or cardinality(equipped_slots) < owned_quantity
    )
  returning * into inventory_row;

  if inventory_row.id is null then
    raise exception 'Você precisa possuir outra cópia deste item' using errcode = '23514';
  end if;
  return inventory_row;
end
$$;

create or replace function public.v2_unequip_inventory_slot(p_inventory_id uuid, p_slot text)
returns public.v2_character_inventory
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inventory_row public.v2_character_inventory;
  owner_id uuid;
begin
  if p_slot not in (
    'head','torso','hands','legs','feet','main_weapon','off_weapon','necklace',
    'ring_1','ring_2','earring_1','earring_2','cape','title'
  ) then raise exception 'Espaço de equipamento inválido' using errcode = '23514'; end if;

  select character.user_id into owner_id
  from public.v2_character_inventory inventory
  join public.v2_characters character on character.id = inventory.character_id
  where inventory.id = p_inventory_id;

  if owner_id is null then raise exception 'Item não encontrado' using errcode = 'P0002'; end if;
  if owner_id <> (select auth.uid()) then raise exception 'Acesso negado' using errcode = '42501'; end if;

  update public.v2_character_inventory
  set
    equipped_slots = array_remove(equipped_slots, p_slot),
    equipped_slot = (array_remove(equipped_slots, p_slot))[1],
    updated_at = now()
  where id = p_inventory_id
  returning * into inventory_row;
  return inventory_row;
end
$$;

revoke execute on function public.v2_equip_inventory_item(uuid, text) from public, anon;
revoke execute on function public.v2_unequip_inventory_slot(uuid, text) from public, anon;
grant execute on function public.v2_equip_inventory_item(uuid, text) to authenticated;
grant execute on function public.v2_unequip_inventory_slot(uuid, text) to authenticated;

comment on table public.v2_rework_item_backups is
  'Cópia privada dos campos normalizados pelo Item 5 para rollback ensaiado.';
comment on table public.v2_rework_equipment_backups is
  'Cópia privada da ocupação de slots anterior ao Item 5.';
