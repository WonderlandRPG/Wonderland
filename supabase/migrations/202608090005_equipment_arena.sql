create or replace function public.v2_equip_inventory_item(p_inventory_id uuid, p_slot text)
returns public.v2_character_inventory language plpgsql security definer set search_path=public as $$
declare inventory_row public.v2_character_inventory; chosen uuid; owner_id uuid; item_slot text; item_two_handed boolean;
begin
  select inventory.character_id,characters.user_id,item.slot,item.two_handed into chosen,owner_id,item_slot,item_two_handed
  from public.v2_character_inventory inventory join public.v2_characters characters on characters.id=inventory.character_id
  join public.v2_shop_items item on item.id=inventory.item_id where inventory.id=p_inventory_id;
  if chosen is null then raise exception 'Item não encontrado' using errcode='P0002'; end if;
  if owner_id<>(select auth.uid()) then raise exception 'Acesso negado' using errcode='42501'; end if;
  if item_slot<>p_slot then raise exception 'Espaço de equipamento inválido' using errcode='23514'; end if;
  update public.v2_character_inventory set equipped_slot=null,updated_at=now() where character_id=chosen and equipped_slot=p_slot;
  if p_slot='weapon' and item_two_handed then update public.v2_character_inventory set equipped_slot=null,updated_at=now() where character_id=chosen and equipped_slot='shield'; end if;
  if p_slot='shield' then update public.v2_character_inventory inventory set equipped_slot=null,updated_at=now() from public.v2_shop_items item where inventory.character_id=chosen and inventory.item_id=item.id and inventory.equipped_slot='weapon' and item.two_handed; end if;
  update public.v2_character_inventory set equipped_slot=p_slot,updated_at=now() where id=p_inventory_id returning * into inventory_row;
  return inventory_row;
end; $$;

create or replace function public.v2_unequip_inventory_item(p_inventory_id uuid)
returns public.v2_character_inventory language plpgsql security definer set search_path=public as $$
declare inventory_row public.v2_character_inventory; owner_id uuid;
begin
  select characters.user_id into owner_id from public.v2_character_inventory inventory join public.v2_characters characters on characters.id=inventory.character_id where inventory.id=p_inventory_id;
  if owner_id is null then raise exception 'Item não encontrado' using errcode='P0002'; end if;
  if owner_id<>(select auth.uid()) then raise exception 'Acesso negado' using errcode='42501'; end if;
  update public.v2_character_inventory set equipped_slot=null,updated_at=now() where id=p_inventory_id returning * into inventory_row;
  return inventory_row;
end; $$;

revoke execute on function public.v2_equip_inventory_item(uuid,text),public.v2_unequip_inventory_item(uuid) from public,anon;
grant execute on function public.v2_equip_inventory_item(uuid,text),public.v2_unequip_inventory_item(uuid) to authenticated;
