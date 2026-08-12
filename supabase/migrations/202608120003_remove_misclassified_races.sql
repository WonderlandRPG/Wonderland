-- Alquimista, Ninja e Necromante pertencem ao catálogo de classes.
-- A exclusão é protegida para nunca remover fichas que porventura referenciem
-- um registro antigo. As definições corretas vivem no catálogo oficial de classes.
delete from public.v2_content content
where content.content_type = 'race'
  and content.slug in ('alquimista', 'ninja', 'necromante')
  and not exists (
    select 1
    from public.v2_characters character
    where character.race_id = content.id
  );
