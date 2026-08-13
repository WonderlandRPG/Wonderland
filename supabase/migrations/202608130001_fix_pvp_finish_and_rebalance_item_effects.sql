-- Corrige o encerramento PvP e redefine atributos/efeitos por função de equipamento.
begin;

create or replace function public.v2_record_pvp_result()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  rounds_played integer;
begin
  if new.status <> 'finished'
     or new.winner_character_id is null
     or (old.status = 'finished' and old.winner_character_id is not null) then
    return new;
  end if;

  rounds_played := greatest(1, coalesce((new.state ->> 'turn')::integer, 1));

  insert into public.v2_pvp_history(
    match_id, character_id, opponent_character_id, result, rank, rounds, finished_at
  ) values
    (
      new.id, new.player_one_character_id, new.player_two_character_id,
      case when new.winner_character_id = new.player_one_character_id then 'victory' else 'defeat' end,
      new.rank, rounds_played, coalesce(new.finished_at, now())
    ),
    (
      new.id, new.player_two_character_id, new.player_one_character_id,
      case when new.winner_character_id = new.player_two_character_id then 'victory' else 'defeat' end,
      new.rank, rounds_played, coalesce(new.finished_at, now())
    )
  on conflict(match_id, character_id) do nothing;

  return new;
end;
$function$;

revoke execute on function public.v2_record_pvp_result() from public, anon, authenticated;

drop policy if exists "equipped inventory visible to players" on public.v2_character_inventory;
create policy "equipped inventory visible to players"
on public.v2_character_inventory for select
to authenticated
using (equipped_slot is not null);

-- Orçamento de atributos menor e previsível por raridade. A identidade original
-- decide se uma arma é física, ágil ou arcana; o slot decide os atributos permitidos.
with normalized as (
  select
    id,
    slot,
    rarity,
    attributes,
    case rarity
      when 'common' then 12
      when 'uncommon' then 14
      when 'rare' then 16
      when 'epic' then 18
      when 'legendary' then 20
      when 'mythic' then 22
      else 12
    end as budget,
    coalesce((attributes ->> 'FOR')::integer, 0) + coalesce((attributes ->> 'INI')::integer, 0) as physical_score,
    coalesce((attributes ->> 'INT')::integer, 0) + coalesce((attributes ->> 'ARC')::integer, 0) as arcane_score
  from public.v2_shop_items
  where slot <> 'title'
), redistributed as (
  select id,
    case
      when slot = 'head' then jsonb_build_object('DEF', ceil(budget * .55)::int, 'RES', floor(budget * .45)::int)
      when slot = 'torso' then jsonb_build_object('DEF', ceil(budget * .60)::int, 'RES', floor(budget * .40)::int)
      when slot = 'hands' and arcane_score > physical_score then jsonb_build_object('INT', ceil(budget * .60)::int, 'ARC', floor(budget * .40)::int)
      when slot = 'hands' then jsonb_build_object('FOR', ceil(budget * .60)::int, 'INI', floor(budget * .40)::int)
      when slot = 'legs' then jsonb_build_object('RES', ceil(budget * .55)::int, 'INI', floor(budget * .45)::int)
      when slot = 'feet' then jsonb_build_object('INI', ceil(budget * .65)::int, 'RES', floor(budget * .35)::int)
      when slot = 'main_weapon' and arcane_score > physical_score then jsonb_build_object('INT', ceil(budget * .65)::int, 'ARC', floor(budget * .35)::int)
      when slot = 'main_weapon' and coalesce((attributes ->> 'INI')::integer, 0) > coalesce((attributes ->> 'FOR')::integer, 0) then jsonb_build_object('INI', ceil(budget * .65)::int, 'FOR', floor(budget * .35)::int)
      when slot = 'main_weapon' then jsonb_build_object('FOR', ceil(budget * .70)::int, 'INI', floor(budget * .30)::int)
      when slot = 'off_weapon' then jsonb_build_object('DEF', ceil(budget * .65)::int, 'RES', floor(budget * .35)::int)
      when slot = 'necklace' then jsonb_build_object('ARC', ceil(budget * .55)::int, 'RES', floor(budget * .45)::int)
      when slot = 'ring' and mod(abs(hashtext(id::text)), 2) = 0 then jsonb_build_object('FOR', ceil(budget * .50)::int, 'INI', floor(budget * .50)::int)
      when slot = 'ring' then jsonb_build_object('INT', ceil(budget * .50)::int, 'ARC', floor(budget * .50)::int)
      when slot = 'earring' then jsonb_build_object('INI', ceil(budget * .55)::int, 'ARC', floor(budget * .45)::int)
      when slot = 'cape' then jsonb_build_object('RES', ceil(budget * .55)::int, 'DEF', floor(budget * .45)::int)
      else attributes
    end as attributes
  from normalized
)
update public.v2_shop_items item
set attributes = redistributed.attributes, updated_at = now()
from redistributed
where item.id = redistributed.id;

-- Mantém exatamente a mesma população de itens com efeito: Lendários e Míticos.
-- Armas recebem efeitos ofensivos; armaduras, mobilidade e acessórios recebem
-- benefícios coerentes com o próprio slot. Os valores foram reduzidos.
update public.v2_shop_items
set special_effects = '[]'::jsonb, updated_at = now()
where slot <> 'title';

with slot_ranked as (
  select
    item.*,
    row_number() over (
      partition by rarity, slot
      order by mod(abs(hashtext(slug || '-slot-rebalance')), 100000), slug
    ) as slot_position
  from public.v2_shop_items item
  where rarity in ('legendary', 'mythic') and slot <> 'title'
), candidates as (
  select slot_ranked.*,
    row_number() over (
      partition by rarity, (slot_position > 1)
      order by mod(abs(hashtext(slug || '-extra-effect')), 100000), slug
    ) as extra_position
  from slot_ranked
), source as (
  select
    id, slug, slot, rarity,
    rarity = 'mythic' as mythic,
    mod(abs(hashtext(slug)), 3) as family
  from candidates
  where (rarity = 'legendary' and (slot_position = 1 or (slot_position > 1 and extra_position <= 7)))
     or (rarity = 'mythic' and (slot_position = 1 or (slot_position > 1 and extra_position <= 1)))
), effects as (
  select id, jsonb_build_array(jsonb_build_object(
    'key', slug || '-slot-effect-v2',
    'kind', case
      when slot in ('main_weapon', 'off_weapon') and family = 0 then 'POISON'
      when slot in ('main_weapon', 'off_weapon') and family = 1 then 'BLEED'
      when slot in ('main_weapon', 'off_weapon') then 'LIFE_STEAL'
      when slot = 'ring' then 'COOLDOWN_REDUCTION'
      else 'BATTLE_START'
    end,
    'trigger', case
      when slot in ('main_weapon', 'off_weapon') then 'ON_DAMAGE_DEALT'
      when slot = 'ring' then 'ON_SKILL_USE'
      else 'BATTLE_START'
    end,
    'name', case
      when slot in ('main_weapon', 'off_weapon') and family = 0 then 'Toxina da Lâmina'
      when slot in ('main_weapon', 'off_weapon') and family = 1 then 'Corte Hemorrágico'
      when slot in ('main_weapon', 'off_weapon') then 'Sifão de Batalha'
      when slot = 'head' then 'Vigia Mental'
      when slot = 'torso' then 'Couraça Persistente'
      when slot = 'hands' then 'Precisão de Combate'
      when slot = 'legs' then 'Passo Resistente'
      when slot = 'feet' then 'Arrancada Inicial'
      when slot = 'necklace' then 'Núcleo Arcano'
      when slot = 'ring' then 'Ciclo Rúnico'
      when slot = 'earring' then 'Percepção Aguçada'
      when slot = 'cape' then 'Manto Protetor'
      else 'Ressonância do Equipamento'
    end,
    'description', case
      when slot in ('main_weapon', 'off_weapon') and family = 0 then format('Ataques aplicam %s de dano verdadeiro por 2 rodadas.', case when mythic then 5 else 3 end)
      when slot in ('main_weapon', 'off_weapon') and family = 1 then format('Ataques aplicam %s de dano físico por 2 rodadas.', case when mythic then 6 else 4 end)
      when slot in ('main_weapon', 'off_weapon') then format('Recupera %s%% do dano causado como HP.', case when mythic then 6 else 4 end)
      when slot = 'head' then format('No início da batalha, concede +%s RES.', case when mythic then 5 else 3 end)
      when slot = 'torso' then format('No início da batalha, concede %s de escudo.', case when mythic then 16 else 10 end)
      when slot = 'hands' then format('No início da batalha, concede +%s FOR e +%s INT.', case when mythic then 3 else 2 end, case when mythic then 3 else 2 end)
      when slot = 'legs' then format('No início da batalha, concede +%s DEF e +%s RES.', case when mythic then 3 else 2 end, case when mythic then 3 else 2 end)
      when slot = 'feet' then format('No início da batalha, concede +%s INI.', case when mythic then 5 else 3 end)
      when slot = 'necklace' then format('No início da batalha, concede +%s ARC.', case when mythic then 5 else 3 end)
      when slot = 'ring' then 'A primeira habilidade usada reduz sua própria recarga em 1 rodada.'
      when slot = 'earring' then format('No início da batalha, concede +%s INI e +%s ARC.', case when mythic then 3 else 2 end, case when mythic then 3 else 2 end)
      when slot = 'cape' then format('No início da batalha, aumenta o HP máximo em %s%%.', case when mythic then 3 else 2 end)
      else 'Concede um pequeno benefício no início da batalha.'
    end,
    'duration', case when slot in ('main_weapon', 'off_weapon') and family in (0, 1) then 2 else 0 end,
    'power', case
      when slot in ('main_weapon', 'off_weapon') and family = 0 then case when mythic then 5 else 3 end
      when slot in ('main_weapon', 'off_weapon') and family = 1 then case when mythic then 6 else 4 end
      when slot in ('main_weapon', 'off_weapon') then case when mythic then 6 else 4 end
      when slot = 'ring' then 1
      else 0
    end,
    'modifiers', case
      when slot = 'head' then jsonb_build_object('RES', case when mythic then 5 else 3 end)
      when slot = 'hands' then jsonb_build_object('FOR', case when mythic then 3 else 2 end, 'INT', case when mythic then 3 else 2 end)
      when slot = 'legs' then jsonb_build_object('DEF', case when mythic then 3 else 2 end, 'RES', case when mythic then 3 else 2 end)
      when slot = 'feet' then jsonb_build_object('INI', case when mythic then 5 else 3 end)
      when slot = 'necklace' then jsonb_build_object('ARC', case when mythic then 5 else 3 end)
      when slot = 'earring' then jsonb_build_object('INI', case when mythic then 3 else 2 end, 'ARC', case when mythic then 3 else 2 end)
      else '{}'::jsonb
    end,
    'shield', case when slot = 'torso' then case when mythic then 16 else 10 end else 0 end,
    'maxHpPercent', case when slot = 'cape' then case when mythic then 3 else 2 end else 0 end,
    'mana', 0, 'classResource', 0, 'raceResource', 0
  )) as special_effects
  from source
)
update public.v2_shop_items item
set special_effects = effects.special_effects, updated_at = now()
from effects
where item.id = effects.id;

commit;
