-- Wonderland: correção robusta de IDs de itens e sincronização de nível
create extension if not exists pgcrypto;

-- ITENS: aceita tabelas antigas com id text ou uuid sem quebrar o painel.
create or replace function public.admin_save_item(p_item jsonb)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_role text;
  v_id_text text := nullif(trim(p_item->>'id'),'');
  v_item_key text := nullif(trim(p_item->>'item_key'),'');
  v_name text := nullif(trim(p_item->>'name'),'');
  v_rarity text := coalesce(nullif(trim(p_item->>'rarity'),''),'Comum');
  v_existing record;
  v_inserted record;
  v_id_is_uuid boolean;
begin
  select role into v_role from public.profiles where id=auth.uid();
  if coalesce(v_role,'') <> 'admin' then
    raise exception 'Apenas administradores podem salvar itens.';
  end if;

  if v_name is null then raise exception 'O nome do item é obrigatório.'; end if;
  if v_rarity not in ('Comum','Incomum','Raro','Épico','Lendário','Mítico') then v_rarity := 'Comum'; end if;

  select (data_type='uuid') into v_id_is_uuid
  from information_schema.columns
  where table_schema='public' and table_name='items' and column_name='id';

  if v_id_text is not null then
    begin
      execute 'select * from public.items where id::text = $1 limit 1' into v_existing using v_id_text;
    exception when others then
      v_existing := null;
    end;
  end if;

  if v_existing is null and v_item_key is not null then
    select * into v_existing from public.items where item_key=v_item_key limit 1;
  end if;

  if v_existing is null then
    select * into v_existing from public.items where lower(name)=lower(v_name) limit 1;
  end if;

  if v_existing is not null then
    execute $q$
      update public.items set
        item_key=$1,name=$2,description=$3,slot=$4,rarity=$5,price_wg=$6,
        image_url=$7,icon_url=$8,for_bonus=$9,def_bonus=$10,res_bonus=$11,ini_bonus=$12,
        int_bonus=$13,arc_bonus=$14,two_handed=$15,occupy_two_slots=$16,
        active_shop=$17,required_level=$18
      where id::text=$19
      returning *
    $q$ into v_inserted using
      v_item_key,v_name,coalesce(p_item->>'description',''),coalesce(nullif(p_item->>'slot',''),'head'),v_rarity,
      greatest(coalesce((p_item->>'price_wg')::bigint,0),0),nullif(p_item->>'image_url',''),nullif(p_item->>'icon_url',''),
      greatest(coalesce((p_item->>'for_bonus')::int,0),0),greatest(coalesce((p_item->>'def_bonus')::int,0),0),
      greatest(coalesce((p_item->>'res_bonus')::int,0),0),greatest(coalesce((p_item->>'ini_bonus')::int,0),0),
      greatest(coalesce((p_item->>'int_bonus')::int,0),0),greatest(coalesce((p_item->>'arc_bonus')::int,0),0),
      coalesce((p_item->>'two_handed')::boolean,false),coalesce((p_item->>'occupy_two_slots')::boolean,false),
      coalesce((p_item->>'active_shop')::boolean,true),greatest(1,least(100,coalesce((p_item->>'required_level')::int,1))),
      v_existing.id::text;
  else
    if coalesce(v_id_is_uuid,false) then
      execute $q$
        insert into public.items(
          id,item_key,name,description,slot,rarity,price_wg,image_url,icon_url,
          for_bonus,def_bonus,res_bonus,ini_bonus,int_bonus,arc_bonus,
          two_handed,occupy_two_slots,active_shop,required_level
        ) values (
          gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
        ) returning *
      $q$ into v_inserted using
        v_item_key,v_name,coalesce(p_item->>'description',''),coalesce(nullif(p_item->>'slot',''),'head'),v_rarity,
        greatest(coalesce((p_item->>'price_wg')::bigint,0),0),nullif(p_item->>'image_url',''),nullif(p_item->>'icon_url',''),
        greatest(coalesce((p_item->>'for_bonus')::int,0),0),greatest(coalesce((p_item->>'def_bonus')::int,0),0),
        greatest(coalesce((p_item->>'res_bonus')::int,0),0),greatest(coalesce((p_item->>'ini_bonus')::int,0),0),
        greatest(coalesce((p_item->>'int_bonus')::int,0),0),greatest(coalesce((p_item->>'arc_bonus')::int,0),0),
        coalesce((p_item->>'two_handed')::boolean,false),coalesce((p_item->>'occupy_two_slots')::boolean,false),
        coalesce((p_item->>'active_shop')::boolean,true),greatest(1,least(100,coalesce((p_item->>'required_level')::int,1)));
    else
      execute $q$
        insert into public.items(
          id,item_key,name,description,slot,rarity,price_wg,image_url,icon_url,
          for_bonus,def_bonus,res_bonus,ini_bonus,int_bonus,arc_bonus,
          two_handed,occupy_two_slots,active_shop,required_level
        ) values (
          coalesce($19,gen_random_uuid()::text),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
        ) returning *
      $q$ into v_inserted using
        v_item_key,v_name,coalesce(p_item->>'description',''),coalesce(nullif(p_item->>'slot',''),'head'),v_rarity,
        greatest(coalesce((p_item->>'price_wg')::bigint,0),0),nullif(p_item->>'image_url',''),nullif(p_item->>'icon_url',''),
        greatest(coalesce((p_item->>'for_bonus')::int,0),0),greatest(coalesce((p_item->>'def_bonus')::int,0),0),
        greatest(coalesce((p_item->>'res_bonus')::int,0),0),greatest(coalesce((p_item->>'ini_bonus')::int,0),0),
        greatest(coalesce((p_item->>'int_bonus')::int,0),0),greatest(coalesce((p_item->>'arc_bonus')::int,0),0),
        coalesce((p_item->>'two_handed')::boolean,false),coalesce((p_item->>'occupy_two_slots')::boolean,false),
        coalesce((p_item->>'active_shop')::boolean,true),greatest(1,least(100,coalesce((p_item->>'required_level')::int,1))),
        v_id_text;
    end if;
  end if;

  return to_jsonb(v_inserted);
end $$;

grant execute on function public.admin_save_item(jsonb) to authenticated;

create or replace function public.admin_delete_item(p_id text)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare v_role text;
begin
  select role into v_role from public.profiles where id=auth.uid();
  if coalesce(v_role,'') <> 'admin' then raise exception 'Apenas administradores podem excluir itens.'; end if;
  execute 'delete from public.items where id::text=$1' using p_id;
end $$;

grant execute on function public.admin_delete_item(text) to authenticated;

-- NÍVEL: força sincronização pelo XP e corrige todos os personagens existentes.
create table if not exists public.level_progression(level integer primary key,total_xp bigint not null unique);

create or replace function public.level_from_total_xp(p_xp bigint)
returns integer language sql stable as $$
  select coalesce(max(level),1)
  from public.level_progression
  where total_xp <= greatest(coalesce(p_xp,0),0);
$$;

create or replace function public.sync_character_level_from_xp()
returns trigger language plpgsql as $$
begin
  new.experience := greatest(coalesce(new.experience,0),0);
  new.level := public.level_from_total_xp(new.experience);
  return new;
end $$;

drop trigger if exists characters_sync_level_from_xp on public.characters;
create trigger characters_sync_level_from_xp
before insert or update of experience on public.characters
for each row execute function public.sync_character_level_from_xp();

update public.characters set level=public.level_from_total_xp(experience);
notify pgrst,'reload schema';
