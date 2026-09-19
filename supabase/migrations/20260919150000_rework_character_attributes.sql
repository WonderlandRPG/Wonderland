-- Estrutura aditiva: preserva allocated_attributes para rollback e compatibilidade.
alter table public.v2_characters add column if not exists rework_attributes jsonb;
alter table public.v2_characters add column if not exists growth_profile text not null default 'custom';

alter table public.v2_characters drop constraint if exists v2_characters_growth_profile_check;
alter table public.v2_characters add constraint v2_characters_growth_profile_check check (growth_profile in ('aggressive','balanced','defensive','custom'));

create or replace function public._v2_migrate_rework_attributes(legacy jsonb) returns jsonb
language sql immutable set search_path = public, pg_temp as $$
  with weights(key, weight, priority) as (
    values
      ('FOR', greatest(coalesce((legacy->>'FOR')::numeric, 0), 0), 1),
      ('INT', greatest(coalesce((legacy->>'INT')::numeric, 0), 0), 2),
      ('DEF', greatest(coalesce((legacy->>'DEF')::numeric, 0), 0), 3),
      ('RES', greatest(coalesce((legacy->>'RES')::numeric, 0), 0), 4),
      ('HP',  greatest(coalesce((legacy->>'ARC')::numeric, 0), 0), 5),
      ('INI', greatest(coalesce((legacy->>'INI')::numeric, 0), 0), 6)
  ), totals as (
    select sum(weight) as total from weights
  ), shares as (
    select key, priority, 20 * weight / nullif(total, 0) as exact
    from weights cross join totals
  ), ranked as (
    select key, floor(exact)::integer as base,
      row_number() over (order by exact - floor(exact) desc, priority) as remainder_rank
    from shares
  ), missing as (
    select 20 - sum(base) as amount from ranked
  )
  select case when (select total from totals) = 0
    then '{"FOR":3,"INT":3,"DEF":3,"RES":3,"HP":4,"INI":4}'::jsonb
    else jsonb_object_agg(key, base + case when remainder_rank <= missing.amount then 1 else 0 end)
  end
  from ranked cross join missing;
$$;

alter table public.v2_characters disable trigger v2_characters_guard;

update public.v2_characters
set rework_attributes = public._v2_migrate_rework_attributes(allocated_attributes)
where rework_attributes is null;

alter table public.v2_characters enable trigger v2_characters_guard;

drop function public._v2_migrate_rework_attributes(jsonb);

alter table public.v2_characters alter column rework_attributes set default '{"FOR":0,"INT":0,"DEF":0,"RES":0,"HP":0,"INI":0}'::jsonb;

insert into public.v2_game_settings (key,category,label,description,value,status,published_at)
values ('character.rework_distributable_stars','rework_attributes','Estrelas por personagem','Quantidade de estrelas livres na criação.', '20'::jsonb,'published',now())
on conflict (key) do update set value=excluded.value,updated_at=now();
