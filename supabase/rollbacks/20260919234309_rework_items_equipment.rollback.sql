alter table public.v2_shop_items drop constraint if exists v2_shop_items_attributes_object;
alter table public.v2_shop_items drop constraint if exists v2_shop_items_two_handed_weapon;
alter table public.v2_shop_items drop constraint if exists v2_shop_items_special_effects_array;
alter table public.v2_shop_items drop constraint if exists v2_shop_items_rarity_check;
alter table public.v2_shop_items drop constraint if exists v2_shop_items_slot_check;
alter table public.v2_character_inventory drop constraint if exists v2_character_inventory_equipped_slots_check;
alter table public.v2_character_inventory drop constraint if exists v2_character_inventory_equipped_slot_check;

update public.v2_shop_items item
set
  slot = backup.slot,
  rarity = backup.rarity,
  attributes = backup.attributes,
  special_effects = backup.special_effects,
  two_handed = backup.two_handed,
  updated_at = now()
from public.v2_rework_item_backups backup
where backup.item_id = item.id;

update public.v2_character_inventory inventory
set
  equipped_slot = backup.equipped_slot,
  equipped_slots = backup.equipped_slots,
  updated_at = now()
from public.v2_rework_equipment_backups backup
where backup.inventory_id = inventory.id;

alter table public.v2_shop_items add constraint v2_shop_items_slot_check check (
  slot in (
    'head','torso','hands','legs','feet','main_weapon','off_weapon','necklace',
    'ring','earring','cape','title'
  )
);
alter table public.v2_shop_items add constraint v2_shop_items_rarity_check check (
  rarity in ('common','uncommon','rare','epic','legendary','mythic','awakened')
);
alter table public.v2_shop_items add constraint v2_shop_items_special_effects_array check (
  jsonb_typeof(special_effects) = 'array'
);
alter table public.v2_character_inventory add constraint v2_character_inventory_equipped_slot_check check (
  equipped_slot is null or equipped_slot in (
    'head','torso','hands','legs','feet','main_weapon','off_weapon','necklace',
    'ring_1','ring_2','earring_1','earring_2','cape','title'
  )
);
alter table public.v2_character_inventory add constraint v2_character_inventory_equipped_slots_check check (
  equipped_slots <@ array[
    'head','torso','hands','legs','feet','main_weapon','off_weapon','necklace',
    'ring_1','ring_2','earring_1','earring_2','cape','title'
  ]::text[]
  and cardinality(equipped_slots) <= quantity
);

drop function if exists public.v2_normalize_equipment_slots(text[], text, text, integer);
drop function if exists public.v2_normalize_equipment_slot(text, text);
drop table if exists public.v2_rework_equipment_backups;
drop table if exists public.v2_rework_item_backups;
