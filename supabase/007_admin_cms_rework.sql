-- Wonderland: CMS administrativo definitivo
create extension if not exists pgcrypto;

-- Corrige a chave primaria da tabela items em bancos antigos.
alter table public.items
  alter column id set default gen_random_uuid();

update public.items
set id = gen_random_uuid()
where id is null;

alter table public.items
  alter column id set not null;

create unique index if not exists items_item_key_unique_full
  on public.items(item_key)
  where item_key is not null;

-- Compatibilidade e auditoria.
alter table public.items
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists items_touch_updated_at on public.items;
create trigger items_touch_updated_at
before update on public.items
for each row execute function public.touch_updated_at();

-- Salva item sem depender do cliente conhecer o tipo exato da coluna id.
create or replace function public.admin_save_item(p_item jsonb)
returns public.items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_role text;
  v_row public.items;
  v_id uuid;
  v_key text := nullif(trim(p_item->>'item_key'),'');
begin
  select role into v_role from public.profiles where id = v_user;
  if coalesce(v_role,'') <> 'admin' then
    raise exception 'Apenas administradores podem salvar itens.';
  end if;

  if nullif(p_item->>'id','') is not null then
    begin v_id := (p_item->>'id')::uuid; exception when others then v_id := null; end;
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
      coalesce(nullif(p_item->>'slot',''),'head'),coalesce(nullif(p_item->>'rarity',''),'Comum'),
      greatest(coalesce((p_item->>'price_wg')::bigint,0),0),nullif(p_item->>'image_url',''),nullif(p_item->>'icon_url',''),
      greatest(coalesce((p_item->>'for_bonus')::int,0),0),greatest(coalesce((p_item->>'def_bonus')::int,0),0),
      greatest(coalesce((p_item->>'res_bonus')::int,0),0),greatest(coalesce((p_item->>'ini_bonus')::int,0),0),
      greatest(coalesce((p_item->>'int_bonus')::int,0),0),greatest(coalesce((p_item->>'arc_bonus')::int,0),0),
      coalesce((p_item->>'two_handed')::boolean,false),coalesce((p_item->>'occupy_two_slots')::boolean,false),
      coalesce((p_item->>'active_shop')::boolean,true),greatest(1,least(100,coalesce((p_item->>'required_level')::int,1)))
    ) returning * into v_row;
  else
    update public.items set
      item_key=v_key,
      name=trim(p_item->>'name'),
      description=coalesce(p_item->>'description',''),
      slot=coalesce(nullif(p_item->>'slot',''),'head'),
      rarity=coalesce(nullif(p_item->>'rarity',''),'Comum'),
      price_wg=greatest(coalesce((p_item->>'price_wg')::bigint,0),0),
      image_url=nullif(p_item->>'image_url',''),icon_url=nullif(p_item->>'icon_url',''),
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
    where id=v_id returning * into v_row;
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
  select role into v_role from public.profiles where id=auth.uid();
  if coalesce(v_role,'') <> 'admin' then raise exception 'Apenas administradores podem excluir itens.'; end if;
  delete from public.items where id=p_id;
end;
$$;

grant execute on function public.admin_delete_item(uuid) to authenticated;

notify pgrst, 'reload schema';
