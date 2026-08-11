-- Substitui os bônus genéricos por efeitos de RPG e dá um nome lógico a cada raridade.
begin;

with source as (
  select
    upgraded.id,
    upgraded.slug,
    upgraded.rarity,
    upgraded.slot,
    base.name as base_name,
    case
      when (coalesce((base.attributes->>'INT')::int, 0) + coalesce((base.attributes->>'ARC')::int, 0)) >
           (coalesce((base.attributes->>'FOR')::int, 0) + coalesce((base.attributes->>'INI')::int, 0))
        then 'arcane'
      when base.slot in ('head', 'torso', 'hands', 'legs', 'feet', 'cape') then 'armor'
      when base.slot in ('main_weapon', 'off_weapon') then 'weapon'
      else 'trinket'
    end as item_family,
    mod(abs(hashtext(base.slug)), 5) as effect_family
  from public.v2_shop_items upgraded
  join public.v2_shop_items base
    on base.rarity = 'common'
   and upgraded.slug = base.slug || '-' || upgraded.rarity
  where upgraded.rarity <> 'common'
), renamed as (
  select
    id,
    case rarity
      when 'uncommon' then base_name || ' Reforçado'
      when 'rare' then base_name || case item_family
        when 'arcane' then ' de Cristal Arcano'
        when 'armor' then ' de Malha Encantada'
        when 'weapon' then ' de Aço Temperado'
        else ' de Runas Precisas'
      end
      when 'epic' then base_name || case item_family
        when 'arcane' then ' do Fluxo Magistral'
        when 'armor' then ' da Guarda Real'
        when 'weapon' then ' do Mestre de Armas'
        else ' do Alto Encanto'
      end
      when 'legendary' then base_name || case effect_family
        when 0 then ' do Veneno Persistente'
        when 1 then ' da Ferida Profunda'
        when 2 then ' da Sede Vital'
        when 3 then ' do Fluxo Acelerado'
        else ' do Gelo Eterno'
      end
      when 'mythic' then base_name || case effect_family
        when 0 then ' da Praga Alquímica'
        when 1 then ' da Hemorragia Implacável'
        when 2 then ' do Banquete Carmesim'
        when 3 then ' do Tempo Fraturado'
        else ' do Inverno Absoluto'
      end
    end as item_name
  from source
)
update public.v2_shop_items item
set name = renamed.item_name,
    updated_at = now()
from renamed
where item.id = renamed.id;

with source as (
  select
    upgraded.id,
    upgraded.slug,
    upgraded.rarity,
    mod(abs(hashtext(base.slug)), 5) as family,
    upgraded.rarity = 'mythic' as is_mythic
  from public.v2_shop_items upgraded
  join public.v2_shop_items base
    on base.rarity = 'common'
   and upgraded.slug = base.slug || '-' || upgraded.rarity
  where upgraded.rarity in ('legendary', 'mythic')
), effects as (
  select
    id,
    jsonb_build_array(jsonb_build_object(
      'key', slug || '-rpg-effect',
      'kind', case family
        when 0 then 'POISON'
        when 1 then 'BLEED'
        when 2 then 'LIFE_STEAL'
        when 3 then 'COOLDOWN_REDUCTION'
        else 'FREEZE'
      end,
      'trigger', case when family = 3 then 'ON_SKILL_USE' else 'ON_DAMAGE_DEALT' end,
      'name', case family
        when 0 then case when is_mythic then 'Praga Alquímica' else 'Veneno Persistente' end
        when 1 then case when is_mythic then 'Hemorragia Implacável' else 'Ferida Profunda' end
        when 2 then case when is_mythic then 'Banquete Carmesim' else 'Sede Vital' end
        when 3 then case when is_mythic then 'Tempo Fraturado' else 'Fluxo Acelerado' end
        else case when is_mythic then 'Inverno Absoluto' else 'Gelo Eterno' end
      end,
      'description', case family
        when 0 then format('Seus ataques aplicam Envenenamento, causando %s de dano verdadeiro por rodada durante %s rodadas.', case when is_mythic then 16 else 8 end, case when is_mythic then 4 else 3 end)
        when 1 then format('Seus ataques aplicam Sangramento, causando %s de dano físico por rodada durante %s rodadas.', case when is_mythic then 20 else 10 end, case when is_mythic then 3 else 2 end)
        when 2 then format('Você recupera %s%% do dano causado como HP.', case when is_mythic then 22 else 10 end)
        when 3 then format('Reduz em %s rodada(s) a recarga das habilidades usadas.', case when is_mythic then 2 else 1 end)
        else format('Seus ataques aplicam Congelamento, reduzindo %s de INI durante %s rodadas.', case when is_mythic then 24 else 12 end, case when is_mythic then 3 else 2 end)
      end,
      'duration', case family
        when 0 then case when is_mythic then 4 else 3 end
        when 1 then case when is_mythic then 3 else 2 end
        when 4 then case when is_mythic then 3 else 2 end
        else 0
      end,
      'power', case family
        when 0 then case when is_mythic then 16 else 8 end
        when 1 then case when is_mythic then 20 else 10 end
        when 2 then case when is_mythic then 22 else 10 end
        when 3 then case when is_mythic then 2 else 1 end
        else case when is_mythic then 24 else 12 end
      end,
      'modifiers', '{}'::jsonb,
      'shield', 0,
      'maxHpPercent', 0,
      'mana', 0,
      'classResource', 0,
      'raceResource', 0
    )) as special_effects
  from source
)
update public.v2_shop_items item
set special_effects = effects.special_effects,
    updated_at = now()
from effects
where item.id = effects.id;

update public.v2_shop_items
set special_effects = '[]'::jsonb,
    updated_at = now()
where rarity not in ('legendary', 'mythic');

commit;
