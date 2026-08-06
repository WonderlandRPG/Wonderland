-- Wonderland: estrutura definitiva de itens e progressão automática de nível

create extension if not exists pgcrypto;

-- 1) Estrutura definitiva da tabela de itens
create table if not exists public.items (
  id uuid primary key default gen_random_uuid()
);

alter table public.items
  add column if not exists item_key text,
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists slot text,
  add column if not exists rarity text not null default 'Comum',
  add column if not exists price_wg bigint not null default 0,
  add column if not exists image_url text,
  add column if not exists icon_url text,
  add column if not exists for_bonus integer not null default 0,
  add column if not exists def_bonus integer not null default 0,
  add column if not exists res_bonus integer not null default 0,
  add column if not exists ini_bonus integer not null default 0,
  add column if not exists int_bonus integer not null default 0,
  add column if not exists arc_bonus integer not null default 0,
  add column if not exists two_handed boolean not null default false,
  add column if not exists occupy_two_slots boolean not null default false,
  add column if not exists active_shop boolean not null default true,
  add column if not exists required_level integer not null default 1,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists items_item_key_unique
  on public.items(item_key)
  where item_key is not null;

alter table public.items
  drop constraint if exists items_price_wg_check;
alter table public.items
  add constraint items_price_wg_check check (price_wg >= 0);

alter table public.items
  drop constraint if exists items_required_level_check;
alter table public.items
  add constraint items_required_level_check check (required_level between 1 and 100);

-- Mantém compatibilidade com colunas antigas, quando existirem.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='items' and column_name='base_value') then
    execute 'update public.items set price_wg = coalesce(price_wg, base_value, 0)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='items' and column_name='item_type') then
    execute 'update public.items set slot = coalesce(slot, item_type)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='items' and column_name='artwork_url') then
    execute 'update public.items set image_url = coalesce(image_url, artwork_url)';
  end if;
end $$;

-- 2) Tabela oficial de XP total
create table if not exists public.level_progression (
  level integer primary key,
  total_xp bigint not null unique
);

insert into public.level_progression(level,total_xp) values
(1,0),(2,100),(3,250),(4,450),(5,700),(6,1000),(7,1350),(8,1750),(9,2200),(10,2700),
(11,3400),(12,4150),(13,4950),(14,5700),(15,6500),(16,7600),(17,8700),(18,9950),(19,11200),(20,12500),
(21,14200),(22,15900),(23,17600),(24,19300),(25,21000),(26,23200),(27,25400),(28,27600),(29,29800),(30,32000),
(31,34800),(32,37600),(33,40400),(34,43200),(35,46000),(36,49400),(37,52800),(38,56200),(39,59600),(40,63000),
(41,67000),(42,71000),(43,75000),(44,79000),(45,83000),(46,87600),(47,92200),(48,96800),(49,101400),(50,106000),
(51,111200),(52,116400),(53,121600),(54,126800),(55,132000),(56,137800),(57,143600),(58,149400),(59,155200),(60,161000),
(61,167600),(62,174200),(63,180800),(64,187400),(65,194000),(66,201200),(67,208400),(68,215600),(69,222800),(70,230000),
(71,238000),(72,246000),(73,254000),(74,262000),(75,270000),(76,278800),(77,287600),(78,296400),(79,305200),(80,314000),
(81,323600),(82,333200),(83,342800),(84,352400),(85,362000),(86,372600),(87,383200),(88,393800),(89,404400),(90,415000),
(91,426400),(92,437800),(93,449200),(94,460600),(95,472000),(96,484600),(97,497200),(98,509800),(99,522400),(100,535000)
on conflict (level) do update set total_xp = excluded.total_xp;

create or replace function public.level_from_total_xp(p_xp bigint)
returns integer
language sql
stable
as $$
  select coalesce(max(level),1)
  from public.level_progression
  where total_xp <= greatest(coalesce(p_xp,0),0);
$$;

create or replace function public.sync_character_level_from_xp()
returns trigger
language plpgsql
as $$
begin
  new.experience := greatest(coalesce(new.experience,0),0);
  new.level := public.level_from_total_xp(new.experience);
  return new;
end;
$$;

drop trigger if exists characters_sync_level_from_xp on public.characters;
create trigger characters_sync_level_from_xp
before insert or update of experience on public.characters
for each row execute function public.sync_character_level_from_xp();

-- Corrige personagens já existentes.
update public.characters
set level = public.level_from_total_xp(experience);

notify pgrst, 'reload schema';
