import fs from "node:fs";

const groups = {
  espadas: [
    ["Espada Curta", "FOR:10,INI:5"],
    ["Espada", "FOR:15"],
    ["Espada Longa", "FOR:10,DEF:5"],
    ["Espada Bastarda", "FOR:5,DEF:5,INI:5"],
    ["Espadão (duas mãos)", "FOR:30"],
    ["Espada Larga", "FOR:15"],
    ["Sabre", "INI:15"],
    ["Rapieira", "INI:10,FOR:5"],
    ["Florete", "INI:10,DEF:5"],
    ["Katana", "INI:10,FOR:5"],
    ["Nodachi (duas mãos)", "FOR:20,INI:10"],
    ["Wakizashi", "INI:15"],
    ["Tanto", "INI:10,FOR:5"],
  ],
  machados: [
    ["Machado de Mão", "FOR:15"],
    ["Machado de Guerra", "FOR:10,DEF:5"],
    ["Machado Duplo", "FOR:10,INI:5"],
    ["Machado Gigante (duas mãos)", "FOR:30"],
    ["Machado Bárbaro (duas mãos)", "FOR:20,RES:10"],
  ],
  martelos: [
    ["Martelo", "FOR:10,DEF:5"],
    ["Martelo de Guerra", "FOR:15"],
    ["Marreta (duas mãos)", "FOR:20,DEF:10"],
    ["Martelo Colossal (duas mãos)", "FOR:20,RES:10"],
  ],
  lancas: [
    ["Lança", "FOR:10,INI:5"],
    ["Pique (duas mãos)", "FOR:20,INI:10"],
    ["Alabarda (duas mãos)", "FOR:10,DEF:10,INI:10"],
    ["Glaive (duas mãos)", "FOR:20,INI:10"],
    ["Tridente", "FOR:5,DEF:5,INI:5"],
    ["Naginata (duas mãos)", "FOR:20,INI:10"],
  ],
  hastes: [
    ["Bastão", "DEF:10,INI:5"],
    ["Cajado de Combate", "FOR:10,INT:5"],
    ["Foice de Guerra (duas mãos)", "FOR:10,ARC:10,INI:10"],
    ["Mangual", "FOR:10,DEF:5"],
    ["Mangual Pesado (duas mãos)", "FOR:20,DEF:10"],
  ],
  adagas: [
    ["Adaga", "INI:15"],
    ["Punhal", "INI:10,FOR:5"],
    ["Dirk", "FOR:10,INI:5"],
    ["Kris", "ARC:10,INI:5"],
    ["Kunai", "INI:10,FOR:5"],
  ],
  punho: [
    ["Manoplas", "FOR:15"],
    ["Soqueiras", "FOR:10,INI:5"],
    ["Garras", "INI:10,FOR:5"],
    ["Tonfas", "DEF:10,INI:5"],
  ],
  arcos: [
    ["Arco Curto", "INI:15"],
    ["Arco Longo (duas mãos)", "INI:30"],
    ["Arco Composto (duas mãos)", "FOR:20,INI:10"],
    ["Arco Élfico (duas mãos)", "INT:20,INI:10"],
  ],
  bestas: [
    ["Besta Leve", "INI:10,FOR:5"],
    ["Besta", "FOR:10,INI:5"],
    ["Besta Pesada (duas mãos)", "FOR:20,DEF:1"],
  ],
  cajados: [
    ["Cajado", "INT:15"],
    ["Cajado Arcano (duas mãos)", "INT:30"],
    ["Cajado Sagrado (duas mãos)", "ARC:20,RES:10"],
    ["Cajado Ancestral (duas mãos)", "INT:20,ARC:10"],
  ],
  catalisadores: [
    ["Cetro", "ARC:15"],
    ["Orbe", "INT:10,ARC:5"],
    ["Grimório", "INT:15"],
    ["Tomo", "INT:10,RES:5"],
    ["Relicário", "ARC:10,RES:5"],
    ["Cristal Arcano", "ARC:10,INT:5"],
    ["Varinha", "INT:10,ARC:5"],
  ],
  escudos: [
    ["Broquel", "DEF:10,INI:5"],
    ["Escudo", "DEF:15"],
    ["Escudo Redondo", "DEF:10,RES:5"],
    ["Escudo de Gigante (duas mãos)", "DEF:30"],
    ["Escudo Pesado", "DEF:10,FOR:5"],
    ["Escudo Rúnico", "ARC:10,DEF:5"],
    ["Escudo Sagrado", "ARC:10,RES:5"],
  ],
  cabeca: [
    ["Elmo", "DEF:15"],
    ["Elmo Reforçado", "DEF:10,RES:5"],
    ["Capacete", "RES:15"],
    ["Capacete de Ferro", "RES:10,DEF:5"],
    ["Capuz", "INT:15"],
    ["Capuz de Couro", "INT:10,ARC:5"],
    ["Tiara", "ARC:15"],
    ["Tiara de Ferro", "ARC:10,INT:5"],
    ["Faixa", "INI:15"],
    ["Faixa de Combate", "INI:10,RES:5"],
    ["Coroa", "INT:10,DEF:5"],
    ["Máscara", "ARC:10,RES:5"],
    ["Chapéu", "INT:5,DEF:5,RES:5"],
    ["Chapéu de Couro", "ARC:5,DEF:5,RES:5"],
  ],
  peitoral: [
    ["Peitoral", "DEF:15"],
    ["Peitoral de Ferro", "DEF:10,RES:5"],
    ["Couraça", "RES:15"],
    ["Couraça Reforçada", "RES:10,DEF:5"],
    ["Armadura", "FOR:15"],
    ["Armadura de Ferro", "FOR:10,DEF:5"],
    ["Colete", "INI:10,DEF:5"],
    ["Colete de Couro", "FOR:5,DEF:5,RES:5"],
    ["Gibão", "ARC:10,RES:5"],
    ["Gibão Reforçado", "ARC:10,DEF:5"],
    ["Túnica", "INT:10,ARC:5"],
    ["Túnica Acolchoada", "INT:10,RES:5"],
    ["Manto", "INT:10,DEF:5"],
    ["Cota de Malha", "INT:5,DEF:5,RES:5"],
  ],
  bracos: [
    ["Luvas", "FOR:15"],
    ["Luvas de Couro", "FOR:10,INI:5"],
    ["Luvas de Ferro", "DEF:10,FOR:5"],
    ["Manoplas", "DEF:15"],
    ["Manoplas Pesadas", "DEF:10,RES:5"],
    ["Braçadeiras", "ARC:15"],
    ["Braçadeiras de Couro", "ARC:10,INT:5"],
    ["Braçadeiras de Ferro", "RES:10,DEF:5"],
    ["Braceletes", "INT:10,ARC:5"],
    ["Munhequeiras", "INI:15"],
    ["Munhequeiras de Couro", "INI:10,FOR:5"],
    ["Protetores de Braço", "INT:10,DEF:5"],
    ["Mangas Reforçadas", "ARC:10,RES:5"],
    ["Mangas", "FOR:5,INI:5,DEF:5"],
  ],
  pernas: [
    ["Calças", "RES:15"],
    ["Calças Reforçadas", "RES:10,INI:5"],
    ["Grevas", "DEF:15"],
    ["Grevas de Ferro", "DEF:10,RES:5"],
    ["Botas", "INI:15"],
    ["Botas de Couro", "INI:10,FOR:5"],
    ["Botas de Ferro", "FOR:15"],
    ["Botinas", "FOR:10,DEF:5"],
    ["Sandálias", "ARC:10,INI:5"],
    ["Sapatos", "INT:10,INI:5"],
    ["Joelheiras", "DEF:5,RES:5,INI:5"],
    ["Joelheiras de Ferro", "INT:10,DEF:5"],
    ["Perneiras", "ARC:10,RES:5"],
    ["Perneiras Reforçadas", "INT:5,DEF:5,RES:5"],
  ],
};

const slots = {
  cabeca: "head",
  peitoral: "torso",
  bracos: "hands",
  pernas: "feet",
  escudos: "shield",
};
const rarities = ["common", "uncommon", "rare", "epic", "legendary", "mythic"];
const prices = { common: 180, uncommon: 300, rare: 480, epic: 750, legendary: 1050, mythic: 1400 };
const rareNames =
  /Katana|Wakizashi|Tanto|Kris|Kunai|Tridente|Glaive|Naginata|Rapieira|Florete|Tonfas|Garras|Relicário|Grimório|Tomo|Coroa|Máscara/;
const uncommonNames =
  /Longa|Bastarda|Larga|Guerra|Duplo|Pesad|Composto|Reforçad|Ferro|Couro|Combate|Dirk|Broquel|Redondo|Couraça|Colete|Gibão|Túnica|Cota|Braçadeiras|Braceletes|Munhequeiras|Protetores|Mangas|Botinas|Sandálias|Sapatos|Joelheiras|Perneiras/;

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\(duas maos\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
function rarity(name, twoHanded) {
  if (/Colossal|Gigante \(duas mãos\)|Ancestral/.test(name)) return "mythic";
  if (/Arcano|Sagrado|Rúnico|Élfico|Bárbaro/.test(name)) return "legendary";
  if (twoHanded) return "epic";
  if (rareNames.test(name)) return "rare";
  if (uncommonNames.test(name)) return "uncommon";
  return "common";
}

const records = [];
for (const [category, items] of Object.entries(groups)) {
  items.forEach(([name, raw], index) => {
    const attributes = Object.fromEntries(
      raw.split(",").map((part) => {
        const [key, value] = part.split(":");
        return [key, Number(value)];
      }),
    );
    const twoHanded = name.includes("(duas mãos)");
    const itemRarity = rarity(name, twoHanded);
    if (!rarities.includes(itemRarity)) throw new Error(`Raridade inválida: ${itemRarity}`);
    records.push({
      slug: `${category}-${slugify(name)}`,
      name,
      category,
      slot: slots[category] ?? "weapon",
      attributes,
      twoHanded,
      rarity: itemRarity,
      price: prices[itemRarity],
      sortOrder: index,
    });
  });
}

const valueRows = records.map((item) => {
  const description = Object.entries(item.attributes)
    .map(([key, value]) => `${key} +${value}`)
    .join(" / ");
  return `  ('${item.slug}', '${item.name.replaceAll("'", "''")}', '${description}', '${item.category}', '${item.slot}', '${item.rarity}', ${item.price}, '${JSON.stringify(item.attributes)}'::jsonb, ${item.twoHanded}, ${item.sortOrder})`;
});
const sql = `begin;

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
${valueRows.map((line) => line.replace(/\)$/, ", true)")).join(",\n")};

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
`;

fs.writeFileSync(
  new URL("../supabase/migrations/202608090004_player_selection_shop.sql", import.meta.url),
  sql,
);
console.log(`${records.length} itens gerados.`);
