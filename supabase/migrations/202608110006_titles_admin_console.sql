-- Títulos equipáveis e console seguro de recompensas.
alter table public.v2_character_inventory drop constraint if exists v2_character_inventory_equipped_slot_check;
alter table public.v2_character_inventory add constraint v2_character_inventory_equipped_slot_check check (
  equipped_slot is null or equipped_slot in ('head','torso','hands','legs','feet','main_weapon','off_weapon','necklace','ring_1','ring_2','earring_1','earring_2','cape','title')
);

insert into public.v2_shop_items(slug,name,description,category,price,slot,rarity,attributes,two_handed,sort_order,special_effects,active)
values ('titulo-desperto-de-wonderland','Desperto de Wonderland','Concedido àqueles que atenderam ao chamado quando Wonderland despertou novamente.','Título',0,'title','awakened',
  '{"FOR":10,"DEF":10,"RES":10,"INI":10,"INT":10,"ARC":10}'::jsonb,false,99999,'[]'::jsonb,false)
on conflict (slug) do update set name=excluded.name,description=excluded.description,category=excluded.category,price=0,slot='title',rarity='awakened',attributes=excluded.attributes,special_effects='[]'::jsonb,active=false,updated_at=now();

create or replace function public.v2_equip_inventory_item(p_inventory_id uuid, p_slot text)
returns public.v2_character_inventory language plpgsql security definer set search_path=public as $$
declare inventory_row public.v2_character_inventory; chosen uuid; owner_id uuid; item_slot text; item_two_handed boolean;
begin
  select inventory.character_id,characters.user_id,item.slot,item.two_handed into chosen,owner_id,item_slot,item_two_handed
  from public.v2_character_inventory inventory join public.v2_characters characters on characters.id=inventory.character_id
  join public.v2_shop_items item on item.id=inventory.item_id where inventory.id=p_inventory_id;
  if chosen is null or owner_id<>auth.uid() then raise exception 'Item não encontrado'; end if;
  if not (item_slot=p_slot or item_slot='ring' and p_slot in ('ring_1','ring_2') or item_slot='earring' and p_slot in ('earring_1','earring_2') or item_slot in ('main_weapon','off_weapon') and p_slot in ('main_weapon','off_weapon')) then raise exception 'Espaço de equipamento inválido'; end if;
  update public.v2_character_inventory set equipped_slot=null,updated_at=now() where character_id=chosen and equipped_slot=p_slot;
  if p_slot in ('main_weapon','off_weapon') and item_two_handed then update public.v2_character_inventory set equipped_slot=null,updated_at=now() where character_id=chosen and equipped_slot in ('main_weapon','off_weapon'); end if;
  if p_slot in ('main_weapon','off_weapon') then update public.v2_character_inventory inventory set equipped_slot=null,updated_at=now() from public.v2_shop_items item where inventory.character_id=chosen and inventory.item_id=item.id and inventory.equipped_slot in ('main_weapon','off_weapon') and item.two_handed; end if;
  update public.v2_character_inventory set equipped_slot=p_slot,updated_at=now() where id=p_inventory_id returning * into inventory_row;
  return inventory_row;
end $$;

create or replace function public.v2_admin_grant_reward_command(p_target_name text,p_reward_type text,p_reward_name text default '',p_amount integer default 1)
returns integer language plpgsql security definer set search_path=public as $$
declare target_ids uuid[]; target_id uuid; chosen_item uuid; affected integer:=0;
begin
  if not public.v2_is_admin() then raise exception 'Acesso negado'; end if;
  if p_amount < 1 or p_amount > 999999 then raise exception 'Quantidade inválida'; end if;
  if lower(trim(p_target_name))='todos' then select coalesce(array_agg(id),'{}') into target_ids from public.v2_characters;
  else select coalesce(array_agg(id),'{}') into target_ids from public.v2_characters where lower(name)=lower(trim(p_target_name)); end if;
  if cardinality(target_ids)=0 then raise exception 'Personagem não encontrado'; end if;
  if lower(p_reward_type) in ('item','titulo') then
    select id into chosen_item from public.v2_shop_items where lower(name)=lower(trim(p_reward_name)) and (lower(p_reward_type)='item' and slot<>'title' or lower(p_reward_type)='titulo' and slot='title') limit 1;
    if chosen_item is null then raise exception 'Recompensa não encontrada'; end if;
    foreach target_id in array target_ids loop
      insert into public.v2_character_inventory(character_id,item_id,quantity) values(target_id,chosen_item,p_amount)
      on conflict(character_id,item_id) do update set quantity=public.v2_character_inventory.quantity+excluded.quantity,updated_at=now(); affected:=affected+1;
    end loop;
  elsif lower(p_reward_type)='xp' then update public.v2_characters set xp=xp+p_amount,updated_at=now() where id=any(target_ids); get diagnostics affected=row_count;
  else raise exception 'Tipo de recompensa inválido'; end if;
  insert into public.v2_admin_history(actor_id,action,target_type,target_id,details) values(auth.uid(),'reward.granted','characters',null,jsonb_build_object('target',p_target_name,'type',p_reward_type,'reward',p_reward_name,'amount',p_amount,'affected',affected));
  return affected;
end $$;
revoke execute on function public.v2_admin_grant_reward_command(text,text,text,integer) from public,anon;
grant execute on function public.v2_admin_grant_reward_command(text,text,text,integer) to authenticated;
