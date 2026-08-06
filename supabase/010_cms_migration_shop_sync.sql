-- Wonderland: migração robusta do CMS, sincronização de itens e progresso
create extension if not exists pgcrypto;

-- ITENS ----------------------------------------------------------------------
create table if not exists public.items (
  id uuid primary key default gen_random_uuid()
);

alter table public.items
  alter column id set default gen_random_uuid();

update public.items set id = gen_random_uuid() where id is null;

alter table public.items
  alter column id set not null;

alter table public.items
  add column if not exists item_key text,
  add column if not exists name text,
  add column if not exists description text not null default '',
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
  add column if not exists updated_at timestamptz not null default now();

-- Remove checks antigos que impediam raridades válidas.
do $$
declare c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid='public.items'::regclass and contype='c'
      and pg_get_constraintdef(oid) ilike '%rarity%'
  loop
    execute format('alter table public.items drop constraint if exists %I',c.conname);
  end loop;
end $$;

update public.items set rarity='Épico' where lower(unaccent(rarity))='epico';
update public.items set rarity='Mítico' where lower(unaccent(rarity))='mitico';
update public.items set rarity='Lendário' where lower(unaccent(rarity))='lendario';

alter table public.items
  add constraint items_rarity_check
  check (rarity in ('Comum','Incomum','Raro','Épico','Lendário','Mítico'));

create unique index if not exists items_item_key_unique_full
on public.items(item_key)
where item_key is not null;

create or replace function public.touch_items_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end $$;

drop trigger if exists items_touch_updated_at on public.items;
create trigger items_touch_updated_at before update on public.items
for each row execute function public.touch_items_updated_at();

create or replace function public.admin_save_item(p_item jsonb)
returns public.items
language plpgsql
security definer
set search_path=public
as $$
declare
  v_role text;
  v_row public.items;
  v_id uuid;
  v_key text:=nullif(trim(p_item->>'item_key'),'');
  v_rarity text:=coalesce(nullif(trim(p_item->>'rarity'),''),'Comum');
begin
  select role into v_role from public.profiles where id=auth.uid();
  if coalesce(v_role,'')<>'admin' then raise exception 'Apenas administradores podem salvar itens.'; end if;
  if v_rarity not in ('Comum','Incomum','Raro','Épico','Lendário','Mítico') then v_rarity:='Comum'; end if;
  begin v_id:=nullif(p_item->>'id','')::uuid; exception when others then v_id:=null; end;
  if v_id is null and v_key is not null then select id into v_id from public.items where item_key=v_key limit 1; end if;
  if v_id is null and nullif(trim(p_item->>'name'),'') is not null then select id into v_id from public.items where lower(name)=lower(trim(p_item->>'name')) limit 1; end if;

  if v_id is null then
    insert into public.items(
      id,item_key,name,description,slot,rarity,price_wg,image_url,icon_url,
      for_bonus,def_bonus,res_bonus,ini_bonus,int_bonus,arc_bonus,
      two_handed,occupy_two_slots,active_shop,required_level
    ) values (
      gen_random_uuid(),v_key,trim(p_item->>'name'),coalesce(p_item->>'description',''),
      coalesce(nullif(p_item->>'slot',''),'head'),v_rarity,
      greatest(coalesce((p_item->>'price_wg')::bigint,0),0),nullif(p_item->>'image_url',''),nullif(p_item->>'icon_url',''),
      greatest(coalesce((p_item->>'for_bonus')::int,0),0),greatest(coalesce((p_item->>'def_bonus')::int,0),0),
      greatest(coalesce((p_item->>'res_bonus')::int,0),0),greatest(coalesce((p_item->>'ini_bonus')::int,0),0),
      greatest(coalesce((p_item->>'int_bonus')::int,0),0),greatest(coalesce((p_item->>'arc_bonus')::int,0),0),
      coalesce((p_item->>'two_handed')::boolean,false),coalesce((p_item->>'occupy_two_slots')::boolean,false),
      coalesce((p_item->>'active_shop')::boolean,true),greatest(1,least(100,coalesce((p_item->>'required_level')::int,1)))
    ) returning * into v_row;
  else
    update public.items set
      item_key=v_key,name=trim(p_item->>'name'),description=coalesce(p_item->>'description',''),
      slot=coalesce(nullif(p_item->>'slot',''),'head'),rarity=v_rarity,
      price_wg=greatest(coalesce((p_item->>'price_wg')::bigint,0),0),
      image_url=nullif(p_item->>'image_url',''),icon_url=nullif(p_item->>'icon_url',''),
      for_bonus=greatest(coalesce((p_item->>'for_bonus')::int,0),0),
      def_bonus=greatest(coalesce((p_item->>'def_bonus')::int,0),0),
      res_bonus=greatest(coalesce((p_item->>'res_bonus')::int,0),0),
      ini_bonus=greatest(coalesce((p_item->>'ini_bonus')::int,0),0),
      int_bonus=greatest(coalesce((p_item->>'int_bonus')::int,0),0),
      arc_bonus=greatest(coalesce((p_item->>'arc_bonus')::int,0),0),
      two_handed=coalesce((p_item->>'two_handed')::boolean,false),
      occupy_two_slots=coalesce((p_item->>'occupy_two_slots')::boolean,false),
      active_shop=coalesce((p_item->>'active_shop')::boolean,true),
      required_level=greatest(1,least(100,coalesce((p_item->>'required_level')::int,1)))
    where id=v_id returning * into v_row;
  end if;
  return v_row;
end $$;

grant execute on function public.admin_save_item(jsonb) to authenticated;

-- CMS DE CONTEÚDO -------------------------------------------------------------
create table if not exists public.races (
  id text primary key,
  name text not null,
  description text not null default '',
  tagline text,
  archetype text,
  difficulty integer not null default 1,
  base_hp integer not null default 500,
  base_mana integer not null default 0,
  mechanic_name text,
  mechanic_description text,
  icon text,
  artwork_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.races
  add column if not exists mechanic_name text,
  add column if not exists mechanic_description text,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.classes (
  id text primary key,
  name text not null,
  description text not null default '',
  role text,
  specialization text,
  difficulty integer not null default 1,
  primary_attribute text,
  secondary_attribute text,
  strengths text,
  weaknesses text,
  resource_name text,
  resource_description text,
  icon text,
  artwork_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.classes add column if not exists updated_at timestamptz not null default now();

create table if not exists public.class_paths (
  id text primary key,
  class_id text not null references public.classes(id) on delete cascade,
  name text not null,
  description text not null default '',
  specialization text,
  complexity text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.passives (
  id uuid primary key default gen_random_uuid(),
  passive_key text,
  name text not null,
  description text not null default '',
  source_type text not null default 'class',
  race_id text,
  class_id text,
  class_path_id text,
  effect_schema jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.passives
  add column if not exists passive_key text,
  add column if not exists effect_schema jsonb not null default '[]'::jsonb,
  add column if not exists class_path_id text,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists passives_passive_key_unique on public.passives(passive_key) where passive_key is not null;

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid()
);

alter table public.skills
  add column if not exists skill_key text,
  add column if not exists name text,
  add column if not exists description text not null default '',
  add column if not exists category text,
  add column if not exists source_type text not null default 'class',
  add column if not exists race_id text,
  add column if not exists class_id text,
  add column if not exists class_path_id text,
  add column if not exists unlock_level integer not null default 1,
  add column if not exists mana_cost integer not null default 0,
  add column if not exists cooldown_turns integer not null default 0,
  add column if not exists range_cells integer not null default 1,
  add column if not exists area_cells integer not null default 0,
  add column if not exists duration_turns integer not null default 0,
  add column if not exists uses_per_combat integer,
  add column if not exists target_type text not null default 'enemy',
  add column if not exists damage_type text not null default 'physical',
  add column if not exists scale_attribute text,
  add column if not exists scale_percent numeric(8,2) not null default 0,
  add column if not exists effect_schema jsonb not null default '[]'::jsonb,
  add column if not exists is_passive boolean not null default false,
  add column if not exists is_ultimate boolean not null default false,
  add column if not exists is_active boolean not null default true,
  add column if not exists sort_order integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists skills_skill_key_unique on public.skills(skill_key) where skill_key is not null;

create table if not exists public.combat_mechanics (
  mechanic_key text primary key,
  source_type text not null default 'global',
  race_id text,
  class_id text,
  class_path_id text,
  name text not null,
  description text not null default '',
  initial_value numeric not null default 0,
  max_value numeric,
  gain_schema jsonb not null default '[]'::jsonb,
  spend_schema jsonb not null default '[]'::jsonb,
  effect_schema jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create or replace view public.arena_skill_catalog as
select id,skill_key,name,description,category,source_type,race_id,class_id,class_path_id,
unlock_level,mana_cost,cooldown_turns,range_cells,area_cells,duration_turns,uses_per_combat,
target_type,damage_type,scale_attribute,scale_percent,effect_schema,is_passive,is_ultimate,is_active,sort_order
from public.skills where is_active=true;

create or replace view public.arena_passive_catalog as
select id,passive_key,name,description,source_type,race_id,class_id,class_path_id,effect_schema,is_active,sort_order
from public.passives where is_active=true;

-- PROGRESSÃO ------------------------------------------------------------------
create table if not exists public.level_progression(level integer primary key,total_xp bigint not null unique);
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
on conflict(level) do update set total_xp=excluded.total_xp;

create or replace function public.level_from_total_xp(p_xp bigint)
returns integer language sql stable as $$
select coalesce(max(level),1) from public.level_progression where total_xp<=greatest(coalesce(p_xp,0),0);
$$;

create or replace function public.sync_character_level_from_xp()
returns trigger language plpgsql as $$
begin
  new.experience:=greatest(coalesce(new.experience,0),0);
  new.level:=public.level_from_total_xp(new.experience);
  return new;
end $$;

drop trigger if exists characters_sync_level_from_xp on public.characters;
create trigger characters_sync_level_from_xp before insert or update of experience on public.characters
for each row execute function public.sync_character_level_from_xp();

update public.characters set level=public.level_from_total_xp(experience);

notify pgrst,'reload schema';
