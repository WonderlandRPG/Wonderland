begin;

create table if not exists public.v2_character_inventory (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.v2_characters(id) on delete cascade,
  item_id uuid not null references public.v2_content(id) on delete restrict,
  quantity integer not null default 1 check (quantity between 1 and 999),
  equipped_slot text check (equipped_slot is null or equipped_slot in ('weapon', 'head', 'torso', 'hands', 'feet', 'accessory')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (character_id, item_id)
);

create unique index if not exists v2_inventory_equipped_slot_idx
  on public.v2_character_inventory (character_id, equipped_slot)
  where equipped_slot is not null;

create or replace function public.v2_guard_inventory_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item_payload jsonb;
  stack_limit integer;
begin
  select payload into item_payload
  from public.v2_content
  where id = new.item_id and content_type = 'item';

  if item_payload is null then
    raise exception 'Item inválido.' using errcode = '23514';
  end if;

  stack_limit := case
    when coalesce((item_payload ->> 'stackable')::boolean, false)
      then coalesce((item_payload ->> 'maxStack')::integer, 1)
    else 1
  end;

  if new.quantity > stack_limit then
    raise exception 'A quantidade ultrapassa o limite de empilhamento.' using errcode = '23514';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists v2_inventory_guard on public.v2_character_inventory;
create trigger v2_inventory_guard
before insert or update on public.v2_character_inventory
for each row execute function public.v2_guard_inventory_row();

create or replace function public.v2_equip_inventory_item(
  p_inventory_id uuid,
  p_slot text
)
returns public.v2_character_inventory
language plpgsql
security definer
set search_path = public
as $$
declare
  inventory_row public.v2_character_inventory;
  inventory_character_id uuid;
  owner_id uuid;
  item_slot text;
  required_level integer;
  character_level integer;
begin
  select inventory.character_id, characters.user_id, characters.level, content.payload ->> 'equipmentSlot',
    coalesce((content.payload ->> 'levelRequirement')::integer, 1)
  into inventory_character_id, owner_id, character_level, item_slot, required_level
  from public.v2_character_inventory inventory
  join public.v2_characters characters on characters.id = inventory.character_id
  join public.v2_content content on content.id = inventory.item_id
  where inventory.id = p_inventory_id and content.content_type = 'item';

  if inventory_character_id is null then
    raise exception 'Item do inventário não encontrado.' using errcode = 'P0002';
  end if;
  if owner_id <> auth.uid() and not public.v2_is_admin() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if item_slot is null or item_slot <> p_slot then
    raise exception 'O item não pode ser equipado neste espaço.' using errcode = '23514';
  end if;
  if character_level < required_level then
    raise exception 'Nível insuficiente para equipar este item.' using errcode = '23514';
  end if;

  update public.v2_character_inventory
  set equipped_slot = null
  where character_id = inventory_character_id and equipped_slot = p_slot;

  update public.v2_character_inventory
  set equipped_slot = p_slot
  where id = p_inventory_id
  returning * into inventory_row;

  return inventory_row;
end;
$$;

create or replace function public.v2_unequip_inventory_item(p_inventory_id uuid)
returns public.v2_character_inventory
language plpgsql
security definer
set search_path = public
as $$
declare
  inventory_row public.v2_character_inventory;
  inventory_character_id uuid;
  owner_id uuid;
begin
  select inventory.character_id, characters.user_id
  into inventory_character_id, owner_id
  from public.v2_character_inventory inventory
  join public.v2_characters characters on characters.id = inventory.character_id
  where inventory.id = p_inventory_id;

  if inventory_character_id is null then
    raise exception 'Item do inventário não encontrado.' using errcode = 'P0002';
  end if;
  if owner_id <> auth.uid() and not public.v2_is_admin() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  update public.v2_character_inventory
  set equipped_slot = null
  where id = p_inventory_id
  returning * into inventory_row;

  return inventory_row;
end;
$$;

create or replace function public.v2_grant_item(
  p_character_id uuid,
  p_item_id uuid,
  p_quantity integer default 1
)
returns public.v2_character_inventory
language plpgsql
security definer
set search_path = public
as $$
declare
  granted public.v2_character_inventory;
  item_payload jsonb;
  stack_limit integer;
begin
  if not public.v2_is_admin() then
    raise exception 'Acesso administrativo necessário.' using errcode = '42501';
  end if;
  if p_quantity < 1 then
    raise exception 'Quantidade inválida.' using errcode = '23514';
  end if;

  select payload into item_payload
  from public.v2_content
  where id = p_item_id and content_type = 'item' and status = 'published';
  if item_payload is null then
    raise exception 'Item inválido ou não publicado.' using errcode = '23514';
  end if;

  stack_limit := case
    when coalesce((item_payload ->> 'stackable')::boolean, false)
      then coalesce((item_payload ->> 'maxStack')::integer, 1)
    else 1
  end;

  insert into public.v2_character_inventory (character_id, item_id, quantity)
  values (p_character_id, p_item_id, least(p_quantity, stack_limit))
  on conflict (character_id, item_id) do update
  set quantity = least(public.v2_character_inventory.quantity + excluded.quantity, stack_limit)
  returning * into granted;

  return granted;
end;
$$;

alter table public.v2_character_inventory enable row level security;

drop policy if exists "v2 inventory readable by owner or admin" on public.v2_character_inventory;
create policy "v2 inventory readable by owner or admin"
on public.v2_character_inventory for select
using (
  exists (
    select 1 from public.v2_characters
    where id = character_id and (user_id = auth.uid() or public.v2_is_admin())
  )
);

drop policy if exists "v2 inventory managed by admins" on public.v2_character_inventory;
create policy "v2 inventory managed by admins"
on public.v2_character_inventory for all
using (public.v2_is_admin())
with check (public.v2_is_admin());

grant select on public.v2_character_inventory to authenticated;
grant insert, update, delete on public.v2_character_inventory to authenticated;

revoke all on function public.v2_guard_inventory_row() from public;
revoke all on function public.v2_equip_inventory_item(uuid, text) from public;
revoke all on function public.v2_unequip_inventory_item(uuid) from public;
revoke all on function public.v2_grant_item(uuid, uuid, integer) from public;

grant execute on function public.v2_equip_inventory_item(uuid, text) to authenticated;
grant execute on function public.v2_unequip_inventory_item(uuid) to authenticated;
grant execute on function public.v2_grant_item(uuid, uuid, integer) to authenticated;

commit;
