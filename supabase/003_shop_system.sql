-- Wonderland — Loja, compra atômica e equipamentos
-- Execute este arquivo no SQL Editor do Supabase.

alter table public.items add column if not exists slot text;
alter table public.items add column if not exists stats jsonb not null default '{}'::jsonb;
alter table public.items add column if not exists price_wg bigint not null default 0;
alter table public.items add column if not exists two_handed boolean not null default false;
alter table public.items add column if not exists occupies_both_hands boolean not null default false;

alter table public.items drop constraint if exists items_price_wg_check;
alter table public.items add constraint items_price_wg_check check (price_wg >= 0);

create or replace function public.purchase_shop_item(
  p_character_id uuid,
  p_item_key text,
  p_name text,
  p_slot text,
  p_rarity text,
  p_price_wg bigint,
  p_stats jsonb,
  p_icon text,
  p_image_url text,
  p_two_handed boolean,
  p_occupies_both_hands boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_balance bigint;
  v_inventory_id uuid;
  v_position integer;
  v_metadata jsonb;
begin
  select user_id, wg into v_owner, v_balance
  from public.characters
  where id = p_character_id
  for update;

  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'Personagem inválido ou sem permissão.';
  end if;
  if coalesce(p_price_wg,0) < 0 then
    raise exception 'Preço inválido.';
  end if;
  if coalesce(v_balance,0) < p_price_wg then
    raise exception 'WG insuficiente. Saldo atual: % WG.', coalesce(v_balance,0);
  end if;

  v_metadata := jsonb_build_object(
    'name',p_name,'slot',p_slot,'rarity',p_rarity,'price_wg',p_price_wg,
    'stats',coalesce(p_stats,'{}'::jsonb),'icon',p_icon,'image',p_image_url,
    'two_handed',coalesce(p_two_handed,false),
    'occupies_both_hands',coalesce(p_occupies_both_hands,false)
  );

  update public.characters set wg = wg - p_price_wg where id = p_character_id;

  select id into v_inventory_id
  from public.character_inventory
  where character_id=p_character_id and item_key=p_item_key
  limit 1 for update;

  if v_inventory_id is not null then
    update public.character_inventory
    set quantity=quantity+1, metadata=v_metadata
    where id=v_inventory_id;
  else
    select coalesce(max(slot_position),0)+1 into v_position
    from public.character_inventory where character_id=p_character_id;
    insert into public.character_inventory(character_id,item_key,quantity,slot_position,metadata)
    values(p_character_id,p_item_key,1,v_position,v_metadata)
    returning id into v_inventory_id;
  end if;

  return jsonb_build_object('ok',true,'inventory_id',v_inventory_id,'new_balance',v_balance-p_price_wg);
end;
$$;

grant execute on function public.purchase_shop_item(uuid,text,text,text,text,bigint,jsonb,text,text,boolean,boolean) to authenticated;

create or replace function public.equip_inventory_item(p_character_id uuid,p_inventory_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_owner uuid;
  v_item record;
  v_slot text;
  v_both boolean;
  v_position integer;
begin
  select user_id into v_owner from public.characters where id=p_character_id;
  if v_owner is null or v_owner<>auth.uid() then raise exception 'Sem permissão.'; end if;

  select * into v_item from public.character_inventory
  where id=p_inventory_id and character_id=p_character_id for update;
  if not found then raise exception 'Item não encontrado no inventário.'; end if;

  v_slot := coalesce(v_item.metadata->>'slot','');
  v_both := coalesce((v_item.metadata->>'occupies_both_hands')::boolean,false)
            or coalesce((v_item.metadata->>'two_handed')::boolean,false);
  if v_slot='' then raise exception 'Este item não possui slot de equipamento.'; end if;

  if v_both and v_slot in ('main_hand','off_hand') then
    delete from public.character_equipment where character_id=p_character_id and slot in ('main_hand','off_hand');
    insert into public.character_equipment(character_id,slot,item_key,metadata)
    values(p_character_id,'main_hand',v_item.item_key,v_item.metadata);
    insert into public.character_equipment(character_id,slot,item_key,metadata)
    values(p_character_id,'off_hand',v_item.item_key,v_item.metadata || jsonb_build_object('linked_two_hand',true));
  else
    if v_slot='off_hand' and exists(
      select 1 from public.character_equipment
      where character_id=p_character_id and slot='main_hand'
      and (coalesce((metadata->>'occupies_both_hands')::boolean,false) or coalesce((metadata->>'two_handed')::boolean,false))
    ) then raise exception 'Uma arma de duas mãos está ocupando os dois slots.'; end if;
    if v_slot='main_hand' and exists(
      select 1 from public.character_equipment
      where character_id=p_character_id and slot='off_hand'
      and coalesce((metadata->>'linked_two_hand')::boolean,false)
    ) then delete from public.character_equipment where character_id=p_character_id and slot in ('main_hand','off_hand');
    end if;
    delete from public.character_equipment where character_id=p_character_id and slot=v_slot;
    insert into public.character_equipment(character_id,slot,item_key,metadata)
    values(p_character_id,v_slot,v_item.item_key,v_item.metadata);
  end if;

  if v_item.quantity>1 then
    update public.character_inventory set quantity=quantity-1 where id=v_item.id;
  else
    delete from public.character_inventory where id=v_item.id;
  end if;
  return jsonb_build_object('ok',true,'slot',v_slot,'two_handed',v_both);
end;
$$;

grant execute on function public.equip_inventory_item(uuid,uuid) to authenticated;

create or replace function public.unequip_character_slot(p_character_id uuid,p_slot text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_owner uuid;
  v_equipped record;
  v_position integer;
  v_existing uuid;
begin
  select user_id into v_owner from public.characters where id=p_character_id;
  if v_owner is null or v_owner<>auth.uid() then raise exception 'Sem permissão.'; end if;
  select * into v_equipped from public.character_equipment
  where character_id=p_character_id and slot=p_slot limit 1;
  if not found then raise exception 'Nenhum item equipado neste slot.'; end if;

  select id into v_existing from public.character_inventory
  where character_id=p_character_id and item_key=v_equipped.item_key limit 1;
  if v_existing is not null then
    update public.character_inventory set quantity=quantity+1,metadata=v_equipped.metadata where id=v_existing;
  else
    select coalesce(max(slot_position),0)+1 into v_position from public.character_inventory where character_id=p_character_id;
    insert into public.character_inventory(character_id,item_key,quantity,slot_position,metadata)
    values(p_character_id,v_equipped.item_key,1,v_position,v_equipped.metadata);
  end if;

  if coalesce((v_equipped.metadata->>'occupies_both_hands')::boolean,false)
     or coalesce((v_equipped.metadata->>'two_handed')::boolean,false)
     or coalesce((v_equipped.metadata->>'linked_two_hand')::boolean,false) then
    delete from public.character_equipment where character_id=p_character_id and slot in ('main_hand','off_hand');
  else
    delete from public.character_equipment where id=v_equipped.id;
  end if;
  return jsonb_build_object('ok',true);
end;
$$;

grant execute on function public.unequip_character_slot(uuid,text) to authenticated;