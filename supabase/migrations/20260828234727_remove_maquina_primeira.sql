begin;

create temporary table removed_creature_missions on commit drop as
select
  mc.mission_id,
  row_number() over (order by mc.mission_id) as position,
  c.name as removed_name,
  c.behavior as removed_behavior
from public.v2_mission_creatures mc
join public.v2_creatures c on c.id = mc.creature_id
where c.slug = 'maquina-primeira';

-- Remove a criatura dos textos que foram enriquecidos automaticamente.
update public.v2_missions m
set
  description = replace(
    m.description,
    ' Relatos da Guilda identificam ' || affected.removed_name || ' no local. ' || affected.removed_behavior,
    ''
  ),
  objective = replace(
    m.objective,
    ' Use o Bestiário para explorar uma fraqueza conhecida de ' || affected.removed_name || '.',
    ''
  ),
  updated_at = now()
from removed_creature_missions affected
where m.id = affected.mission_id;

delete from public.v2_mission_creatures mc
using public.v2_creatures c
where mc.creature_id = c.id
  and c.slug = 'maquina-primeira';

delete from public.v2_creatures
where slug = 'maquina-primeira';

-- Mantém as missões afetadas com um encontro válido, usando outras ameaças EX.
with ranked_replacements as (
  select
    c.id,
    c.name,
    c.behavior,
    c.weaknesses,
    row_number() over (order by c.name, c.id) as position,
    count(*) over () as creature_count
  from public.v2_creatures c
  where c.active and c.rank = 'EX'
), replacement_by_mission as (
  select
    affected.mission_id,
    replacement.id as creature_id,
    replacement.name,
    replacement.behavior,
    replacement.weaknesses
  from removed_creature_missions affected
  join ranked_replacements replacement
    on replacement.position = ((affected.position - 1) % replacement.creature_count) + 1
), inserted as (
  insert into public.v2_mission_creatures(
    mission_id,
    creature_id,
    role,
    quantity_min,
    quantity_max,
    notes
  )
  select
    mission_id,
    creature_id,
    'target',
    1,
    case when cardinality(weaknesses) > 2 then 1 else 2 end,
    'Consulte o Bestiário antes de narrar o encontro.'
  from replacement_by_mission
  on conflict(mission_id, creature_id) do update
  set notes = excluded.notes
  returning mission_id, creature_id
)
update public.v2_missions m
set
  description = m.description || ' Relatos da Guilda identificam ' || c.name || ' no local. ' || c.behavior,
  objective = m.objective || ' Use o Bestiário para explorar uma fraqueza conhecida de ' || c.name || '.',
  updated_at = now()
from inserted replacement
join public.v2_creatures c on c.id = replacement.creature_id
where m.id = replacement.mission_id;

commit;
