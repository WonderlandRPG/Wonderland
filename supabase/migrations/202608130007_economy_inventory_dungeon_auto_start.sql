-- Economia transacional, manutenção de Títulos e início automático da Dungeon 4/4.
begin;

drop policy if exists "shop authenticated read" on public.v2_shop_items;
create policy "shop authenticated read" on public.v2_shop_items for select to authenticated using (
  active or public.v2_is_admin() or exists (
    select 1 from public.v2_character_inventory inventory
    join public.v2_characters character on character.id=inventory.character_id
    where inventory.item_id=v2_shop_items.id and character.user_id=auth.uid()
  )
);

create or replace function public.v2_admin_grant_reward_command(
  p_target_name text,p_reward_type text,p_reward_name text default '',p_amount integer default 1
)
returns integer language plpgsql security definer set search_path=public as $$
declare target_ids uuid[]; target_id uuid; chosen_item uuid; affected integer:=0; reward_kind text:=lower(trim(p_reward_type));
begin
  if not public.v2_is_admin() then raise exception 'Acesso negado'; end if;
  if p_amount < 1 or p_amount > 999999 then raise exception 'Quantidade inválida'; end if;
  if lower(trim(p_target_name))='todos' then
    select coalesce(array_agg(id),'{}') into target_ids from public.v2_characters;
  else
    select coalesce(array_agg(id),'{}') into target_ids from public.v2_characters where lower(name)=lower(trim(p_target_name));
  end if;
  if cardinality(target_ids)=0 then raise exception 'Personagem não encontrado'; end if;
  if reward_kind in ('item','titulo') then
    select id into chosen_item from public.v2_shop_items
    where lower(name)=lower(trim(p_reward_name))
      and (reward_kind='item' and slot<>'title' or reward_kind='titulo' and slot='title') limit 1;
    if chosen_item is null then raise exception 'Recompensa não encontrada'; end if;
    foreach target_id in array target_ids loop
      insert into public.v2_character_inventory(character_id,item_id,quantity)
      values(target_id,chosen_item,p_amount)
      on conflict(character_id,item_id) do update set
        quantity=public.v2_character_inventory.quantity+excluded.quantity,updated_at=now();
      affected:=affected+1;
    end loop;
  elsif reward_kind='xp' then
    update public.v2_characters set xp=xp+p_amount,updated_at=now() where id=any(target_ids);
    get diagnostics affected=row_count;
  elsif reward_kind='wg' then
    update public.v2_characters set gold=gold+p_amount,updated_at=now() where id=any(target_ids);
    get diagnostics affected=row_count;
  else raise exception 'Tipo de recompensa inválido';
  end if;
  insert into public.v2_admin_history(actor_id,action,target_type,target_id,details)
  values(auth.uid(),'reward.granted','characters',null,jsonb_build_object(
    'target',p_target_name,'type',reward_kind,'reward',p_reward_name,'amount',p_amount,'affected',affected
  ));
  return affected;
end $$;

create or replace function public.v2_admin_delete_title(p_title_id uuid)
returns integer language plpgsql security definer set search_path=public as $$
declare removed integer:=0; title_name text;
begin
  if not public.v2_is_admin() then raise exception 'Acesso negado'; end if;
  select name into title_name from public.v2_shop_items where id=p_title_id and slot='title' for update;
  if title_name is null then raise exception 'Título não encontrado'; end if;
  delete from public.v2_character_inventory where item_id=p_title_id;
  get diagnostics removed=row_count;
  delete from public.v2_shop_items where id=p_title_id and slot='title';
  insert into public.v2_admin_history(actor_id,action,target_type,target_id,details)
  values(auth.uid(),'title.deleted','title',p_title_id,jsonb_build_object('name',title_name,'inventories_removed',removed));
  return removed;
end $$;

create or replace function public.v2_sell_inventory_item(p_inventory_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare inventory_row public.v2_character_inventory; item_row public.v2_shop_items; owner_id uuid; sale_value bigint;
begin
  select inventory.* into inventory_row from public.v2_character_inventory inventory
  where inventory.id=p_inventory_id for update;
  if inventory_row.id is null then raise exception 'Item não encontrado'; end if;
  select user_id into owner_id from public.v2_characters where id=inventory_row.character_id for update;
  if owner_id is distinct from auth.uid() then raise exception 'Acesso negado'; end if;
  if inventory_row.equipped_slot is not null then raise exception 'Desequipe o item antes de vender'; end if;
  select * into item_row from public.v2_shop_items where id=inventory_row.item_id;
  if item_row.id is null or item_row.slot='title' or item_row.price<=0 then raise exception 'Este item não pode ser vendido'; end if;
  sale_value:=floor(item_row.price::numeric/3)::bigint;
  if inventory_row.quantity>1 then
    update public.v2_character_inventory set quantity=quantity-1,updated_at=now() where id=inventory_row.id;
  else
    delete from public.v2_character_inventory where id=inventory_row.id;
  end if;
  update public.v2_characters set gold=gold+sale_value,updated_at=now() where id=inventory_row.character_id;
  return jsonb_build_object('wg',sale_value,'item',item_row.name,'remaining',greatest(0,inventory_row.quantity-1));
end $$;

create or replace function public.v2_buy_shop_cart(p_item_ids uuid[])
returns jsonb language plpgsql security definer set search_path=public as $$
declare chosen uuid; balance bigint; total bigint; invalid_count integer; entry record;
begin
  if coalesce(cardinality(p_item_ids),0)<1 or cardinality(p_item_ids)>50 then raise exception 'Carrinho inválido'; end if;
  select character_id into chosen from public.v2_active_characters where user_id=auth.uid();
  if chosen is null then raise exception 'Selecione um personagem antes de comprar'; end if;
  select count(*) into invalid_count from unnest(p_item_ids) requested(id)
  left join public.v2_shop_items item on item.id=requested.id and item.active
  where item.id is null;
  if invalid_count>0 then raise exception 'Um item do carrinho está indisponível'; end if;
  select coalesce(sum(item.price),0) into total from unnest(p_item_ids) requested(id)
  join public.v2_shop_items item on item.id=requested.id and item.active;
  select gold into balance from public.v2_characters where id=chosen and user_id=auth.uid() for update;
  if balance<total then raise exception 'WG insuficiente'; end if;
  update public.v2_characters set gold=gold-total,updated_at=now() where id=chosen;
  for entry in select id,count(*)::integer quantity from unnest(p_item_ids) requested(id) group by id loop
    insert into public.v2_character_inventory(character_id,item_id,quantity)
    values(chosen,entry.id,entry.quantity)
    on conflict(character_id,item_id) do update set
      quantity=public.v2_character_inventory.quantity+excluded.quantity,updated_at=now();
  end loop;
  return jsonb_build_object('total',total,'quantity',cardinality(p_item_ids));
end $$;

drop function if exists public.v2_join_dungeon_queue(text,uuid);
create function public.v2_join_dungeon_queue(p_dungeon_key text,p_character_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare party uuid[]; party_rows uuid[]; party_size integer; created public.v2_dungeon_runs;
begin
  if auth.uid() is null or not public.v2_is_admin() then raise exception 'Acesso administrativo necessário' using errcode='42501'; end if;
  if p_dungeon_key<>'ruinas-de-verdantia' then raise exception 'Dungeon indisponível' using errcode='22023'; end if;
  if not exists(select 1 from public.v2_characters c join public.v2_active_characters a on a.character_id=c.id and a.user_id=c.user_id where c.id=p_character_id and c.user_id=auth.uid()) then
    raise exception 'Selecione seu personagem ativo antes de entrar' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtext('dungeon:'||p_dungeon_key));
  insert into public.v2_dungeon_queue(dungeon_key,user_id,character_id,joined_at)
  values(p_dungeon_key,auth.uid(),p_character_id,now())
  on conflict(dungeon_key,user_id) do update set character_id=excluded.character_id,joined_at=excluded.joined_at;
  select array_agg(character_id order by joined_at),array_agg(id order by joined_at),count(*)::integer
  into party,party_rows,party_size from (select * from public.v2_dungeon_queue where dungeon_key=p_dungeon_key order by joined_at limit 4) queued;
  if party_size=4 then
    insert into public.v2_dungeon_runs(dungeon_key,party_character_ids,started_by,forced_start)
    values(p_dungeon_key,party,auth.uid(),false) returning * into created;
    delete from public.v2_dungeon_queue where id=any(party_rows);
    return jsonb_build_object('runId',created.id,'partySize',4,'started',true);
  end if;
  return jsonb_build_object('partySize',party_size,'started',false);
end $$;

create or replace function public.v2_get_own_active_dungeon_run(p_dungeon_key text)
returns uuid language sql stable security definer set search_path='' as $$
  select run.id from public.v2_dungeon_runs run
  join public.v2_active_characters active on active.user_id=auth.uid()
  where run.dungeon_key=p_dungeon_key and run.status='active'
    and active.character_id=any(run.party_character_ids)
  order by run.started_at desc limit 1
$$;

revoke all on function public.v2_admin_delete_title(uuid),public.v2_sell_inventory_item(uuid),
  public.v2_buy_shop_cart(uuid[]),public.v2_get_own_active_dungeon_run(text) from public,anon;
grant execute on function public.v2_admin_delete_title(uuid),public.v2_sell_inventory_item(uuid),
  public.v2_buy_shop_cart(uuid[]),public.v2_get_own_active_dungeon_run(text) to authenticated;
grant execute on function public.v2_join_dungeon_queue(text,uuid) to authenticated;
revoke execute on function public.v2_start_dungeon(text,boolean) from authenticated;

commit;
