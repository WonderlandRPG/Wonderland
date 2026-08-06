-- Wonderland: rework completo do CMS administrativo
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Itens: estrutura definitiva, compatibilidade e salvamento seguro
-- ---------------------------------------------------------------------------
alter table public.items add column if not exists item_key text;
alter table public.items add column if not exists name text;
alter table public.items add column if not exists description text;
alter table public.items add column if not exists slot text;
alter table public.items add column if not exists rarity text;
alter table public.items add column if not exists price_wg bigint;
alter table public.items add column if not exists image_url text;
alter table public.items add column if not exists icon_url text;
alter table public.items add column if not exists for_bonus integer;
alter table public.items add column if not exists def_bonus integer;
alter table public.items add column if not exists res_bonus integer;
alter table public.items add column if not exists ini_bonus integer;
alter table public.items add column if not exists int_bonus integer;
alter table public.items add column if not exists arc_bonus integer;
alter table public.items add column if not exists two_handed boolean;
alter table public.items add column if not exists occupy_two_slots boolean;
alter table public.items add column if not exists active_shop boolean;
alter table public.items add column if not exists required_level integer;
alter table public.items add column if not exists updated_at timestamptz not null default now();

-- Corrige ids ausentes e garante geração automática.
alter table public.items alter column id set default gen_random_uuid();
update public.items set id = gen_random_uuid() where id is null;
alter table public.items alter column id set not null;

-- Normaliza dados antigos antes de aplicar as restrições novas.
update public.items set rarity = case
  when lower(coalesce(rarity,'')) in ('comum','common') then 'Comum'
  when lower(coalesce(rarity,'')) in ('incomum','uncommon') then 'Incomum'
  when lower(coalesce(rarity,'')) in ('raro','rare') then 'Raro'
  when lower(coalesce(rarity,'')) in ('épico','epico','epic') then 'Épico'
  when lower(coalesce(rarity,'')) in ('lendário','lendario','legendary') then 'Lendário'
  when lower(coalesce(rarity,'')) in ('mítico','mitico','mythic') then 'Mítico'
  else 'Comum'
end;
update public.items set price_wg = greatest(coalesce(price_wg,0),0);
update public.items set for_bonus = greatest(coalesce(for_bonus,0),0);
update public.items set def_bonus = greatest(coalesce(def_bonus,0),0);
update public.items set res_bonus = greatest(coalesce(res_bonus,0),0);
update public.items set ini_bonus = greatest(coalesce(ini_bonus,0),0);
update public.items set int_bonus = greatest(coalesce(int_bonus,0),0);
update public.items set arc_bonus = greatest(coalesce(arc_bonus,0),0);
update public.items set two_handed = coalesce(two_handed,false);
update public.items set occupy_two_slots = coalesce(occupy_two_slots,false);
update public.items set active_shop = coalesce(active_shop,true);
update public.items set required_level = greatest(1,least(100,coalesce(required_level,1)));

alter table public.items alter column rarity set default 'Comum';
alter table public.items alter column rarity set not null;
alter table public.items alter column price_wg set default 0;
alter table public.items alter column price_wg set not null;
alter table public.items alter column for_bonus set default 0;
alter table public.items alter column for_bonus set not null;
alter table public.items alter column def_bonus set default 0;
alter table public.items alter column def_bonus set not null;
alter table public.items alter column res_bonus set default 0;
alter table public.items alter column res_bonus set not null;
alter table public.items alter column ini_bonus set default 0;
alter table public.items alter column ini_bonus set not null;
alter table public.items alter column int_bonus set default 0;
alter table public.items alter column int_bonus set not null;
alter table public.items alter column arc_bonus set default 0;
alter table public.items alter column arc_bonus set not null;
alter table public.items alter column two_handed set default false;
alter table public.items alter column two_handed set not null;
alter table public.items alter column occupy_two_slots set default false;
alter table public.items alter column occupy_two_slots set not null;
alter table public.items alter column active_shop set default true;
alter table public.items alter column active_shop set not null;
alter table public.items alter column required_level set default 1;
alter table public.items alter column required_level set not null;

-- Remove restrições antigas que impedem valores oficiais em português.
do $$
declare r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.items'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%rarity%'
  loop
    execute format('alter table public.items drop constraint if exists %I', r.conname);
  end loop;
end $$;

alter table public.items add constraint items_rarity_check
check (rarity in ('Comum','Incomum','Raro','Épico','Lendário','Mítico'));

alter table public.items drop constraint if exists items_price_wg_check;
alter table public.items add constraint items_price_wg_check check (price_wg >= 0);
alter table public.items drop constraint if exists items_required_level_check;
alter table public.items add constraint items_required_level_check check (required_level between 1 and 100);

create unique index if not exists items_item_key_unique_full
on public.items(item_key) where item_key is not null;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists items_touch_updated_at on public.items;
create trigger items_touch_updated_at
before update on public.items
for each row execute function public.touch_updated_at();

create or replace function public.admin_save_item(p_item jsonb)
returns public.items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_row public.items;
  v_id uuid;
  v_key text := nullif(trim(p_item->>'item_key'),'');
  v_rarity text := case
    when lower(coalesce(p_item->>'rarity','')) in ('comum','common') then 'Comum'
    when lower(coalesce(p_item->>'rarity','')) in ('incomum','uncommon') then 'Incomum'
    when lower(coalesce(p_item->>'rarity','')) in ('raro','rare') then 'Raro'
    when lower(coalesce(p_item->>'rarity','')) in ('épico','epico','epic') then 'Épico'
    when lower(coalesce(p_item->>'rarity','')) in ('lendário','lendario','legendary') then 'Lendário'
    when lower(coalesce(p_item->>'rarity','')) in ('mítico','mitico','mythic') then 'Mítico'
    else 'Comum'
  end;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if coalesce(v_role,'') <> 'admin' then
    raise exception 'Apenas administradores podem salvar itens.';
  end if;

  if nullif(p_item->>'id','') is not null then
    begin
      v_id := (p_item->>'id')::uuid;
    exception when others then
      v_id := null;
    end;
  end if;

  if v_id is null and v_key is not null then
    select id into v_id from public.items where item_key = v_key limit 1;
  end if;

  if v_id is null and nullif(trim(p_item->>'name'),'') is not null then
    select id into v_id from public.items where lower(name)=lower(trim(p_item->>'name')) limit 1;
  end if;

  if v_id is null then
    insert into public.items(
      id,item_key,name,description,slot,rarity,price_wg,image_url,icon_url,
      for_bonus,def_bonus,res_bonus,ini_bonus,int_bonus,arc_bonus,
      two_handed,occupy_two_slots,active_shop,required_level
    ) values (
      gen_random_uuid(),v_key,trim(p_item->>'name'),coalesce(p_item->>'description',''),
      coalesce(nullif(p_item->>'slot',''),'head'),v_rarity,
      greatest(coalesce((p_item->>'price_wg')::bigint,0),0),
      nullif(p_item->>'image_url',''),nullif(p_item->>'icon_url',''),
      greatest(coalesce((p_item->>'for_bonus')::int,0),0),
      greatest(coalesce((p_item->>'def_bonus')::int,0),0),
      greatest(coalesce((p_item->>'res_bonus')::int,0),0),
      greatest(coalesce((p_item->>'ini_bonus')::int,0),0),
      greatest(coalesce((p_item->>'int_bonus')::int,0),0),
      greatest(coalesce((p_item->>'arc_bonus')::int,0),0),
      coalesce((p_item->>'two_handed')::boolean,false),
      coalesce((p_item->>'occupy_two_slots')::boolean,false),
      coalesce((p_item->>'active_shop')::boolean,true),
      greatest(1,least(100,coalesce((p_item->>'required_level')::int,1)))
    ) returning * into v_row;
  else
    update public.items set
      item_key=v_key,
      name=trim(p_item->>'name'),
      description=coalesce(p_item->>'description',''),
      slot=coalesce(nullif(p_item->>'slot',''),'head'),
      rarity=v_rarity,
      price_wg=greatest(coalesce((p_item->>'price_wg')::bigint,0),0),
      image_url=nullif(p_item->>'image_url',''),
      icon_url=nullif(p_item->>'icon_url',''),
      for_bonus=greatest(coalesce((p_item->>'for_bonus')::int,0),0),
      def_bonus=greatest(coalesce((p_item->>'def_bonus')::int,0),0),
      res_bonus=greatest(coalesce((p_item->>'res_bonus')::int,0),0),
      ini_bonus=greatest(coalesce((p_item->>'ini_bonus')::int,0),0),
      int_bonus=greatest(coalesce((p_item->>'int_bonus')::int,0),0),
      arc_bonus=greatest(coalesce((p_item->>'arc_bonus')::int,0),0),
      two_handed=coalesce((p_item->>'two_handed')::boolean,false),
      occupy_two_slots=coalesce((p_item->>'occupy_two_slots')::boolean,false),
      active_shop=coalesce((p_item->>'active_shop')::boolean,true),
      required_level=greatest(1,least(100,coalesce((p_item->>'required_level')::int,1)))
    where id=v_id
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

grant execute on function public.admin_save_item(jsonb) to authenticated;

create or replace function public.admin_delete_item(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_role text;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if coalesce(v_role,'') <> 'admin' then
    raise exception 'Apenas administradores podem excluir itens.';
  end if;
  delete from public.items where id = p_id;
end;
$$;

grant execute on function public.admin_delete_item(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Balanceamento central: valores editáveis pelo painel
-- ---------------------------------------------------------------------------
create table if not exists public.game_balance (
  key text primary key,
  category text not null,
  label text not null,
  description text,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.game_balance(key,category,label,description,value) values
('def_points_per_percent','attributes','DEF por 1%','Quantidade de DEF necessária para reduzir 1% de dano físico','5'::jsonb),
('res_points_per_percent','attributes','RES por 1%','Quantidade de RES necessária para reduzir 1% de dano mágico e verdadeiro','8'::jsonb),
('res_hp_per_point','attributes','HP por RES','HP adicional concedido por ponto de RES','2'::jsonb),
('int_mana_per_point','attributes','Mana por INT','Mana adicional concedida por ponto de INT','2'::jsonb),
('starting_wg','economy','WG inicial','WG recebido ao criar um personagem','1500'::jsonb),
('turn_seconds','combat','Tempo por turno','Tempo limite de uma ação de jogador em segundos','60'::jsonb),
('defend_cooldown','combat','Recarga de Defender','Turnos de recarga da ação Defender','5'::jsonb)
on conflict (key) do nothing;

create or replace function public.admin_save_balance(p_key text,p_value jsonb)
returns public.game_balance
language plpgsql
security definer
set search_path=public
as $$
declare v_role text; v_row public.game_balance;
begin
  select role into v_role from public.profiles where id=auth.uid();
  if coalesce(v_role,'') <> 'admin' then raise exception 'Apenas administradores podem alterar o balanceamento.'; end if;
  update public.game_balance set value=p_value,updated_at=now() where key=p_key returning * into v_row;
  return v_row;
end;
$$;

grant execute on function public.admin_save_balance(text,jsonb) to authenticated;

notify pgrst, 'reload schema';
