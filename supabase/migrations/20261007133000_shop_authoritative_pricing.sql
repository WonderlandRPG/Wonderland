create or replace function public.v2_get_shop_multiplier()
returns numeric
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  chosen_kingdom text;
begin
  select character.kingdom
    into chosen_kingdom
  from public.v2_active_characters active
  join public.v2_characters character on character.id = active.character_id
  where active.user_id = (select auth.uid())
    and character.user_id = (select auth.uid());

  if chosen_kingdom is null then
    raise exception 'Selecione um personagem antes de consultar a loja' using errcode = '42501';
  end if;

  return public.v2_kingdom_shop_multiplier(chosen_kingdom);
end;
$$;

revoke all on function public.v2_get_shop_multiplier() from public, anon;
grant execute on function public.v2_get_shop_multiplier() to authenticated;

comment on function public.v2_get_shop_multiplier() is
  'Retorna ao jogador autenticado o mesmo multiplicador autoritativo usado nas compras da loja.';
