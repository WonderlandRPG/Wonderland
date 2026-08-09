begin;

create table if not exists public.v2_characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 32),
  race_id uuid not null references public.v2_content(id) on delete restrict,
  class_id uuid not null references public.v2_content(id) on delete restrict,
  class_path_key text,
  level integer not null default 1 check (level between 1 and 100),
  xp bigint not null default 0 check (xp >= 0),
  allocated_attributes jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists v2_characters_owner_idx
  on public.v2_characters (user_id, created_at);

create or replace function public.v2_character_attribute_total(p_attributes jsonb)
returns integer
language plpgsql
immutable
set search_path = public
as $$
declare
  entry record;
  total numeric := 0;
begin
  if jsonb_typeof(p_attributes) <> 'object'
    or (select count(*) from jsonb_object_keys(p_attributes)) <> 6
  then
    return -1;
  end if;

  for entry in select key, value from jsonb_each(p_attributes)
  loop
    if entry.key not in ('FOR', 'DEF', 'RES', 'INI', 'INT', 'ARC')
      or jsonb_typeof(entry.value) <> 'number'
      or (entry.value::text)::numeric < 0
      or (entry.value::text)::numeric <> trunc((entry.value::text)::numeric)
    then
      return -1;
    end if;
    total := total + (entry.value::text)::numeric;
  end loop;

  return total::integer;
exception when others then
  return -1;
end;
$$;

create or replace function public.v2_guard_character()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed_points integer := 100;
  maximum_slots integer := 3;
begin
  select coalesce((value #>> '{}')::integer, 100)
  into allowed_points
  from public.v2_game_settings
  where key = 'character.distributable_points' and status = 'published';

  select coalesce((value #>> '{}')::integer, 3)
  into maximum_slots
  from public.v2_game_settings
  where key = 'character.maximum_slots' and status = 'published';

  allowed_points := coalesce(allowed_points, 100);
  maximum_slots := coalesce(maximum_slots, 3);

  if tg_op = 'INSERT' and not public.v2_is_admin() then
    new.user_id := auth.uid();
    new.level := 1;
    new.xp := 0;
    new.class_path_key := null;
  end if;

  if auth.uid() is null or (new.user_id <> auth.uid() and not public.v2_is_admin()) then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' and (
    select count(*) from public.v2_characters where user_id = new.user_id
  ) >= maximum_slots then
    raise exception 'Limite de personagens atingido.' using errcode = '23514';
  end if;

  if public.v2_character_attribute_total(new.allocated_attributes) <> allowed_points then
    raise exception 'Distribua exatamente % pontos.', allowed_points using errcode = '23514';
  end if;

  if not exists (
    select 1 from public.v2_content
    where id = new.race_id and content_type = 'race' and status = 'published'
  ) then
    raise exception 'Raça inválida ou não publicada.' using errcode = '23514';
  end if;

  if not exists (
    select 1 from public.v2_content
    where id = new.class_id and content_type = 'class' and status = 'published'
  ) then
    raise exception 'Classe inválida ou não publicada.' using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' and not public.v2_is_admin() then
    if new.user_id <> old.user_id
      or new.race_id <> old.race_id
      or new.class_id <> old.class_id
      or new.level <> old.level
      or new.xp <> old.xp
      or new.allocated_attributes <> old.allocated_attributes
      or new.class_path_key is distinct from old.class_path_key
    then
      raise exception 'Campos de progressão não podem ser alterados diretamente.' using errcode = '42501';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists v2_characters_guard on public.v2_characters;
create trigger v2_characters_guard
before insert or update on public.v2_characters
for each row execute function public.v2_guard_character();

alter table public.v2_characters enable row level security;

drop policy if exists "v2 characters readable by owner or admin" on public.v2_characters;
create policy "v2 characters readable by owner or admin"
on public.v2_characters for select
using (user_id = auth.uid() or public.v2_is_admin());

drop policy if exists "v2 characters creatable by owner or admin" on public.v2_characters;
create policy "v2 characters creatable by owner or admin"
on public.v2_characters for insert
with check (user_id = auth.uid() or public.v2_is_admin());

drop policy if exists "v2 characters editable by owner or admin" on public.v2_characters;
create policy "v2 characters editable by owner or admin"
on public.v2_characters for update
using (user_id = auth.uid() or public.v2_is_admin())
with check (user_id = auth.uid() or public.v2_is_admin());

drop policy if exists "v2 characters deletable by owner or admin" on public.v2_characters;
create policy "v2 characters deletable by owner or admin"
on public.v2_characters for delete
using (user_id = auth.uid() or public.v2_is_admin());

grant select, insert, update, delete on public.v2_characters to authenticated;

revoke all on function public.v2_character_attribute_total(jsonb) from public;
grant execute on function public.v2_character_attribute_total(jsonb) to authenticated;

revoke all on function public.v2_guard_character() from public;

commit;
