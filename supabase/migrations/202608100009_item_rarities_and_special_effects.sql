-- Catálogo completo de raridades e efeitos especiais estruturados.
begin;

alter table public.v2_shop_items
  add column if not exists special_effects jsonb not null default '[]'::jsonb;

alter table public.v2_shop_items drop constraint if exists v2_shop_items_special_effects_array;
alter table public.v2_shop_items add constraint v2_shop_items_special_effects_array
  check (jsonb_typeof(special_effects) = 'array');

with rarity_source(rarity, suffix, attribute_multiplier, price_multiplier, effect_name, effect_value, flavor) as (
  values
    ('uncommon', 'do Peregrino', 1.35::numeric, 2.2::numeric, null, 0, 'Trabalhado por artesãos viajantes.'),
    ('rare', 'da Aurora Velada', 1.75::numeric, 5::numeric, null, 0, 'Forjado sob a primeira luz de Wonderland.'),
    ('epic', 'do Trono Esmeralda', 2.30::numeric, 12::numeric, null, 0, 'Uma relíquia digna dos grandes campeões.'),
    ('legendary', 'da Coroa Eterna', 3::numeric, 30::numeric, 'Ressonância da Coroa', 5, 'A presença desta relíquia altera o início de cada combate.'),
    ('mythic', 'do Primeiro Sonho', 4::numeric, 75::numeric, 'Milagre de Wonderland', 10, 'Um artefato impossível, nascido antes da história dos reinos.')
), common_items as (
  select * from public.v2_shop_items where rarity = 'common'
), generated as (
  select
    common.slug || '-' || rarity.rarity as slug,
    common.name || ' ' || rarity.suffix as name,
    common.description || ' ' || rarity.flavor as description,
    common.category,
    greatest(1, round(common.price * rarity.price_multiplier))::bigint as price,
    common.image_url,
    common.slot,
    rarity.rarity,
    coalesce((select jsonb_object_agg(attribute, greatest(1, round((value::text)::numeric * rarity.attribute_multiplier))::int) from jsonb_each(common.attributes) attributes(attribute, value)), '{}'::jsonb) as attributes,
    common.two_handed,
    common.sort_order,
    case when rarity.effect_name is null then '[]'::jsonb else jsonb_build_array(jsonb_build_object(
      'key', common.slug || '-' || rarity.rarity || '-aura',
      'name', rarity.effect_name,
      'description', case
        when common.slot in ('main_weapon','off_weapon') then 'No início do combate, concede FOR e INT adicionais enquanto este item estiver equipado.'
        when common.slot in ('head','torso','hands','legs','feet','cape') then 'No início do combate, concede DEF e RES adicionais enquanto este item estiver equipado.'
        else 'No início do combate, concede INI e ARC adicionais enquanto este item estiver equipado.' end,
      'trigger', 'BATTLE_START', 'duration', 0,
      'modifiers', case
        when common.slot in ('main_weapon','off_weapon') then jsonb_build_object('FOR', rarity.effect_value, 'INT', rarity.effect_value)
        when common.slot in ('head','torso','hands','legs','feet','cape') then jsonb_build_object('DEF', rarity.effect_value, 'RES', rarity.effect_value)
        else jsonb_build_object('INI', rarity.effect_value, 'ARC', rarity.effect_value) end
    )) end as special_effects
  from common_items common cross join rarity_source rarity
)
insert into public.v2_shop_items(slug,name,description,category,price,image_url,slot,rarity,attributes,two_handed,sort_order,active,special_effects)
select slug,name,description,category,price,image_url,slot,rarity,attributes,two_handed,sort_order,true,special_effects from generated
on conflict (slug) do update set
  name=excluded.name, description=excluded.description, category=excluded.category,
  price=excluded.price, image_url=excluded.image_url, slot=excluded.slot, rarity=excluded.rarity,
  attributes=excluded.attributes, two_handed=excluded.two_handed, sort_order=excluded.sort_order,
  special_effects=excluded.special_effects, updated_at=now();

commit;
