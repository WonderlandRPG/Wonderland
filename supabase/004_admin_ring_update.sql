-- Wonderland — atualização segura do Anel dos Administradores
-- Execute este arquivo completo no SQL Editor do Supabase.

alter table public.items add column if not exists icon_url text;
alter table public.items add column if not exists artwork_url text;
alter table public.items add column if not exists description text;
alter table public.items add column if not exists required_level integer not null default 1;
alter table public.items add column if not exists is_active boolean not null default true;

-- Atualiza o registro do catálogo, caso ele já exista.
update public.items
set
  name = 'Anel dos Administradores',
  description = 'Item administrativo de teste, deliberadamente fora dos padrões normais de balanceamento do RPG.',
  slot = 'ring_1',
  rarity = 'Mítico',
  price_wg = 55000000,
  required_level = 1,
  stats = '{"FOR":500,"DEF":500,"RES":500,"INI":500,"INT":500,"ARC":500}'::jsonb,
  icon_url = '💍',
  artwork_url = 'https://i.pinimg.com/736x/c6/43/53/c643530ae1593718cc69cea79d81fce7.jpg',
  two_handed = false,
  occupies_both_hands = false,
  is_active = true
where item_key = 'anel-dos-administradores';

-- Atualiza todas as cópias que já estão nos inventários.
update public.character_inventory
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
  'name','Anel dos Administradores',
  'slot','ring_1',
  'rarity','Mítico',
  'price_wg',55000000,
  'stats','{"FOR":500,"DEF":500,"RES":500,"INI":500,"INT":500,"ARC":500}'::jsonb,
  'icon','💍',
  'icon_url','💍',
  'image','https://i.pinimg.com/736x/c6/43/53/c643530ae1593718cc69cea79d81fce7.jpg',
  'image_url','https://i.pinimg.com/736x/c6/43/53/c643530ae1593718cc69cea79d81fce7.jpg',
  'artwork_url','https://i.pinimg.com/736x/c6/43/53/c643530ae1593718cc69cea79d81fce7.jpg',
  'two_handed',false,
  'occupies_both_hands',false
)
where item_key = 'anel-dos-administradores';

-- Atualiza cópias já equipadas.
update public.character_equipment
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
  'name','Anel dos Administradores',
  'slot','ring_1',
  'rarity','Mítico',
  'price_wg',55000000,
  'stats','{"FOR":500,"DEF":500,"RES":500,"INI":500,"INT":500,"ARC":500}'::jsonb,
  'icon','💍',
  'icon_url','💍',
  'image','https://i.pinimg.com/736x/c6/43/53/c643530ae1593718cc69cea79d81fce7.jpg',
  'image_url','https://i.pinimg.com/736x/c6/43/53/c643530ae1593718cc69cea79d81fce7.jpg',
  'artwork_url','https://i.pinimg.com/736x/c6/43/53/c643530ae1593718cc69cea79d81fce7.jpg',
  'two_handed',false,
  'occupies_both_hands',false
)
where item_key = 'anel-dos-administradores';

-- Força o PostgREST/Supabase a recarregar o cache do schema.
notify pgrst, 'reload schema';