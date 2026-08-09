begin;

alter table public.v2_characters add column if not exists gold bigint not null default 1500 check (gold >= 0);

create table if not exists public.v2_active_characters (
  user_id uuid primary key references auth.users(id) on delete cascade,
  character_id uuid not null references public.v2_characters(id) on delete cascade,
  selected_at timestamptz not null default now()
);
create unique index if not exists v2_active_characters_character_idx on public.v2_active_characters(character_id);
alter table public.v2_active_characters enable row level security;
drop policy if exists "active character owner read" on public.v2_active_characters;
create policy "active character owner read" on public.v2_active_characters for select to authenticated using ((select auth.uid()) = user_id);
grant select on public.v2_active_characters to authenticated;

alter table public.v2_shop_items add column if not exists slot text not null default 'weapon';
alter table public.v2_shop_items add column if not exists rarity text not null default 'common';
alter table public.v2_shop_items add column if not exists attributes jsonb not null default '{}'::jsonb;
alter table public.v2_shop_items add column if not exists two_handed boolean not null default false;
alter table public.v2_shop_items add column if not exists sort_order integer not null default 0;
alter table public.v2_shop_items drop constraint if exists v2_shop_items_rarity_check;
alter table public.v2_shop_items add constraint v2_shop_items_rarity_check check (rarity in ('common','uncommon','rare','epic','legendary','mythic'));
alter table public.v2_shop_items drop constraint if exists v2_shop_items_slot_check;
alter table public.v2_shop_items add constraint v2_shop_items_slot_check check (slot in ('weapon','shield','head','torso','hands','feet'));

delete from public.v2_inventory where item_id in (
  select id from public.v2_shop_items where slug in ('moldura-esmeralda','titulo-desbravador','pocao-de-xp')
);
delete from public.v2_shop_items where slug in ('moldura-esmeralda','titulo-desbravador','pocao-de-xp');
insert into public.v2_shop_items(slug,name,description,category,slot,rarity,price,attributes,two_handed,sort_order,active) values
  ('espadas-espada-curta', 'Espada Curta', 'FOR +10 / INI +5', 'espadas', 'weapon', 'common', 180, '{"FOR":10,"INI":5}'::jsonb, false, 0, true),
  ('espadas-espada', 'Espada', 'FOR +15', 'espadas', 'weapon', 'common', 180, '{"FOR":15}'::jsonb, false, 1, true),
  ('espadas-espada-longa', 'Espada Longa', 'FOR +10 / DEF +5', 'espadas', 'weapon', 'uncommon', 300, '{"FOR":10,"DEF":5}'::jsonb, false, 2, true),
  ('espadas-espada-bastarda', 'Espada Bastarda', 'FOR +5 / DEF +5 / INI +5', 'espadas', 'weapon', 'uncommon', 300, '{"FOR":5,"DEF":5,"INI":5}'::jsonb, false, 3, true),
  ('espadas-espadao', 'Espadão (duas mãos)', 'FOR +30', 'espadas', 'weapon', 'epic', 750, '{"FOR":30}'::jsonb, true, 4, true),
  ('espadas-espada-larga', 'Espada Larga', 'FOR +15', 'espadas', 'weapon', 'uncommon', 300, '{"FOR":15}'::jsonb, false, 5, true),
  ('espadas-sabre', 'Sabre', 'INI +15', 'espadas', 'weapon', 'common', 180, '{"INI":15}'::jsonb, false, 6, true),
  ('espadas-rapieira', 'Rapieira', 'INI +10 / FOR +5', 'espadas', 'weapon', 'rare', 480, '{"INI":10,"FOR":5}'::jsonb, false, 7, true),
  ('espadas-florete', 'Florete', 'INI +10 / DEF +5', 'espadas', 'weapon', 'rare', 480, '{"INI":10,"DEF":5}'::jsonb, false, 8, true),
  ('espadas-katana', 'Katana', 'INI +10 / FOR +5', 'espadas', 'weapon', 'rare', 480, '{"INI":10,"FOR":5}'::jsonb, false, 9, true),
  ('espadas-nodachi', 'Nodachi (duas mãos)', 'FOR +20 / INI +10', 'espadas', 'weapon', 'epic', 750, '{"FOR":20,"INI":10}'::jsonb, true, 10, true),
  ('espadas-wakizashi', 'Wakizashi', 'INI +15', 'espadas', 'weapon', 'rare', 480, '{"INI":15}'::jsonb, false, 11, true),
  ('espadas-tanto', 'Tanto', 'INI +10 / FOR +5', 'espadas', 'weapon', 'rare', 480, '{"INI":10,"FOR":5}'::jsonb, false, 12, true),
  ('machados-machado-de-mao', 'Machado de Mão', 'FOR +15', 'machados', 'weapon', 'common', 180, '{"FOR":15}'::jsonb, false, 0, true),
  ('machados-machado-de-guerra', 'Machado de Guerra', 'FOR +10 / DEF +5', 'machados', 'weapon', 'uncommon', 300, '{"FOR":10,"DEF":5}'::jsonb, false, 1, true),
  ('machados-machado-duplo', 'Machado Duplo', 'FOR +10 / INI +5', 'machados', 'weapon', 'uncommon', 300, '{"FOR":10,"INI":5}'::jsonb, false, 2, true),
  ('machados-machado-gigante', 'Machado Gigante (duas mãos)', 'FOR +30', 'machados', 'weapon', 'mythic', 1400, '{"FOR":30}'::jsonb, true, 3, true),
  ('machados-machado-barbaro', 'Machado Bárbaro (duas mãos)', 'FOR +20 / RES +10', 'machados', 'weapon', 'legendary', 1050, '{"FOR":20,"RES":10}'::jsonb, true, 4, true),
  ('martelos-martelo', 'Martelo', 'FOR +10 / DEF +5', 'martelos', 'weapon', 'common', 180, '{"FOR":10,"DEF":5}'::jsonb, false, 0, true),
  ('martelos-martelo-de-guerra', 'Martelo de Guerra', 'FOR +15', 'martelos', 'weapon', 'uncommon', 300, '{"FOR":15}'::jsonb, false, 1, true),
  ('martelos-marreta', 'Marreta (duas mãos)', 'FOR +20 / DEF +10', 'martelos', 'weapon', 'epic', 750, '{"FOR":20,"DEF":10}'::jsonb, true, 2, true),
  ('martelos-martelo-colossal', 'Martelo Colossal (duas mãos)', 'FOR +20 / RES +10', 'martelos', 'weapon', 'mythic', 1400, '{"FOR":20,"RES":10}'::jsonb, true, 3, true),
  ('lancas-lanca', 'Lança', 'FOR +10 / INI +5', 'lancas', 'weapon', 'common', 180, '{"FOR":10,"INI":5}'::jsonb, false, 0, true),
  ('lancas-pique', 'Pique (duas mãos)', 'FOR +20 / INI +10', 'lancas', 'weapon', 'epic', 750, '{"FOR":20,"INI":10}'::jsonb, true, 1, true),
  ('lancas-alabarda', 'Alabarda (duas mãos)', 'FOR +10 / DEF +10 / INI +10', 'lancas', 'weapon', 'epic', 750, '{"FOR":10,"DEF":10,"INI":10}'::jsonb, true, 2, true),
  ('lancas-glaive', 'Glaive (duas mãos)', 'FOR +20 / INI +10', 'lancas', 'weapon', 'epic', 750, '{"FOR":20,"INI":10}'::jsonb, true, 3, true),
  ('lancas-tridente', 'Tridente', 'FOR +5 / DEF +5 / INI +5', 'lancas', 'weapon', 'rare', 480, '{"FOR":5,"DEF":5,"INI":5}'::jsonb, false, 4, true),
  ('lancas-naginata', 'Naginata (duas mãos)', 'FOR +20 / INI +10', 'lancas', 'weapon', 'epic', 750, '{"FOR":20,"INI":10}'::jsonb, true, 5, true),
  ('hastes-bastao', 'Bastão', 'DEF +10 / INI +5', 'hastes', 'weapon', 'common', 180, '{"DEF":10,"INI":5}'::jsonb, false, 0, true),
  ('hastes-cajado-de-combate', 'Cajado de Combate', 'FOR +10 / INT +5', 'hastes', 'weapon', 'uncommon', 300, '{"FOR":10,"INT":5}'::jsonb, false, 1, true),
  ('hastes-foice-de-guerra', 'Foice de Guerra (duas mãos)', 'FOR +10 / ARC +10 / INI +10', 'hastes', 'weapon', 'epic', 750, '{"FOR":10,"ARC":10,"INI":10}'::jsonb, true, 2, true),
  ('hastes-mangual', 'Mangual', 'FOR +10 / DEF +5', 'hastes', 'weapon', 'common', 180, '{"FOR":10,"DEF":5}'::jsonb, false, 3, true),
  ('hastes-mangual-pesado', 'Mangual Pesado (duas mãos)', 'FOR +20 / DEF +10', 'hastes', 'weapon', 'epic', 750, '{"FOR":20,"DEF":10}'::jsonb, true, 4, true),
  ('adagas-adaga', 'Adaga', 'INI +15', 'adagas', 'weapon', 'common', 180, '{"INI":15}'::jsonb, false, 0, true),
  ('adagas-punhal', 'Punhal', 'INI +10 / FOR +5', 'adagas', 'weapon', 'common', 180, '{"INI":10,"FOR":5}'::jsonb, false, 1, true),
  ('adagas-dirk', 'Dirk', 'FOR +10 / INI +5', 'adagas', 'weapon', 'uncommon', 300, '{"FOR":10,"INI":5}'::jsonb, false, 2, true),
  ('adagas-kris', 'Kris', 'ARC +10 / INI +5', 'adagas', 'weapon', 'rare', 480, '{"ARC":10,"INI":5}'::jsonb, false, 3, true),
  ('adagas-kunai', 'Kunai', 'INI +10 / FOR +5', 'adagas', 'weapon', 'rare', 480, '{"INI":10,"FOR":5}'::jsonb, false, 4, true),
  ('punho-manoplas', 'Manoplas', 'FOR +15', 'punho', 'weapon', 'common', 180, '{"FOR":15}'::jsonb, false, 0, true),
  ('punho-soqueiras', 'Soqueiras', 'FOR +10 / INI +5', 'punho', 'weapon', 'common', 180, '{"FOR":10,"INI":5}'::jsonb, false, 1, true),
  ('punho-garras', 'Garras', 'INI +10 / FOR +5', 'punho', 'weapon', 'rare', 480, '{"INI":10,"FOR":5}'::jsonb, false, 2, true),
  ('punho-tonfas', 'Tonfas', 'DEF +10 / INI +5', 'punho', 'weapon', 'rare', 480, '{"DEF":10,"INI":5}'::jsonb, false, 3, true),
  ('arcos-arco-curto', 'Arco Curto', 'INI +15', 'arcos', 'weapon', 'common', 180, '{"INI":15}'::jsonb, false, 0, true),
  ('arcos-arco-longo', 'Arco Longo (duas mãos)', 'INI +30', 'arcos', 'weapon', 'epic', 750, '{"INI":30}'::jsonb, true, 1, true),
  ('arcos-arco-composto', 'Arco Composto (duas mãos)', 'FOR +20 / INI +10', 'arcos', 'weapon', 'epic', 750, '{"FOR":20,"INI":10}'::jsonb, true, 2, true),
  ('arcos-arco-elfico', 'Arco Élfico (duas mãos)', 'INT +20 / INI +10', 'arcos', 'weapon', 'legendary', 1050, '{"INT":20,"INI":10}'::jsonb, true, 3, true),
  ('bestas-besta-leve', 'Besta Leve', 'INI +10 / FOR +5', 'bestas', 'weapon', 'common', 180, '{"INI":10,"FOR":5}'::jsonb, false, 0, true),
  ('bestas-besta', 'Besta', 'FOR +10 / INI +5', 'bestas', 'weapon', 'common', 180, '{"FOR":10,"INI":5}'::jsonb, false, 1, true),
  ('bestas-besta-pesada', 'Besta Pesada (duas mãos)', 'FOR +20 / DEF +1', 'bestas', 'weapon', 'epic', 750, '{"FOR":20,"DEF":1}'::jsonb, true, 2, true),
  ('cajados-cajado', 'Cajado', 'INT +15', 'cajados', 'weapon', 'common', 180, '{"INT":15}'::jsonb, false, 0, true),
  ('cajados-cajado-arcano', 'Cajado Arcano (duas mãos)', 'INT +30', 'cajados', 'weapon', 'legendary', 1050, '{"INT":30}'::jsonb, true, 1, true),
  ('cajados-cajado-sagrado', 'Cajado Sagrado (duas mãos)', 'ARC +20 / RES +10', 'cajados', 'weapon', 'legendary', 1050, '{"ARC":20,"RES":10}'::jsonb, true, 2, true),
  ('cajados-cajado-ancestral', 'Cajado Ancestral (duas mãos)', 'INT +20 / ARC +10', 'cajados', 'weapon', 'mythic', 1400, '{"INT":20,"ARC":10}'::jsonb, true, 3, true),
  ('catalisadores-cetro', 'Cetro', 'ARC +15', 'catalisadores', 'weapon', 'common', 180, '{"ARC":15}'::jsonb, false, 0, true),
  ('catalisadores-orbe', 'Orbe', 'INT +10 / ARC +5', 'catalisadores', 'weapon', 'common', 180, '{"INT":10,"ARC":5}'::jsonb, false, 1, true),
  ('catalisadores-grimorio', 'Grimório', 'INT +15', 'catalisadores', 'weapon', 'rare', 480, '{"INT":15}'::jsonb, false, 2, true),
  ('catalisadores-tomo', 'Tomo', 'INT +10 / RES +5', 'catalisadores', 'weapon', 'rare', 480, '{"INT":10,"RES":5}'::jsonb, false, 3, true),
  ('catalisadores-relicario', 'Relicário', 'ARC +10 / RES +5', 'catalisadores', 'weapon', 'rare', 480, '{"ARC":10,"RES":5}'::jsonb, false, 4, true),
  ('catalisadores-cristal-arcano', 'Cristal Arcano', 'ARC +10 / INT +5', 'catalisadores', 'weapon', 'legendary', 1050, '{"ARC":10,"INT":5}'::jsonb, false, 5, true),
  ('catalisadores-varinha', 'Varinha', 'INT +10 / ARC +5', 'catalisadores', 'weapon', 'common', 180, '{"INT":10,"ARC":5}'::jsonb, false, 6, true),
  ('escudos-broquel', 'Broquel', 'DEF +10 / INI +5', 'escudos', 'shield', 'uncommon', 300, '{"DEF":10,"INI":5}'::jsonb, false, 0, true),
  ('escudos-escudo', 'Escudo', 'DEF +15', 'escudos', 'shield', 'common', 180, '{"DEF":15}'::jsonb, false, 1, true),
  ('escudos-escudo-redondo', 'Escudo Redondo', 'DEF +10 / RES +5', 'escudos', 'shield', 'uncommon', 300, '{"DEF":10,"RES":5}'::jsonb, false, 2, true),
  ('escudos-escudo-de-gigante', 'Escudo de Gigante (duas mãos)', 'DEF +30', 'escudos', 'shield', 'mythic', 1400, '{"DEF":30}'::jsonb, true, 3, true),
  ('escudos-escudo-pesado', 'Escudo Pesado', 'DEF +10 / FOR +5', 'escudos', 'shield', 'uncommon', 300, '{"DEF":10,"FOR":5}'::jsonb, false, 4, true),
  ('escudos-escudo-runico', 'Escudo Rúnico', 'ARC +10 / DEF +5', 'escudos', 'shield', 'legendary', 1050, '{"ARC":10,"DEF":5}'::jsonb, false, 5, true),
  ('escudos-escudo-sagrado', 'Escudo Sagrado', 'ARC +10 / RES +5', 'escudos', 'shield', 'legendary', 1050, '{"ARC":10,"RES":5}'::jsonb, false, 6, true),
  ('cabeca-elmo', 'Elmo', 'DEF +15', 'cabeca', 'head', 'common', 180, '{"DEF":15}'::jsonb, false, 0, true),
  ('cabeca-elmo-reforcado', 'Elmo Reforçado', 'DEF +10 / RES +5', 'cabeca', 'head', 'uncommon', 300, '{"DEF":10,"RES":5}'::jsonb, false, 1, true),
  ('cabeca-capacete', 'Capacete', 'RES +15', 'cabeca', 'head', 'common', 180, '{"RES":15}'::jsonb, false, 2, true),
  ('cabeca-capacete-de-ferro', 'Capacete de Ferro', 'RES +10 / DEF +5', 'cabeca', 'head', 'uncommon', 300, '{"RES":10,"DEF":5}'::jsonb, false, 3, true),
  ('cabeca-capuz', 'Capuz', 'INT +15', 'cabeca', 'head', 'common', 180, '{"INT":15}'::jsonb, false, 4, true),
  ('cabeca-capuz-de-couro', 'Capuz de Couro', 'INT +10 / ARC +5', 'cabeca', 'head', 'uncommon', 300, '{"INT":10,"ARC":5}'::jsonb, false, 5, true),
  ('cabeca-tiara', 'Tiara', 'ARC +15', 'cabeca', 'head', 'common', 180, '{"ARC":15}'::jsonb, false, 6, true),
  ('cabeca-tiara-de-ferro', 'Tiara de Ferro', 'ARC +10 / INT +5', 'cabeca', 'head', 'uncommon', 300, '{"ARC":10,"INT":5}'::jsonb, false, 7, true),
  ('cabeca-faixa', 'Faixa', 'INI +15', 'cabeca', 'head', 'common', 180, '{"INI":15}'::jsonb, false, 8, true),
  ('cabeca-faixa-de-combate', 'Faixa de Combate', 'INI +10 / RES +5', 'cabeca', 'head', 'uncommon', 300, '{"INI":10,"RES":5}'::jsonb, false, 9, true),
  ('cabeca-coroa', 'Coroa', 'INT +10 / DEF +5', 'cabeca', 'head', 'rare', 480, '{"INT":10,"DEF":5}'::jsonb, false, 10, true),
  ('cabeca-mascara', 'Máscara', 'ARC +10 / RES +5', 'cabeca', 'head', 'rare', 480, '{"ARC":10,"RES":5}'::jsonb, false, 11, true),
  ('cabeca-chapeu', 'Chapéu', 'INT +5 / DEF +5 / RES +5', 'cabeca', 'head', 'common', 180, '{"INT":5,"DEF":5,"RES":5}'::jsonb, false, 12, true),
  ('cabeca-chapeu-de-couro', 'Chapéu de Couro', 'ARC +5 / DEF +5 / RES +5', 'cabeca', 'head', 'uncommon', 300, '{"ARC":5,"DEF":5,"RES":5}'::jsonb, false, 13, true),
  ('peitoral-peitoral', 'Peitoral', 'DEF +15', 'peitoral', 'torso', 'common', 180, '{"DEF":15}'::jsonb, false, 0, true),
  ('peitoral-peitoral-de-ferro', 'Peitoral de Ferro', 'DEF +10 / RES +5', 'peitoral', 'torso', 'uncommon', 300, '{"DEF":10,"RES":5}'::jsonb, false, 1, true),
  ('peitoral-couraca', 'Couraça', 'RES +15', 'peitoral', 'torso', 'uncommon', 300, '{"RES":15}'::jsonb, false, 2, true),
  ('peitoral-couraca-reforcada', 'Couraça Reforçada', 'RES +10 / DEF +5', 'peitoral', 'torso', 'uncommon', 300, '{"RES":10,"DEF":5}'::jsonb, false, 3, true),
  ('peitoral-armadura', 'Armadura', 'FOR +15', 'peitoral', 'torso', 'common', 180, '{"FOR":15}'::jsonb, false, 4, true),
  ('peitoral-armadura-de-ferro', 'Armadura de Ferro', 'FOR +10 / DEF +5', 'peitoral', 'torso', 'uncommon', 300, '{"FOR":10,"DEF":5}'::jsonb, false, 5, true),
  ('peitoral-colete', 'Colete', 'INI +10 / DEF +5', 'peitoral', 'torso', 'uncommon', 300, '{"INI":10,"DEF":5}'::jsonb, false, 6, true),
  ('peitoral-colete-de-couro', 'Colete de Couro', 'FOR +5 / DEF +5 / RES +5', 'peitoral', 'torso', 'uncommon', 300, '{"FOR":5,"DEF":5,"RES":5}'::jsonb, false, 7, true),
  ('peitoral-gibao', 'Gibão', 'ARC +10 / RES +5', 'peitoral', 'torso', 'uncommon', 300, '{"ARC":10,"RES":5}'::jsonb, false, 8, true),
  ('peitoral-gibao-reforcado', 'Gibão Reforçado', 'ARC +10 / DEF +5', 'peitoral', 'torso', 'uncommon', 300, '{"ARC":10,"DEF":5}'::jsonb, false, 9, true),
  ('peitoral-tunica', 'Túnica', 'INT +10 / ARC +5', 'peitoral', 'torso', 'uncommon', 300, '{"INT":10,"ARC":5}'::jsonb, false, 10, true),
  ('peitoral-tunica-acolchoada', 'Túnica Acolchoada', 'INT +10 / RES +5', 'peitoral', 'torso', 'uncommon', 300, '{"INT":10,"RES":5}'::jsonb, false, 11, true),
  ('peitoral-manto', 'Manto', 'INT +10 / DEF +5', 'peitoral', 'torso', 'common', 180, '{"INT":10,"DEF":5}'::jsonb, false, 12, true),
  ('peitoral-cota-de-malha', 'Cota de Malha', 'INT +5 / DEF +5 / RES +5', 'peitoral', 'torso', 'uncommon', 300, '{"INT":5,"DEF":5,"RES":5}'::jsonb, false, 13, true),
  ('bracos-luvas', 'Luvas', 'FOR +15', 'bracos', 'hands', 'common', 180, '{"FOR":15}'::jsonb, false, 0, true),
  ('bracos-luvas-de-couro', 'Luvas de Couro', 'FOR +10 / INI +5', 'bracos', 'hands', 'uncommon', 300, '{"FOR":10,"INI":5}'::jsonb, false, 1, true),
  ('bracos-luvas-de-ferro', 'Luvas de Ferro', 'DEF +10 / FOR +5', 'bracos', 'hands', 'uncommon', 300, '{"DEF":10,"FOR":5}'::jsonb, false, 2, true),
  ('bracos-manoplas', 'Manoplas', 'DEF +15', 'bracos', 'hands', 'common', 180, '{"DEF":15}'::jsonb, false, 3, true),
  ('bracos-manoplas-pesadas', 'Manoplas Pesadas', 'DEF +10 / RES +5', 'bracos', 'hands', 'uncommon', 300, '{"DEF":10,"RES":5}'::jsonb, false, 4, true),
  ('bracos-bracadeiras', 'Braçadeiras', 'ARC +15', 'bracos', 'hands', 'uncommon', 300, '{"ARC":15}'::jsonb, false, 5, true),
  ('bracos-bracadeiras-de-couro', 'Braçadeiras de Couro', 'ARC +10 / INT +5', 'bracos', 'hands', 'uncommon', 300, '{"ARC":10,"INT":5}'::jsonb, false, 6, true),
  ('bracos-bracadeiras-de-ferro', 'Braçadeiras de Ferro', 'RES +10 / DEF +5', 'bracos', 'hands', 'uncommon', 300, '{"RES":10,"DEF":5}'::jsonb, false, 7, true),
  ('bracos-braceletes', 'Braceletes', 'INT +10 / ARC +5', 'bracos', 'hands', 'uncommon', 300, '{"INT":10,"ARC":5}'::jsonb, false, 8, true),
  ('bracos-munhequeiras', 'Munhequeiras', 'INI +15', 'bracos', 'hands', 'uncommon', 300, '{"INI":15}'::jsonb, false, 9, true),
  ('bracos-munhequeiras-de-couro', 'Munhequeiras de Couro', 'INI +10 / FOR +5', 'bracos', 'hands', 'uncommon', 300, '{"INI":10,"FOR":5}'::jsonb, false, 10, true),
  ('bracos-protetores-de-braco', 'Protetores de Braço', 'INT +10 / DEF +5', 'bracos', 'hands', 'uncommon', 300, '{"INT":10,"DEF":5}'::jsonb, false, 11, true),
  ('bracos-mangas-reforcadas', 'Mangas Reforçadas', 'ARC +10 / RES +5', 'bracos', 'hands', 'uncommon', 300, '{"ARC":10,"RES":5}'::jsonb, false, 12, true),
  ('bracos-mangas', 'Mangas', 'FOR +5 / INI +5 / DEF +5', 'bracos', 'hands', 'uncommon', 300, '{"FOR":5,"INI":5,"DEF":5}'::jsonb, false, 13, true),
  ('pernas-calcas', 'Calças', 'RES +15', 'pernas', 'feet', 'common', 180, '{"RES":15}'::jsonb, false, 0, true),
  ('pernas-calcas-reforcadas', 'Calças Reforçadas', 'RES +10 / INI +5', 'pernas', 'feet', 'uncommon', 300, '{"RES":10,"INI":5}'::jsonb, false, 1, true),
  ('pernas-grevas', 'Grevas', 'DEF +15', 'pernas', 'feet', 'common', 180, '{"DEF":15}'::jsonb, false, 2, true),
  ('pernas-grevas-de-ferro', 'Grevas de Ferro', 'DEF +10 / RES +5', 'pernas', 'feet', 'uncommon', 300, '{"DEF":10,"RES":5}'::jsonb, false, 3, true),
  ('pernas-botas', 'Botas', 'INI +15', 'pernas', 'feet', 'common', 180, '{"INI":15}'::jsonb, false, 4, true),
  ('pernas-botas-de-couro', 'Botas de Couro', 'INI +10 / FOR +5', 'pernas', 'feet', 'uncommon', 300, '{"INI":10,"FOR":5}'::jsonb, false, 5, true),
  ('pernas-botas-de-ferro', 'Botas de Ferro', 'FOR +15', 'pernas', 'feet', 'uncommon', 300, '{"FOR":15}'::jsonb, false, 6, true),
  ('pernas-botinas', 'Botinas', 'FOR +10 / DEF +5', 'pernas', 'feet', 'uncommon', 300, '{"FOR":10,"DEF":5}'::jsonb, false, 7, true),
  ('pernas-sandalias', 'Sandálias', 'ARC +10 / INI +5', 'pernas', 'feet', 'uncommon', 300, '{"ARC":10,"INI":5}'::jsonb, false, 8, true),
  ('pernas-sapatos', 'Sapatos', 'INT +10 / INI +5', 'pernas', 'feet', 'uncommon', 300, '{"INT":10,"INI":5}'::jsonb, false, 9, true),
  ('pernas-joelheiras', 'Joelheiras', 'DEF +5 / RES +5 / INI +5', 'pernas', 'feet', 'uncommon', 300, '{"DEF":5,"RES":5,"INI":5}'::jsonb, false, 10, true),
  ('pernas-joelheiras-de-ferro', 'Joelheiras de Ferro', 'INT +10 / DEF +5', 'pernas', 'feet', 'uncommon', 300, '{"INT":10,"DEF":5}'::jsonb, false, 11, true),
  ('pernas-perneiras', 'Perneiras', 'ARC +10 / RES +5', 'pernas', 'feet', 'uncommon', 300, '{"ARC":10,"RES":5}'::jsonb, false, 12, true),
  ('pernas-perneiras-reforcadas', 'Perneiras Reforçadas', 'INT +5 / DEF +5 / RES +5', 'pernas', 'feet', 'uncommon', 300, '{"INT":5,"DEF":5,"RES":5}'::jsonb, false, 13, true);

alter table public.v2_character_inventory drop constraint if exists v2_character_inventory_item_id_fkey;
alter table public.v2_character_inventory add constraint v2_character_inventory_item_id_fkey foreign key (item_id) references public.v2_shop_items(id) on delete cascade;
alter table public.v2_character_inventory drop constraint if exists v2_character_inventory_equipped_slot_check;
alter table public.v2_character_inventory add constraint v2_character_inventory_equipped_slot_check check (equipped_slot is null or equipped_slot in ('weapon','shield','head','torso','hands','feet'));

create or replace function public.v2_select_character(p_character_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if (select auth.uid()) is null or not exists (select 1 from public.v2_characters where id=p_character_id and user_id=(select auth.uid())) then raise exception 'Personagem inválido' using errcode='42501'; end if;
  insert into public.v2_active_characters(user_id,character_id,selected_at) values((select auth.uid()),p_character_id,now())
  on conflict(user_id) do update set character_id=excluded.character_id, selected_at=now();
end; $$;

create or replace function public.v2_buy_shop_item(p_item_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare item public.v2_shop_items; chosen uuid; balance bigint;
begin
  select character_id into chosen from public.v2_active_characters where user_id=(select auth.uid());
  if chosen is null then raise exception 'Selecione um personagem antes de comprar'; end if;
  select * into item from public.v2_shop_items where id=p_item_id and active for update;
  if item.id is null then raise exception 'Item indisponível'; end if;
  select gold into balance from public.v2_characters where id=chosen and user_id=(select auth.uid()) for update;
  if balance < item.price then raise exception 'WG insuficiente'; end if;
  update public.v2_characters set gold=gold-item.price, updated_at=now() where id=chosen;
  insert into public.v2_character_inventory(character_id,item_id) values(chosen,item.id)
  on conflict(character_id,item_id) do update set quantity=public.v2_character_inventory.quantity+1,updated_at=now();
end; $$;

revoke execute on function public.v2_select_character(uuid) from public, anon;
grant execute on function public.v2_select_character(uuid) to authenticated;
revoke execute on function public.v2_buy_shop_item(uuid) from public, anon;
grant execute on function public.v2_buy_shop_item(uuid) to authenticated;
grant select, update on public.v2_characters to authenticated;
grant select on public.v2_character_inventory to authenticated;

create or replace function public.v2_claim_daily_reward()
returns jsonb language plpgsql security definer set search_path = public as $$
declare p public.v2_player_progress; reward integer; chosen uuid;
begin
  select character_id into chosen from public.v2_active_characters where user_id=(select auth.uid());
  if chosen is null then raise exception 'Selecione um personagem antes de marcar presença'; end if;
  select * into p from public.v2_player_progress where user_id=(select auth.uid()) for update;
  if p.last_daily_claim=current_date then raise exception 'Presença já marcada hoje'; end if;
  p.daily_streak := case when p.last_daily_claim=current_date-1 then p.daily_streak+1 else 1 end;
  reward := 50 + least(p.daily_streak,7)*10;
  update public.v2_player_progress set daily_streak=p.daily_streak,last_daily_claim=current_date,last_seen_at=now() where user_id=(select auth.uid());
  update public.v2_characters set gold=gold+reward,updated_at=now() where id=chosen and user_id=(select auth.uid());
  return jsonb_build_object('reward',reward,'streak',p.daily_streak,'character_id',chosen);
end; $$;
revoke execute on function public.v2_claim_daily_reward() from public,anon;
grant execute on function public.v2_claim_daily_reward() to authenticated;

create or replace function public.v2_character_ranking()
returns table(id uuid, user_id uuid, name text, level integer, xp bigint, race_name text, class_name text)
language sql stable security definer set search_path = public as $$
  select c.id, c.user_id, c.name, c.level, c.xp, r.name, cl.name
  from public.v2_characters c
  join public.v2_content r on r.id=c.race_id
  join public.v2_content cl on cl.id=c.class_id
  order by c.level desc, c.xp desc, c.created_at asc
  limit 100
$$;
revoke execute on function public.v2_character_ranking() from public;
grant execute on function public.v2_character_ranking() to anon, authenticated;

create table if not exists public.v2_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 100),
  event_type text not null default 'Comunidade',
  description text not null default '',
  starts_at timestamptz not null,
  registration_label text not null default 'Inscrições em breve',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.v2_updates (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  title text not null check (char_length(trim(title)) between 2 and 120),
  notes jsonb not null default '[]'::jsonb check (jsonb_typeof(notes)='array'),
  published_on date not null default current_date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.v2_events enable row level security;
alter table public.v2_updates enable row level security;
create policy "events public read" on public.v2_events for select to anon,authenticated using (active or (select public.v2_is_admin()));
create policy "events admin manage" on public.v2_events for all to authenticated using ((select public.v2_is_admin())) with check ((select public.v2_is_admin()));
create policy "updates public read" on public.v2_updates for select to anon,authenticated using (active or (select public.v2_is_admin()));
create policy "updates admin manage" on public.v2_updates for all to authenticated using ((select public.v2_is_admin())) with check ((select public.v2_is_admin()));
grant select on public.v2_events, public.v2_updates to anon,authenticated;
grant insert,update,delete on public.v2_events, public.v2_updates to authenticated;

insert into public.v2_events(title,event_type,description,starts_at,registration_label) values
('Abertura dos Portões','Comunidade','Boas-vindas, apresentação das regras e encontro dos primeiros aventureiros.','2026-08-12 19:00:00-03','Inscrições abertas'),
('Expedição em Aokigahara','Aventura','Uma missão coletiva entre as árvores ancestrais do reino da floresta.','2026-08-16 19:00:00-03','Inscrições em breve'),
('Arena de Iniciantes','Combate','Rodada amistosa para conhecer o sistema de batalha.','2026-08-23 19:00:00-03','Inscrições em breve')
on conflict do nothing;
insert into public.v2_updates(version,title,notes,published_on) values
('2.2.0','Os portões estão abertos','["Portal dos jogadores lançado","Níveis, experiência e economia ativados","Ranking, conquistas e eventos disponíveis"]'::jsonb,'2026-08-09'),
('2.1.0','Raças oficiais','["Catálogo de raças revisado","Contas e permissões fortalecidas"]'::jsonb,'2026-08-06')
on conflict(version) do nothing;

commit;
