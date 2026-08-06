-- Wonderland CMS consolidado e idempotente
-- Preserva dados existentes e recria apenas funções, triggers, views, índices e colunas ausentes.

create extension if not exists pgcrypto;

-- ============================================================================
-- FUNÇÕES E TRIGGERS ANTIGOS
-- ============================================================================

drop trigger if exists characters_sync_level_from_xp on public.characters;
drop trigger if exists items_touch_updated_at on public.items;

drop function if exists public.admin_save_item(jsonb);
drop function if exists public.admin_delete_item(text);
drop function if exists public.admin_delete_item(uuid);
drop function if exists public.sync_character_level_from_xp();
drop function if exists public.level_from_total_xp(bigint);
drop function if exists public.touch_items_updated_at();

-- ============================================================================
-- ITENS
-- ============================================================================

create table if not exists public.items (
  id uuid primary key default gen_random_uuid()
);

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
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Normaliza IDs nulos sem assumir se a coluna é text ou uuid.
do $$
declare
  v_id_type text;
begin
  select udt_name into v_id_type
  from information_schema.columns
  where table_schema='public' and table_name='items' and column_name='id';

  if v_id_type='uuid' then
    execute 'update public.items set id=gen_random_uuid() where id is null';
  elsif v_id_type in ('text','varchar','bpchar') then
    execute 'update public.items set id=gen_random_uuid()::text where id is null';
  end if;
end $$;

-- Remove checks antigos de raridade.
do $$
declare c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid='public.items'::regclass
      and contype='c'
      and pg_get_constraintdef(oid) ilike '%rarity%'
  loop
    execute format('alter table public.items drop constraint if exists %I', c.conname);
  end loop;
end $$;

update public.items
set rarity = case
  when lower(rarity)='comum' then 'Comum'
  when lower(rarity)='incomum' then 'Incomum'
  when lower(rarity)='raro' then 'Raro'
  when lower(rarity) in ('épico','epico') then 'Épico'
  when lower(rarity) in ('lendário','lendario') then 'Lendário'
  when lower(rarity) in ('mítico','mitico') then 'Mítico'
  else 'Comum'
end;

alter table public.items
  add constraint items_rarity_check
  check (rarity in ('Comum','Incomum','Raro','Épico','Lendário','Mítico'));

create unique index if not exists items_item_key_unique
on public.items(item_key)
where item_key is not null;

create or replace function public.touch_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger items_touch_updated_at
before update on public.items
for each row execute function public.touch_items_updated_at();

create function public.admin_save_item(p_item jsonb)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_role text;
  v_id_text text := nullif(trim(coalesce(p_item->>'id','')),'');
  v_item_key text := nullif(trim(coalesce(p_item->>'item_key','')),'');
  v_name text := nullif(trim(coalesce(p_item->>'name','')),'');
  v_rarity text := coalesce(nullif(trim(coalesce(p_item->>'rarity','')),''),'Comum');
  v_existing_id text;
  v_id_type text;
  v_saved jsonb;
begin
  select role into v_role from public.profiles where id=auth.uid();
  if coalesce(v_role,'') <> 'admin' then
    raise exception 'Apenas administradores podem salvar itens.';
  end if;

  if v_name is null then raise exception 'O nome do item é obrigatório.'; end if;
  if v_rarity not in ('Comum','Incomum','Raro','Épico','Lendário','Mítico') then v_rarity:='Comum'; end if;

  select udt_name into v_id_type
  from information_schema.columns
  where table_schema='public' and table_name='items' and column_name='id';

  if v_id_text is not null then
    execute 'select id::text from public.items where id::text=$1 limit 1'
      into v_existing_id using v_id_text;
  end if;

  if v_existing_id is null and v_item_key is not null then
    select id::text into v_existing_id from public.items where item_key=v_item_key limit 1;
  end if;

  if v_existing_id is null then
    select id::text into v_existing_id from public.items where lower(name)=lower(v_name) limit 1;
  end if;

  if v_existing_id is not null then
    execute $sql$
      update public.items set
        item_key=$1,name=$2,description=$3,slot=$4,rarity=$5,price_wg=$6,
        image_url=$7,icon_url=$8,for_bonus=$9,def_bonus=$10,res_bonus=$11,ini_bonus=$12,
        int_bonus=$13,arc_bonus=$14,two_handed=$15,occupy_two_slots=$16,
        active_shop=$17,required_level=$18
      where id::text=$19
      returning to_jsonb(public.items.*)
    $sql$ into v_saved using
      v_item_key,v_name,coalesce(p_item->>'description',''),coalesce(nullif(p_item->>'slot',''),'head'),v_rarity,
      greatest(coalesce(nullif(p_item->>'price_wg','')::bigint,0),0),
      nullif(p_item->>'image_url',''),nullif(p_item->>'icon_url',''),
      greatest(coalesce(nullif(p_item->>'for_bonus','')::int,0),0),
      greatest(coalesce(nullif(p_item->>'def_bonus','')::int,0),0),
      greatest(coalesce(nullif(p_item->>'res_bonus','')::int,0),0),
      greatest(coalesce(nullif(p_item->>'ini_bonus','')::int,0),0),
      greatest(coalesce(nullif(p_item->>'int_bonus','')::int,0),0),
      greatest(coalesce(nullif(p_item->>'arc_bonus','')::int,0),0),
      coalesce(nullif(p_item->>'two_handed','')::boolean,false),
      coalesce(nullif(p_item->>'occupy_two_slots','')::boolean,false),
      coalesce(nullif(p_item->>'active_shop','')::boolean,true),
      greatest(1,least(100,coalesce(nullif(p_item->>'required_level','')::int,1))),
      v_existing_id;
  elsif v_id_type='uuid' then
    execute $sql$
      insert into public.items(
        id,item_key,name,description,slot,rarity,price_wg,image_url,icon_url,
        for_bonus,def_bonus,res_bonus,ini_bonus,int_bonus,arc_bonus,
        two_handed,occupy_two_slots,active_shop,required_level
      ) values (
        gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
      ) returning to_jsonb(public.items.*)
    $sql$ into v_saved using
      v_item_key,v_name,coalesce(p_item->>'description',''),coalesce(nullif(p_item->>'slot',''),'head'),v_rarity,
      greatest(coalesce(nullif(p_item->>'price_wg','')::bigint,0),0),
      nullif(p_item->>'image_url',''),nullif(p_item->>'icon_url',''),
      greatest(coalesce(nullif(p_item->>'for_bonus','')::int,0),0),
      greatest(coalesce(nullif(p_item->>'def_bonus','')::int,0),0),
      greatest(coalesce(nullif(p_item->>'res_bonus','')::int,0),0),
      greatest(coalesce(nullif(p_item->>'ini_bonus','')::int,0),0),
      greatest(coalesce(nullif(p_item->>'int_bonus','')::int,0),0),
      greatest(coalesce(nullif(p_item->>'arc_bonus','')::int,0),0),
      coalesce(nullif(p_item->>'two_handed','')::boolean,false),
      coalesce(nullif(p_item->>'occupy_two_slots','')::boolean,false),
      coalesce(nullif(p_item->>'active_shop','')::boolean,true),
      greatest(1,least(100,coalesce(nullif(p_item->>'required_level','')::int,1)));
  elsif v_id_type in ('text','varchar','bpchar') then
    execute $sql$
      insert into public.items(
        id,item_key,name,description,slot,rarity,price_wg,image_url,icon_url,
        for_bonus,def_bonus,res_bonus,ini_bonus,int_bonus,arc_bonus,
        two_handed,occupy_two_slots,active_shop,required_level
      ) values (
        coalesce($19,gen_random_uuid()::text),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
      ) returning to_jsonb(public.items.*)
    $sql$ into v_saved using
      v_item_key,v_name,coalesce(p_item->>'description',''),coalesce(nullif(p_item->>'slot',''),'head'),v_rarity,
      greatest(coalesce(nullif(p_item->>'price_wg','')::bigint,0),0),
      nullif(p_item->>'image_url',''),nullif(p_item->>'icon_url',''),
      greatest(coalesce(nullif(p_item->>'for_bonus','')::int,0),0),
      greatest(coalesce(nullif(p_item->>'def_bonus','')::int,0),0),
      greatest(coalesce(nullif(p_item->>'res_bonus','')::int,0),0),
      greatest(coalesce(nullif(p_item->>'ini_bonus','')::int,0),0),
      greatest(coalesce(nullif(p_item->>'int_bonus','')::int,0),0),
      greatest(coalesce(nullif(p_item->>'arc_bonus','')::int,0),0),
      coalesce(nullif(p_item->>'two_handed','')::boolean,false),
      coalesce(nullif(p_item->>'occupy_two_slots','')::boolean,false),
      coalesce(nullif(p_item->>'active_shop','')::boolean,true),
      greatest(1,least(100,coalesce(nullif(p_item->>'required_level','')::int,1))),
      v_id_text;
  else
    raise exception 'Tipo incompatível para items.id: %',v_id_type;
  end if;

  if v_saved is null then raise exception 'O item não foi salvo.'; end if;
  return v_saved;
end $$;

grant execute on function public.admin_save_item(jsonb) to authenticated;

create function public.admin_delete_item(p_id text)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare v_role text;
begin
  select role into v_role from public.profiles where id=auth.uid();
  if coalesce(v_role,'') <> 'admin' then
    raise exception 'Apenas administradores podem excluir itens.';
  end if;
  execute 'delete from public.items where id::text=$1' using p_id;
end $$;

grant execute on function public.admin_delete_item(text) to authenticated;

-- ============================================================================
-- PROGRESSÃO
-- ============================================================================

create table if not exists public.level_progression(
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
on conflict(level) do update set total_xp=excluded.total_xp;

create function public.level_from_total_xp(p_xp bigint)
returns integer
language sql
stable
as $$
  select coalesce(max(level),1)
  from public.level_progression
  where total_xp<=greatest(coalesce(p_xp,0),0);
$$;

create function public.sync_character_level_from_xp()
returns trigger
language plpgsql
as $$
begin
  new.experience:=greatest(coalesce(new.experience,0),0);
  new.level:=public.level_from_total_xp(new.experience);
  return new;
end $$;

create trigger characters_sync_level_from_xp
before insert or update of experience on public.characters
for each row execute function public.sync_character_level_from_xp();

update public.characters
set level=public.level_from_total_xp(experience);

notify pgrst,'reload schema';
