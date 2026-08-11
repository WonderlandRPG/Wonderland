begin;

create or replace function public.v2_equip_inventory_item(p_inventory_id uuid, p_slot text)
returns public.v2_character_inventory
language plpgsql security definer set search_path = '' as $$
declare
  inventory_row public.v2_character_inventory;
  chosen uuid;
  owner_id uuid;
  item_slot text;
  item_two_handed boolean;
begin
  select inventory.character_id, characters.user_id, item.slot, item.two_handed
  into chosen, owner_id, item_slot, item_two_handed
  from public.v2_character_inventory inventory
  join public.v2_characters characters on characters.id = inventory.character_id
  join public.v2_shop_items item on item.id = inventory.item_id
  where inventory.id = p_inventory_id;

  if chosen is null then raise exception 'Item não encontrado' using errcode = 'P0002'; end if;
  if owner_id <> (select auth.uid()) then raise exception 'Acesso negado' using errcode = '42501'; end if;
  if p_slot not in ('head','torso','hands','legs','feet','main_weapon','off_weapon','necklace','ring_1','ring_2','earring_1','earring_2','cape') then
    raise exception 'Espaço de equipamento inválido' using errcode = '23514';
  end if;

  if not (
    item_slot = p_slot
    or (item_slot = 'ring' and p_slot in ('ring_1','ring_2'))
    or (item_slot = 'earring' and p_slot in ('earring_1','earring_2'))
    or (item_slot = 'main_weapon' and p_slot = 'off_weapon' and not item_two_handed)
    or (item_slot in ('main_weapon','off_weapon') and p_slot in ('main_weapon','off_weapon') and item_two_handed)
  ) then raise exception 'Item incompatível com o espaço' using errcode = '23514'; end if;

  if p_slot in ('main_weapon','off_weapon') then
    update public.v2_character_inventory inventory
    set equipped_slot = null, updated_at = now()
    from public.v2_shop_items item
    where inventory.character_id = chosen
      and inventory.item_id = item.id
      and inventory.equipped_slot in ('main_weapon','off_weapon')
      and (inventory.equipped_slot = p_slot or item.two_handed or item_two_handed);
  else
    update public.v2_character_inventory set equipped_slot = null, updated_at = now()
    where character_id = chosen and equipped_slot = p_slot;
  end if;

  update public.v2_character_inventory
  set equipped_slot = p_slot, updated_at = now()
  where id = p_inventory_id
  returning * into inventory_row;

  return inventory_row;
end; $$;

revoke execute on function public.v2_equip_inventory_item(uuid,text) from public, anon;
grant execute on function public.v2_equip_inventory_item(uuid,text) to authenticated;

commit;
