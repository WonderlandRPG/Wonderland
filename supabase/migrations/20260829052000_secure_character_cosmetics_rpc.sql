begin;

create or replace function public.v2_set_character_cosmetics(
  p_character_id uuid,
  p_cosmetics jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  normalized jsonb := coalesce(p_cosmetics, '{}'::jsonb);
begin
  if caller_id is null then
    raise exception 'Autenticação necessária.' using errcode = '42501';
  end if;

  if not public.v2_is_admin() then
    raise exception 'Apenas administradores podem alterar cosméticos nesta fase.' using errcode = '42501';
  end if;

  if jsonb_typeof(normalized) <> 'object' then
    raise exception 'Configuração de cosméticos inválida.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_object_keys(normalized) as key
    where key not in ('card','frame','background','aura','theme')
  ) then
    raise exception 'Slot de cosmético inválido.' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.v2_characters
    where id = p_character_id
      and user_id = caller_id
  ) then
    raise exception 'Personagem inválido.' using errcode = '42501';
  end if;

  update public.v2_characters
  set cosmetics = normalized,
      updated_at = now()
  where id = p_character_id
    and user_id = caller_id;

  insert into public.v2_admin_history(actor_id, action, target_type, target_id, details)
  values (caller_id, 'character.cosmetics.updated', 'character_cosmetics', p_character_id, normalized);

  return normalized;
end;
$$;

revoke all on function public.v2_set_character_cosmetics(uuid, jsonb) from public, anon;
grant execute on function public.v2_set_character_cosmetics(uuid, jsonb) to authenticated;

commit;
