-- Diversifica o papel tático de itens do mesmo slot sem alterar o orçamento
-- total da raridade, IDs, preços, efeitos ou vínculos com inventários.
begin;

with item_budget as (
  select
    id, slug, slot,
    case rarity
      when 'common' then 12 when 'uncommon' then 14 when 'rare' then 16
      when 'epic' then 18 when 'legendary' then 20 when 'mythic' then 22
      else 12
    end as budget,
    mod(abs(hashtextextended(slug || '-attribute-identity-v2', 0)), 6)::integer as family
  from public.v2_shop_items
  where slot <> 'title'
), diversified as (
  select id, case
    -- Cabeça: muralha, proteção arcana, comando, guerreiro, erudito ou equilíbrio.
    when slot='head' and family=0 then jsonb_build_object('DEF',ceil(budget*.70)::int,'RES',floor(budget*.30)::int)
    when slot='head' and family=1 then jsonb_build_object('RES',ceil(budget*.65)::int,'ARC',floor(budget*.35)::int)
    when slot='head' and family=2 then jsonb_build_object('DEF',ceil(budget*.55)::int,'INI',floor(budget*.45)::int)
    when slot='head' and family=3 then jsonb_build_object('DEF',ceil(budget*.55)::int,'FOR',floor(budget*.45)::int)
    when slot='head' and family=4 then jsonb_build_object('RES',ceil(budget*.55)::int,'INT',floor(budget*.45)::int)
    when slot='head' then jsonb_build_object('DEF',ceil(budget*.40)::int,'RES',ceil(budget*.35)::int,'ARC',budget-ceil(budget*.40)::int-ceil(budget*.35)::int)

    -- Peitoral: blindagem, resistência, contra-ataque, arcano, mobilidade ou híbrido.
    when slot='torso' and family=0 then jsonb_build_object('DEF',ceil(budget*.80)::int,'RES',floor(budget*.20)::int)
    when slot='torso' and family=1 then jsonb_build_object('RES',ceil(budget*.75)::int,'DEF',floor(budget*.25)::int)
    when slot='torso' and family=2 then jsonb_build_object('DEF',ceil(budget*.60)::int,'FOR',floor(budget*.40)::int)
    when slot='torso' and family=3 then jsonb_build_object('RES',ceil(budget*.60)::int,'INT',floor(budget*.40)::int)
    when slot='torso' and family=4 then jsonb_build_object('DEF',ceil(budget*.55)::int,'INI',floor(budget*.45)::int)
    when slot='torso' then jsonb_build_object('DEF',ceil(budget*.40)::int,'RES',ceil(budget*.35)::int,'FOR',budget-ceil(budget*.40)::int-ceil(budget*.35)::int)

    -- Mãos: força, magia, precisão, conjuração, batalha híbrida ou suporte.
    when slot='hands' and family=0 then jsonb_build_object('FOR',ceil(budget*.75)::int,'INI',floor(budget*.25)::int)
    when slot='hands' and family=1 then jsonb_build_object('INT',ceil(budget*.75)::int,'ARC',floor(budget*.25)::int)
    when slot='hands' and family=2 then jsonb_build_object('INI',ceil(budget*.60)::int,'FOR',floor(budget*.40)::int)
    when slot='hands' and family=3 then jsonb_build_object('ARC',ceil(budget*.60)::int,'INT',floor(budget*.40)::int)
    when slot='hands' and family=4 then jsonb_build_object('FOR',ceil(budget*.50)::int,'INT',floor(budget*.50)::int)
    when slot='hands' then jsonb_build_object('ARC',ceil(budget*.50)::int,'INI',floor(budget*.50)::int)

    -- Pernas e pés variam entre resistência, mobilidade e poder.
    when slot='legs' and family=0 then jsonb_build_object('RES',ceil(budget*.70)::int,'DEF',floor(budget*.30)::int)
    when slot='legs' and family=1 then jsonb_build_object('INI',ceil(budget*.65)::int,'RES',floor(budget*.35)::int)
    when slot='legs' and family=2 then jsonb_build_object('DEF',ceil(budget*.55)::int,'INI',floor(budget*.45)::int)
    when slot='legs' and family=3 then jsonb_build_object('RES',ceil(budget*.55)::int,'FOR',floor(budget*.45)::int)
    when slot='legs' and family=4 then jsonb_build_object('RES',ceil(budget*.55)::int,'INT',floor(budget*.45)::int)
    when slot='legs' then jsonb_build_object('INI',ceil(budget*.40)::int,'DEF',ceil(budget*.35)::int,'RES',budget-ceil(budget*.40)::int-ceil(budget*.35)::int)
    when slot='feet' and family=0 then jsonb_build_object('INI',ceil(budget*.80)::int,'RES',floor(budget*.20)::int)
    when slot='feet' and family=1 then jsonb_build_object('INI',ceil(budget*.65)::int,'DEF',floor(budget*.35)::int)
    when slot='feet' and family=2 then jsonb_build_object('INI',ceil(budget*.60)::int,'FOR',floor(budget*.40)::int)
    when slot='feet' and family=3 then jsonb_build_object('INI',ceil(budget*.60)::int,'INT',floor(budget*.40)::int)
    when slot='feet' and family=4 then jsonb_build_object('RES',ceil(budget*.55)::int,'INI',floor(budget*.45)::int)
    when slot='feet' then jsonb_build_object('INI',ceil(budget*.45)::int,'ARC',ceil(budget*.30)::int,'RES',budget-ceil(budget*.45)::int-ceil(budget*.30)::int)

    -- Armas reconhecem identidade física, ágil, arcana, ritual, híbrida e crítica.
    when slot='main_weapon' and family=0 then jsonb_build_object('FOR',ceil(budget*.80)::int,'INI',floor(budget*.20)::int)
    when slot='main_weapon' and family=1 then jsonb_build_object('INI',ceil(budget*.70)::int,'FOR',floor(budget*.30)::int)
    when slot='main_weapon' and family=2 then jsonb_build_object('INT',ceil(budget*.75)::int,'ARC',floor(budget*.25)::int)
    when slot='main_weapon' and family=3 then jsonb_build_object('ARC',ceil(budget*.65)::int,'INT',floor(budget*.35)::int)
    when slot='main_weapon' and family=4 then jsonb_build_object('FOR',ceil(budget*.50)::int,'INT',floor(budget*.50)::int)
    when slot='main_weapon' then jsonb_build_object('INI',ceil(budget*.45)::int,'FOR',ceil(budget*.35)::int,'ARC',budget-ceil(budget*.45)::int-ceil(budget*.35)::int)
    when slot='off_weapon' and family=0 then jsonb_build_object('DEF',ceil(budget*.80)::int,'RES',floor(budget*.20)::int)
    when slot='off_weapon' and family=1 then jsonb_build_object('RES',ceil(budget*.75)::int,'DEF',floor(budget*.25)::int)
    when slot='off_weapon' and family=2 then jsonb_build_object('DEF',ceil(budget*.55)::int,'FOR',floor(budget*.45)::int)
    when slot='off_weapon' and family=3 then jsonb_build_object('RES',ceil(budget*.55)::int,'INT',floor(budget*.45)::int)
    when slot='off_weapon' and family=4 then jsonb_build_object('DEF',ceil(budget*.50)::int,'ARC',floor(budget*.50)::int)
    when slot='off_weapon' then jsonb_build_object('DEF',ceil(budget*.40)::int,'RES',ceil(budget*.35)::int,'INI',budget-ceil(budget*.40)::int-ceil(budget*.35)::int)

    -- Acessórios e capas oferecem escolhas ofensivas, defensivas e utilitárias.
    when slot='necklace' and family=0 then jsonb_build_object('ARC',ceil(budget*.75)::int,'INT',floor(budget*.25)::int)
    when slot='necklace' and family=1 then jsonb_build_object('INT',ceil(budget*.65)::int,'ARC',floor(budget*.35)::int)
    when slot='necklace' and family=2 then jsonb_build_object('RES',ceil(budget*.60)::int,'ARC',floor(budget*.40)::int)
    when slot='necklace' and family=3 then jsonb_build_object('ARC',ceil(budget*.55)::int,'INI',floor(budget*.45)::int)
    when slot='necklace' and family=4 then jsonb_build_object('FOR',ceil(budget*.50)::int,'ARC',floor(budget*.50)::int)
    when slot='necklace' then jsonb_build_object('ARC',ceil(budget*.40)::int,'INT',ceil(budget*.35)::int,'RES',budget-ceil(budget*.40)::int-ceil(budget*.35)::int)
    when slot='ring' and family=0 then jsonb_build_object('FOR',ceil(budget*.70)::int,'INI',floor(budget*.30)::int)
    when slot='ring' and family=1 then jsonb_build_object('INT',ceil(budget*.70)::int,'ARC',floor(budget*.30)::int)
    when slot='ring' and family=2 then jsonb_build_object('DEF',ceil(budget*.60)::int,'RES',floor(budget*.40)::int)
    when slot='ring' and family=3 then jsonb_build_object('INI',ceil(budget*.60)::int,'ARC',floor(budget*.40)::int)
    when slot='ring' and family=4 then jsonb_build_object('FOR',ceil(budget*.50)::int,'INT',floor(budget*.50)::int)
    when slot='ring' then jsonb_build_object('ARC',ceil(budget*.40)::int,'INI',ceil(budget*.35)::int,'RES',budget-ceil(budget*.40)::int-ceil(budget*.35)::int)
    when slot='earring' and family=0 then jsonb_build_object('INI',ceil(budget*.75)::int,'ARC',floor(budget*.25)::int)
    when slot='earring' and family=1 then jsonb_build_object('ARC',ceil(budget*.70)::int,'INI',floor(budget*.30)::int)
    when slot='earring' and family=2 then jsonb_build_object('INT',ceil(budget*.60)::int,'INI',floor(budget*.40)::int)
    when slot='earring' and family=3 then jsonb_build_object('RES',ceil(budget*.55)::int,'ARC',floor(budget*.45)::int)
    when slot='earring' and family=4 then jsonb_build_object('FOR',ceil(budget*.50)::int,'INI',floor(budget*.50)::int)
    when slot='earring' then jsonb_build_object('INI',ceil(budget*.40)::int,'ARC',ceil(budget*.35)::int,'INT',budget-ceil(budget*.40)::int-ceil(budget*.35)::int)
    when slot='cape' and family=0 then jsonb_build_object('RES',ceil(budget*.75)::int,'DEF',floor(budget*.25)::int)
    when slot='cape' and family=1 then jsonb_build_object('DEF',ceil(budget*.70)::int,'RES',floor(budget*.30)::int)
    when slot='cape' and family=2 then jsonb_build_object('INI',ceil(budget*.60)::int,'RES',floor(budget*.40)::int)
    when slot='cape' and family=3 then jsonb_build_object('ARC',ceil(budget*.55)::int,'RES',floor(budget*.45)::int)
    when slot='cape' and family=4 then jsonb_build_object('FOR',ceil(budget*.50)::int,'DEF',floor(budget*.50)::int)
    when slot='cape' then jsonb_build_object('RES',ceil(budget*.40)::int,'DEF',ceil(budget*.35)::int,'INI',budget-ceil(budget*.40)::int-ceil(budget*.35)::int)
    else '{}'::jsonb
  end as attributes
  from item_budget
)
update public.v2_shop_items item
set attributes=diversified.attributes,updated_at=now()
from diversified
where item.id=diversified.id;

commit;
