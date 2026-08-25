-- Permite usar duas cópias empilhadas do mesmo anel/brinco sem duplicar o catálogo.
alter table public.v2_character_inventory
  add column if not exists equipped_slots text[] not null default '{}'::text[];

update public.v2_character_inventory
set equipped_slots = array[equipped_slot]
where equipped_slot is not null and cardinality(equipped_slots) = 0;

alter table public.v2_character_inventory drop constraint if exists v2_character_inventory_equipped_slots_check;
alter table public.v2_character_inventory add constraint v2_character_inventory_equipped_slots_check check (
  equipped_slots <@ array['head','torso','hands','legs','feet','main_weapon','off_weapon','necklace','ring_1','ring_2','earring_1','earring_2','cape','title']::text[]
  and cardinality(equipped_slots) <= quantity
);

create or replace function public.v2_equip_inventory_item(p_inventory_id uuid, p_slot text)
returns public.v2_character_inventory language plpgsql security definer set search_path=public as $$
declare inventory_row public.v2_character_inventory; chosen uuid; owner_id uuid; item_slot text; item_two_handed boolean; owned_quantity integer;
begin
  select inventory.character_id,characters.user_id,item.slot,item.two_handed,inventory.quantity
  into chosen,owner_id,item_slot,item_two_handed,owned_quantity
  from public.v2_character_inventory inventory
  join public.v2_characters characters on characters.id=inventory.character_id
  join public.v2_shop_items item on item.id=inventory.item_id
  where inventory.id=p_inventory_id;
  if chosen is null or owner_id<>auth.uid() then raise exception 'Item não encontrado'; end if;
  if not (item_slot=p_slot or item_slot='ring' and p_slot in ('ring_1','ring_2') or item_slot='earring' and p_slot in ('earring_1','earring_2') or item_slot in ('main_weapon','off_weapon') and p_slot in ('main_weapon','off_weapon')) then raise exception 'Espaço de equipamento inválido'; end if;

  update public.v2_character_inventory
  set equipped_slots=array_remove(equipped_slots,p_slot),
      equipped_slot=nullif((array_remove(equipped_slots,p_slot))[1],''),updated_at=now()
  where character_id=chosen and p_slot=any(equipped_slots);

  if p_slot in ('main_weapon','off_weapon') and item_two_handed then
    update public.v2_character_inventory set equipped_slots=array_remove(array_remove(equipped_slots,'main_weapon'),'off_weapon'),equipped_slot=null,updated_at=now()
    where character_id=chosen and equipped_slots && array['main_weapon','off_weapon'];
  elsif p_slot in ('main_weapon','off_weapon') then
    update public.v2_character_inventory inventory set equipped_slots='{}',equipped_slot=null,updated_at=now()
    from public.v2_shop_items item where inventory.character_id=chosen and inventory.item_id=item.id
      and inventory.equipped_slots && array['main_weapon','off_weapon'] and item.two_handed;
  end if;

  update public.v2_character_inventory
  set equipped_slots=case
        when item_slot in ('ring','earring') then array_append(array_remove(equipped_slots,p_slot),p_slot)
        else array[p_slot]
      end,
      equipped_slot=case when item_slot in ('ring','earring') and cardinality(equipped_slots)>0 then equipped_slots[1] else p_slot end,
      updated_at=now()
  where id=p_inventory_id
    and (item_slot not in ('ring','earring') or p_slot=any(equipped_slots) or cardinality(equipped_slots)<owned_quantity)
  returning * into inventory_row;
  if inventory_row.id is null then raise exception 'Você precisa possuir outra cópia deste acessório'; end if;
  return inventory_row;
end $$;

create or replace function public.v2_unequip_inventory_slot(p_inventory_id uuid,p_slot text)
returns public.v2_character_inventory language plpgsql security definer set search_path=public as $$
declare inventory_row public.v2_character_inventory; owner_id uuid; remaining text[];
begin
  select characters.user_id into owner_id from public.v2_character_inventory inventory join public.v2_characters characters on characters.id=inventory.character_id where inventory.id=p_inventory_id;
  if owner_id is null or owner_id<>auth.uid() then raise exception 'Item não encontrado'; end if;
  update public.v2_character_inventory set equipped_slots=array_remove(equipped_slots,p_slot),equipped_slot=(array_remove(equipped_slots,p_slot))[1],updated_at=now()
  where id=p_inventory_id returning * into inventory_row;
  return inventory_row;
end $$;

revoke execute on function public.v2_unequip_inventory_slot(uuid,text) from public,anon;
grant execute on function public.v2_unequip_inventory_slot(uuid,text) to authenticated;

update public.v2_shop_items
set image_url='/items/tempestade-astral/' || replace(slot,'_','-') || '.png',updated_at=now()
where active and slug like 'tempestade-astral-%';
