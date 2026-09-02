create table if not exists public.v2_cosmetics (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null default '',
  slot text not null check (slot in ('card','aura','border')),
  rarity text not null default 'legendary',
  collection_name text not null,
  price_cents integer check (price_cents is null or price_cents >= 0),
  artwork_url text,
  active boolean not null default false,
  grant_only boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.v2_character_cosmetics (
  character_id uuid not null references public.v2_characters(id) on delete cascade,
  cosmetic_id uuid not null references public.v2_cosmetics(id) on delete cascade,
  granted_by uuid,
  grant_reason text not null default 'admin',
  created_at timestamptz not null default now(),
  primary key (character_id, cosmetic_id)
);

alter table public.v2_cosmetics enable row level security;
alter table public.v2_character_cosmetics enable row level security;
drop policy if exists cosmetics_catalog_read on public.v2_cosmetics;
create policy cosmetics_catalog_read on public.v2_cosmetics for select to authenticated
using (active or (select public.v2_is_admin()) or exists(select 1 from public.v2_character_cosmetics cc join public.v2_characters c on c.id=cc.character_id where cc.cosmetic_id=v2_cosmetics.id and c.user_id=(select auth.uid())));
drop policy if exists owned_cosmetics_read on public.v2_character_cosmetics;
create policy owned_cosmetics_read on public.v2_character_cosmetics for select to authenticated
using (public.v2_is_admin() or exists(select 1 from public.v2_characters c where c.id=character_id and c.user_id=(select auth.uid())));
grant select on public.v2_cosmetics, public.v2_character_cosmetics to authenticated;
create index if not exists v2_character_cosmetics_cosmetic_idx on public.v2_character_cosmetics(cosmetic_id);

insert into public.v2_cosmetics(key,name,description,slot,rarity,collection_name,price_cents,artwork_url,active,grant_only,sort_order)
values
 ('moldura-fundadores-2026','Estrela dos Fundadores','Moldura cerimonial concedida a quem participou da inauguração de Wonderland.','border','commemorative','Inauguração 2026',null,'/cosmetics/inauguracao/moldura-fundadores-2026.png',false,true,10),
 ('vigilia-do-cemiterio','Vigília do Cemitério','Card animado com vinhas, lanternas, lápides e aparições nas margens do retrato.','card','legendary','Halloween 2026',4990,'/cosmetics/halloween-2026/vigilia-do-cemiterio.png',false,false,20),
 ('moldura-colheita-noturna','Colheita da Meia-Noite','Moldura completa de vinhas violetas, abóboras e fogo mágico.','border','mythic','Halloween 2026',5990,'/cosmetics/halloween-2026/colheita-da-meia-noite.png',false,false,30),
 ('voo-da-bruxa','Voo da Bruxa Errante','Aura animada com uma bruxa atravessando o retrato e uma revoada de morcegos.','aura','mythic','Halloween 2026',5490,'/cosmetics/halloween-2026/voo-da-bruxa.png',false,false,40)
on conflict(key) do update set name=excluded.name,description=excluded.description,slot=excluded.slot,rarity=excluded.rarity,collection_name=excluded.collection_name,price_cents=excluded.price_cents,artwork_url=excluded.artwork_url,active=excluded.active,grant_only=excluded.grant_only,sort_order=excluded.sort_order,updated_at=now();

update public.v2_characters set cosmetics = cosmetics - array_remove(array[
 case when cosmetics->>'card'='noite-veu-partido' then 'card' end,
 case when cosmetics->>'aura'='cortejo-fogos-fatuos' then 'aura' end,
 case when cosmetics->>'border'='trono-rei-oco' then 'border' end
],null) where cosmetics->>'card'='noite-veu-partido' or cosmetics->>'aura'='cortejo-fogos-fatuos' or cosmetics->>'border'='trono-rei-oco';

create or replace function public.v2_set_character_cosmetic(p_character_id uuid,p_slot text,p_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare caller_id uuid := (select auth.uid()); current_loadout jsonb; next_loadout jsonb;
begin
 if caller_id is null then raise exception 'Autenticação necessária.' using errcode='42501'; end if;
 if p_slot not in ('card','aura','border') then raise exception 'Slot inválido.' using errcode='22023'; end if;
 select cosmetics into current_loadout from public.v2_characters where id=p_character_id and user_id=caller_id;
 if current_loadout is null then raise exception 'Personagem não encontrado.' using errcode='P0002'; end if;
 if p_key is null or btrim(p_key)='' then next_loadout:=current_loadout-p_slot;
 else
  if not exists(select 1 from public.v2_character_cosmetics cc join public.v2_cosmetics c on c.id=cc.cosmetic_id where cc.character_id=p_character_id and c.key=p_key and c.slot=p_slot) then raise exception 'Este cosmético não pertence ao personagem.' using errcode='42501'; end if;
  next_loadout:=jsonb_set(current_loadout,array[p_slot],to_jsonb(p_key),true);
 end if;
 update public.v2_characters set cosmetics=next_loadout,updated_at=now() where id=p_character_id;
 return next_loadout;
end $$;

create or replace function public.v2_admin_update_cosmetic(p_cosmetic_id uuid,p_price_cents integer,p_active boolean)
returns void language plpgsql security definer set search_path='' as $$ begin
 if not public.v2_is_admin() then raise exception 'Acesso negado.' using errcode='42501'; end if;
 update public.v2_cosmetics set price_cents=p_price_cents,active=p_active,updated_at=now() where id=p_cosmetic_id;
end $$;

create or replace function public.v2_admin_grant_cosmetic(p_cosmetic_id uuid,p_character_id uuid default null,p_all boolean default false)
returns integer language plpgsql security definer set search_path='' as $$ declare affected integer; begin
 if not public.v2_is_admin() then raise exception 'Acesso negado.' using errcode='42501'; end if;
 if p_all then insert into public.v2_character_cosmetics(character_id,cosmetic_id,granted_by,grant_reason) select id,p_cosmetic_id,(select auth.uid()),'admin-all' from public.v2_characters on conflict do nothing;
 else insert into public.v2_character_cosmetics(character_id,cosmetic_id,granted_by) values(p_character_id,p_cosmetic_id,(select auth.uid())) on conflict do nothing; end if;
 get diagnostics affected=row_count; return affected;
end $$;

revoke all on function public.v2_set_character_cosmetic(uuid,text,text), public.v2_admin_update_cosmetic(uuid,integer,boolean), public.v2_admin_grant_cosmetic(uuid,uuid,boolean) from public,anon;
grant execute on function public.v2_set_character_cosmetic(uuid,text,text), public.v2_admin_update_cosmetic(uuid,integer,boolean), public.v2_admin_grant_cosmetic(uuid,uuid,boolean) to authenticated;
