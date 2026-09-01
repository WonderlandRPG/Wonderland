alter table public.v2_creatures
  add column if not exists combat_profile jsonb not null default '{}'::jsonb;

alter table public.v2_creatures
  drop constraint if exists v2_creatures_combat_profile_object;

alter table public.v2_creatures
  add constraint v2_creatures_combat_profile_object
  check (jsonb_typeof(combat_profile) = 'object');

update public.v2_creatures
set combat_profile = jsonb_build_object(
  'version', 1,
  'hp', case rank
    when 'E' then 300 when 'D' then 450 when 'C' then 650 when 'B' then 900
    when 'A' then 1300 when 'S' then 1800 when 'EX' then 2500 else 450 end,
  'attributes', jsonb_build_object(
    'FOR', case rank when 'E' then 40 when 'D' then 55 when 'C' then 75 when 'B' then 100 when 'A' then 135 when 'S' then 180 when 'EX' then 240 else 55 end,
    'DEF', case rank when 'E' then 35 when 'D' then 50 when 'C' then 70 when 'B' then 95 when 'A' then 130 when 'S' then 175 when 'EX' then 235 else 50 end,
    'RES', case rank when 'E' then 35 when 'D' then 50 when 'C' then 70 when 'B' then 95 when 'A' then 130 when 'S' then 175 when 'EX' then 235 else 50 end,
    'INI', case rank when 'E' then 35 when 'D' then 50 when 'C' then 70 when 'B' then 95 when 'A' then 125 when 'S' then 165 when 'EX' then 220 else 50 end,
    'INT', case rank when 'E' then 35 when 'D' then 50 when 'C' then 70 when 'B' then 95 when 'A' then 130 when 'S' then 175 when 'EX' then 235 else 50 end,
    'ARC', case rank when 'E' then 30 when 'D' then 45 when 'C' then 65 when 'B' then 90 when 'A' then 125 when 'S' then 170 when 'EX' then 230 else 45 end
  ),
  'movement', case rank when 'S' then 4 when 'EX' then 4 else 3 end,
  'basicAttackRange', case
    when lower(behavior) ~ '(distância|dispara|cospe|raio|projétil|espinho|lamento|sopro)' then 3
    else 1 end,
  'basicAttackDamageType', case
    when lower(behavior) ~ '(magia|mágic|runa|raio|energia|lamento|encanta|elemental)' then 'magic'
    else 'physical' end,
  'aiProfile', case
    when lower(behavior) ~ '(imobil|control|enfraque|encanta|anula|medo|força inimigos|drena)' then 'controller'
    when lower(behavior) ~ '(distância|dispara|cospe|raio|projétil|espinho|lamento|sopro|voo)' then 'ranged'
    else 'aggressive' end,
  'resistances', '[]'::jsonb,
  'skills', '[]'::jsonb
)
where combat_profile = '{}'::jsonb
   or coalesce((combat_profile->>'version')::int, 0) < 1;
