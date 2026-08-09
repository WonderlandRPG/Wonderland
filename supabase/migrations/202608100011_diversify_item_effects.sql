-- Mantém o nome-base entre raridades e diversifica os efeitos estruturados.
begin;

with generated as (
  select upgraded.id, base.name, base.description
  from public.v2_shop_items upgraded
  join public.v2_shop_items base
    on base.rarity = 'common'
   and upgraded.slug = base.slug || '-' || upgraded.rarity
  where upgraded.rarity <> 'common'
)
update public.v2_shop_items item
set name = generated.name,
    description = generated.description,
    updated_at = now()
from generated
where item.id = generated.id;

with source as (
  select
    upgraded.id,
    upgraded.slug,
    upgraded.rarity,
    upgraded.slot,
    base.name as base_name,
    mod(abs(hashtext(base.slug)), 6) as family,
    case when upgraded.rarity = 'mythic' then 2 else 1 end as power
  from public.v2_shop_items upgraded
  join public.v2_shop_items base
    on base.rarity = 'common'
   and upgraded.slug = base.slug || '-' || upgraded.rarity
  where upgraded.rarity in ('legendary', 'mythic')
), effects as (
  select id, jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
    'key', slug || '-season-effect',
    'name', (case when rarity = 'mythic' then 'Ascensão: ' else 'Ressonância: ' end) || base_name,
    'description', case family
      when 0 then format('No início da batalha, concede +%s FOR e +%s INI.', 6 * power, 4 * power)
      when 1 then format('No início da batalha, concede +%s INT e +%s ARC.', 6 * power, 4 * power)
      when 2 then format('No início da batalha, aumenta o HP máximo em %s%% e concede %s de escudo.', 4 * power, 30 * power)
      when 3 then format('No início da batalha, concede +%s DEF, +%s RES e %s de escudo.', 5 * power, 5 * power, 20 * power)
      when 4 then format('No início da batalha, concede +%s INI, %s recurso de classe e %s recurso racial.', 7 * power, 2 * power, power)
      else format('No início da batalha, aumenta o HP máximo em %s%% e restaura até %s de Mana ou %s do recurso da classe.', 3 * power, 20 * power, 2 * power)
    end,
    'trigger', 'BATTLE_START',
    'duration', 0,
    'modifiers', case family
      when 0 then jsonb_build_object('FOR', 6 * power, 'INI', 4 * power)
      when 1 then jsonb_build_object('INT', 6 * power, 'ARC', 4 * power)
      when 3 then jsonb_build_object('DEF', 5 * power, 'RES', 5 * power)
      when 4 then jsonb_build_object('INI', 7 * power)
      else '{}'::jsonb
    end,
    'shield', case when family = 2 then 30 * power when family = 3 then 20 * power else 0 end,
    'maxHpPercent', case when family = 2 then 4 * power when family = 5 then 3 * power else 0 end,
    'mana', case when family = 5 then 20 * power else 0 end,
    'classResource', case when family in (4, 5) then 2 * power else 0 end,
    'raceResource', case when family = 4 then power else 0 end
  ))) as special_effects
  from source
)
update public.v2_shop_items item
set special_effects = effects.special_effects,
    updated_at = now()
from effects
where item.id = effects.id;

update public.v2_shop_items
set special_effects = '[]'::jsonb, updated_at = now()
where rarity not in ('legendary', 'mythic') and special_effects <> '[]'::jsonb;

commit;
