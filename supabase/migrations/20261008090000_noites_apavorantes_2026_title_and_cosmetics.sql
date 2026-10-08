begin;

-- Rebrand the existing catalog in place so ownership and equipped keys survive.
update public.v2_cosmetics
set
  name = case key
    when 'vigilia-do-cemiterio' then 'Vigília das Noites Apavorantes'
    when 'moldura-colheita-noturna' then 'Portal da Colheita Apavorante'
    when 'voo-da-bruxa' then 'Cortejo da Bruxa Apavorante'
  end,
  description = case key
    when 'vigilia-do-cemiterio' then 'Card animado oficial de Noites Apavorantes 2026, cercado por galhos carbonizados, lanternas de brasa, lápides e aparições espectrais.'
    when 'moldura-colheita-noturna' then 'Moldura mítica de Noites Apavorantes 2026, forjada em madeira carbonizada e ferro antigo, com abóboras ritualísticas, fogo espectral e ouro envelhecido.'
    when 'voo-da-bruxa' then 'Aura animada oficial de Noites Apavorantes 2026, com uma bruxa errante, morcegos, fagulhas de brasa e chamas espectrais ao redor do retrato.'
  end,
  collection_name = 'Noites Apavorantes — Halloween 2026',
  active = true,
  updated_at = now()
where key in ('vigilia-do-cemiterio', 'moldura-colheita-noturna', 'voo-da-bruxa');

insert into public.v2_shop_items(
  slug, name, description, category, price, slot, rarity, attributes,
  title_style, special_effects, two_handed, active, sort_order
)
values (
  'titulo-arauto-das-noites-apavorantes-2026',
  'Arauto das Noites Apavorantes',
  'Honraria limitada de quem atravessou as Noites Apavorantes de 2026 e ajudou os seis reinos a preparar a celebração.',
  'Título', 0, 'title', 'mythic',
  '{"FOR":0,"DEF":0,"RES":0,"INI":0,"INT":0,"HP":0}'::jsonb,
  jsonb_build_object(
    'primary', '#fff0cf', 'secondary', '#101b1a', 'glow', '#38d9cc',
    'accent', '#ffad55', 'sigil', '☾', 'frame', 'infernal',
    'category', 'commemorative', 'availability', 'limited',
    'acquisition', 'Concedido durante Noites Apavorantes — Halloween 2026.',
    'animated', true
  ),
  '[]'::jsonb, false, false, 99980
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  price = excluded.price,
  slot = excluded.slot,
  rarity = excluded.rarity,
  attributes = excluded.attributes,
  title_style = excluded.title_style,
  special_effects = excluded.special_effects,
  two_handed = excluded.two_handed,
  active = excluded.active,
  sort_order = excluded.sort_order,
  updated_at = now();

do $$
begin
  if (select count(*) from public.v2_cosmetics
      where key in ('vigilia-do-cemiterio', 'moldura-colheita-noturna', 'voo-da-bruxa')
        and collection_name = 'Noites Apavorantes — Halloween 2026' and active) <> 3 then
    raise exception 'Noites Apavorantes cosmetic catalog is incomplete';
  end if;
  if not exists (select 1 from public.v2_shop_items
      where slug = 'titulo-arauto-das-noites-apavorantes-2026'
        and slot = 'title' and rarity = 'mythic') then
    raise exception 'Noites Apavorantes title was not created';
  end if;
end $$;

commit;
