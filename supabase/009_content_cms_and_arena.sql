-- Wonderland: CMS de conteúdo e integração da Arena
create extension if not exists pgcrypto;

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
  passive_key text unique,
  name text not null,
  description text not null default '',
  source_type text not null check (source_type in ('race','class','path')),
  race_id text references public.races(id) on delete cascade,
  class_id text references public.classes(id) on delete cascade,
  class_path_id text references public.class_paths(id) on delete cascade,
  effect_schema jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  check (
    (source_type='race' and race_id is not null and class_id is null and class_path_id is null) or
    (source_type='class' and class_id is not null and race_id is null and class_path_id is null) or
    (source_type='path' and class_path_id is not null and race_id is null)
  )
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  skill_key text unique,
  name text not null,
  description text not null default '',
  category text,
  source_type text not null check (source_type in ('race','class','path')),
  race_id text references public.races(id) on delete cascade,
  class_id text references public.classes(id) on delete cascade,
  class_path_id text references public.class_paths(id) on delete cascade,
  unlock_level integer not null default 1 check (unlock_level between 1 and 100),
  mana_cost integer not null default 0 check (mana_cost >= 0),
  cooldown_turns integer not null default 0 check (cooldown_turns >= 0),
  range_cells integer not null default 1 check (range_cells >= 0),
  area_cells integer not null default 0 check (area_cells >= 0),
  duration_turns integer not null default 0 check (duration_turns >= 0),
  uses_per_combat integer,
  target_type text not null default 'enemy' check (target_type in ('enemy','self','ally','area')),
  damage_type text not null default 'physical' check (damage_type in ('physical','magical','true','none')),
  scale_attribute text check (scale_attribute in ('FOR','DEF','RES','INI','INT','ARC')),
  scale_percent numeric(8,2) not null default 0,
  effect_schema jsonb not null default '[]'::jsonb,
  is_passive boolean not null default false,
  is_ultimate boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  check (
    (source_type='race' and race_id is not null and class_id is null and class_path_id is null) or
    (source_type='class' and class_id is not null and race_id is null and class_path_id is null) or
    (source_type='path' and class_path_id is not null and race_id is null)
  )
);

create table if not exists public.combat_mechanics (
  mechanic_key text primary key,
  source_type text not null check (source_type in ('race','class','path','global')),
  race_id text references public.races(id) on delete cascade,
  class_id text references public.classes(id) on delete cascade,
  class_path_id text references public.class_paths(id) on delete cascade,
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
select
  s.id,s.skill_key,s.name,s.description,s.category,s.source_type,s.race_id,s.class_id,s.class_path_id,
  s.unlock_level,s.mana_cost,s.cooldown_turns,s.range_cells,s.area_cells,s.duration_turns,
  s.uses_per_combat,s.target_type,s.damage_type,s.scale_attribute,s.scale_percent,s.effect_schema,
  s.is_passive,s.is_ultimate,s.is_active,s.sort_order
from public.skills s
where s.is_active = true;

create or replace view public.arena_passive_catalog as
select
  p.id,p.passive_key,p.name,p.description,p.source_type,p.race_id,p.class_id,p.class_path_id,
  p.effect_schema,p.is_active,p.sort_order
from public.passives p
where p.is_active = true;

create or replace function public.touch_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['races','classes','class_paths','passives','skills','combat_mechanics'] LOOP
    EXECUTE format('drop trigger if exists %I_touch_updated_at on public.%I', t, t);
    EXECUTE format('create trigger %I_touch_updated_at before update on public.%I for each row execute function public.touch_content_updated_at()', t, t);
  END LOOP;
END $$;

-- Leitura pública autenticada; escrita restrita a admin via RLS.
alter table public.races enable row level security;
alter table public.classes enable row level security;
alter table public.class_paths enable row level security;
alter table public.passives enable row level security;
alter table public.skills enable row level security;
alter table public.combat_mechanics enable row level security;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['races','classes','class_paths','passives','skills','combat_mechanics'] LOOP
    EXECUTE format('drop policy if exists %I_read on public.%I', t, t);
    EXECUTE format('create policy %I_read on public.%I for select to authenticated using (true)', t, t);
    EXECUTE format('drop policy if exists %I_admin_write on public.%I', t, t);
    EXECUTE format($f$create policy %I_admin_write on public.%I for all to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'))$f$, t, t);
  END LOOP;
END $$;

notify pgrst, 'reload schema';
