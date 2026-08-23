begin;

create or replace function public.v2_admin_delete_character(p_character_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  character_row public.v2_characters;
begin
  if not (select public.v2_is_admin()) then
    raise exception 'Acesso administrativo necessário.' using errcode = '42501';
  end if;

  select * into character_row
  from public.v2_characters
  where id = p_character_id
  for update;

  if character_row.id is null then
    raise exception 'Personagem não encontrado.' using errcode = 'P0002';
  end if;

  -- Registros transitórios usam CASCADE. Os registros políticos abaixo ainda
  -- possuem FKs NO ACTION; ao apagar a ficha, eles também precisam ser limpos
  -- para a exclusão administrativa ser completa e previsível.
  delete from public.v2_crown_vote_ballots where character_id = p_character_id;
  delete from public.v2_crown_votes where initiated_by = p_character_id;
  delete from public.v2_kingdom_peace_proposals
    where proposed_by = p_character_id or responded_by = p_character_id;
  delete from public.v2_kingdom_resource_purchases where purchased_by = p_character_id;
  delete from public.v2_kingdom_wars
    where declared_by = p_character_id or responded_by = p_character_id;

  delete from public.v2_characters where id = p_character_id;

  insert into public.v2_admin_history(actor_id, action, target_type, target_id, details)
  values (
    auth.uid(),
    'character.deleted',
    'character',
    p_character_id::text,
    jsonb_build_object(
      'name', character_row.name,
      'user_id', character_row.user_id,
      'level', character_row.level,
      'rank', character_row.adventure_rank,
      'xp', character_row.xp,
      'gold', character_row.gold
    )
  );

  return jsonb_build_object(
    'deleted', true,
    'character_id', p_character_id,
    'name', character_row.name
  );
end;
$$;

revoke all on function public.v2_admin_delete_character(uuid) from public, anon;
grant execute on function public.v2_admin_delete_character(uuid) to authenticated;

commit;
