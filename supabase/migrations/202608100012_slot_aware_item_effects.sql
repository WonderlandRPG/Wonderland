-- Distribui efeitos de temporada conforme a função real de cada slot e seus atributos.
begin;

with source as (
  select
    upgraded.id,
    upgraded.slug,
    upgraded.rarity,
    upgraded.slot,
    base.name as base_name,
    case
      when upgraded.slot = 'main_weapon' and
        (coalesce((base.attributes->>'INT')::int, 0) + coalesce((base.attributes->>'ARC')::int, 0)) >
        (coalesce((base.attributes->>'FOR')::int, 0) + coalesce((base.attributes->>'INI')::int, 0)) then 1
      when upgraded.slot = 'main_weapon' and coalesce((base.attributes->>'INI')::int, 0) > coalesce((base.attributes->>'FOR')::int, 0) then 4
      when upgraded.slot = 'main_weapon' then 0
      when upgraded.slot = 'off_weapon' then 3
      when upgraded.slot in ('head', 'torso', 'cape') then case when mod(base.sort_order, 2) = 0 then 2 else 3 end
      when upgraded.slot = 'hands' and
        (coalesce((base.attributes->>'INT')::int, 0) + coalesce((base.attributes->>'ARC')::int, 0)) >
        (coalesce((base.attributes->>'FOR')::int, 0) + coalesce((base.attributes->>'INI')::int, 0)) then 1
      when upgraded.slot = 'hands' then 0
      when upgraded.slot in ('legs', 'feet') then case when coalesce((base.attributes->>'INI')::int, 0) > 0 then 4 else 2 end
      else 5
    end as family,
    case when upgraded.rarity = 'mythic' then 2 else 1 end as power
  from public.v2_shop_items upgraded
  join public.v2_shop_items base
    on base.rarity = 'common'
   and upgraded.slug = base.slug || '-' || upgraded.rarity
  where upgraded.rarity in ('legendary', 'mythic')
), effects as (
  select id, jsonb_build_array(jsonb_build_object(
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
    'trigger', 'BATTLE_START', 'duration', 0,
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
  )) as special_effects
  from source
)
update public.v2_shop_items item
set special_effects = effects.special_effects, updated_at = now()
from effects
where item.id = effects.id;

commit;
