create or replace function public.v2_equip_inventory_item(p_inventory_id uuid, p_slot text)
returns public.v2_character_inventory
language plpgsql
security definer
set search_path=public
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
  select inventory.character_id, characters.user_id, item.slot, item.two_handed, inventory.quantity
    into chosen, owner_id, item_slot, item_two_handed, owned_quantity
  from public.v2_character_inventory inventory
  join public.v2_characters characters on characters.id = inventory.character_id
  join public.v2_shop_items item on item.id = inventory.item_id
  where inventory.id = p_inventory_id;

  if chosen is null or owner_id <> (select auth.uid()) then
    raise exception 'Item não encontrado';
  end if;

  if not (
    item_slot = p_slot
    or item_slot = 'ring' and p_slot in ('ring_1', 'ring_2')
    or item_slot = 'earring' and p_slot in ('earring_1', 'earring_2')
    or item_slot in ('main_weapon', 'off_weapon') and p_slot in ('main_weapon', 'off_weapon')
  ) then
    raise exception 'Espaço de equipamento inválido';
  end if;

  repeatable_item := item_slot in ('ring', 'earring')
    or (item_slot in ('main_weapon', 'off_weapon') and not item_two_handed);

  update public.v2_character_inventory
  set equipped_slots = array_remove(equipped_slots, p_slot),
      equipped_slot = (array_remove(equipped_slots, p_slot))[1],
      updated_at = now()
  where character_id = chosen and p_slot = any(equipped_slots);

  if p_slot in ('main_weapon', 'off_weapon') and item_two_handed then
    update public.v2_character_inventory
    set equipped_slots = '{}', equipped_slot = null, updated_at = now()
    where character_id = chosen and equipped_slots && array['main_weapon', 'off_weapon'];
  elsif p_slot in ('main_weapon', 'off_weapon') then
    update public.v2_character_inventory inventory
    set equipped_slots = '{}', equipped_slot = null, updated_at = now()
    from public.v2_shop_items item
    where inventory.character_id = chosen
      and inventory.item_id = item.id
      and inventory.equipped_slots && array['main_weapon', 'off_weapon']
      and item.two_handed;
  end if;

  update public.v2_character_inventory
  set equipped_slots = case
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
    raise exception 'Você precisa possuir outra cópia deste item';
  end if;
  return inventory_row;
end
$$;

revoke execute on function public.v2_equip_inventory_item(uuid, text) from public, anon;
grant execute on function public.v2_equip_inventory_item(uuid, text) to authenticated;

update public.v2_content
set payload = jsonb_set(
      payload,
      '{resource}',
      (payload -> 'resource')
        || jsonb_build_object(
          'initial', case slug when 'alquimista' then 20 else 10 end,
          'maximum', 80,
          'generationRules', case slug
            when 'alquimista' then jsonb_build_array('Ganha 10 Catalisadores ao usar uma categoria de operação diferente da ação anterior, limitado a 20 por rodada.')
            else jsonb_build_array('Ganha 10 Almas quando uma invocação expira ou uma unidade perde ao menos 20% do HP máximo em uma ação.')
          end,
          'resetRules', case slug
            when 'alquimista' then jsonb_build_array('No início do combate, Catalisadores retorna a 20.')
            else jsonb_build_array('No início do combate, Almas retorna a 10.')
          end,
          'generationEvents', jsonb_build_array(jsonb_build_object('amount', 10, 'trigger', 'BASIC_ATTACK_HIT', 'limitPerAction', 1))
        )
    ),
    updated_at = now()
where content_type = 'class' and slug in ('alquimista', 'necromante');
