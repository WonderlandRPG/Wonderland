create or replace function public.v2_set_character_cosmetic(
  p_character_id uuid,
  p_slot text,
  p_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  current_loadout jsonb;
  next_loadout jsonb;
begin
  if caller_id is null then
    raise exception 'Autenticação necessária.' using errcode='42501';
  end if;

  if not public.v2_is_admin() then
    raise exception 'Apenas administradores podem equipar cosméticos nesta fase.' using errcode='42501';
  end if;

  if p_slot not in ('card','aura','border') then
    raise exception 'Slot cosmético inválido.' using errcode='22023';
  end if;

  if p_key is not null and not (
    (p_slot='card' and p_key='epitafio-lua-carmesim') or
    (p_slot='aura' and p_key='procissao-almas-rubras') or
    (p_slot='border' and p_key='portico-lua-sangrenta')
  ) then
    raise exception 'Cosmético inválido.' using errcode='22023';
  end if;

  select cosmetics into current_loadout
  from public.v2_characters
  where id=p_character_id and user_id=caller_id;

  if current_loadout is null then
    raise exception 'Personagem não encontrado.' using errcode='P0002';
  end if;

  current_loadout := current_loadout - 'theme';

  if p_key is null or btrim(p_key)='' then
    next_loadout := current_loadout - p_slot;
  else
    next_loadout := jsonb_set(current_loadout, array[p_slot], to_jsonb(p_key), true);
  end if;

  update public.v2_characters
  set cosmetics=next_loadout
  where id=p_character_id and user_id=caller_id;

  insert into public.v2_admin_history(actor_id,action,target_type,target_id,details)
  values (
    caller_id,
    case when p_key is null or btrim(p_key)='' then 'character.cosmetic.removed' else 'character.cosmetic.equipped' end,
    'character_cosmetic',
    p_character_id,
    jsonb_build_object('slot',p_slot,'key',p_key)
  );

  return next_loadout;
end;
$$;

revoke all on function public.v2_set_character_cosmetic(uuid,text,text) from public,anon;
grant execute on function public.v2_set_character_cosmetic(uuid,text,text) to authenticated;
