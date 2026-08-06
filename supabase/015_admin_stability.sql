-- Wonderland — estabilidade do Painel ADM
-- Remove a dependência de ON CONFLICT em índices parciais e estabiliza balanceamento.

create extension if not exists pgcrypto;

-- 1. Remove duplicações de chaves naturais, preservando o registro mais recente.
do $$
begin
  if to_regclass('public.skills') is not null then
    delete from public.skills a
    using public.skills b
    where a.skill_key is not null
      and a.skill_key=b.skill_key
      and a.ctid<b.ctid;
  end if;

  if to_regclass('public.passives') is not null then
    delete from public.passives a
    using public.passives b
    where a.passive_key is not null
      and a.passive_key=b.passive_key
      and a.ctid<b.ctid;
  end if;

  if to_regclass('public.items') is not null then
    delete from public.items a
    using public.items b
    where a.item_key is not null
      and a.item_key=b.item_key
      and a.ctid<b.ctid;
  end if;

  if to_regclass('public.game_balance') is not null then
    delete from public.game_balance a
    using public.game_balance b
    where a.key is not null
      and a.key=b.key
      and a.ctid<b.ctid;
  end if;
end $$;

-- 2. Índices únicos completos. PostgreSQL permite múltiplos NULLs normalmente.
drop index if exists public.skills_skill_key_unique;
drop index if exists public.passives_passive_key_unique;
drop index if exists public.items_item_key_unique;

create unique index if not exists skills_skill_key_unique
  on public.skills(skill_key);

create unique index if not exists passives_passive_key_unique
  on public.passives(passive_key);

create unique index if not exists items_item_key_unique
  on public.items(item_key);

do $$
begin
  if to_regclass('public.game_balance') is not null then
    execute 'create unique index if not exists game_balance_key_unique on public.game_balance(key)';
  end if;
end $$;

-- 3. Salvamento de balanceamento sem ON CONFLICT.
drop function if exists public.admin_save_balance(text,jsonb);
drop function if exists public.admin_save_balance(text,json);

create function public.admin_save_balance(p_key text,p_value jsonb)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_role text;
  v_saved jsonb;
begin
  select role into v_role from public.profiles where id=auth.uid();
  if coalesce(v_role,'') <> 'admin' then
    raise exception 'Apenas administradores podem alterar o balanceamento.';
  end if;

  update public.game_balance
  set value=p_value,
      updated_at=now()
  where key=p_key
  returning to_jsonb(public.game_balance.*) into v_saved;

  if v_saved is null then
    insert into public.game_balance(key,value,label,description,category,updated_at)
    values(p_key,p_value,p_key,'Configuração criada pelo Painel ADM','world',now())
    returning to_jsonb(public.game_balance.*) into v_saved;
  end if;

  return v_saved;
end $$;

grant execute on function public.admin_save_balance(text,jsonb) to authenticated;

notify pgrst,'reload schema';
