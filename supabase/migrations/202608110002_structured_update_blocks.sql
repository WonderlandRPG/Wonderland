begin;

-- Converte as notas antigas em blocos tipados. O campo continua jsonb e não exige
-- alteração destrutiva no esquema nem invalida publicações já existentes.
update public.v2_updates updates
set notes = coalesce((
  select jsonb_agg(
    case
      when jsonb_typeof(note) = 'string' then jsonb_build_object(
        'id', 'legacy-' || ordinality::text,
        'type', 'paragraph',
        'content', regexp_replace(
          regexp_replace(trim(both '"' from note::text), '^#{1,6}[[:space:]]*', ''),
          '\*\*([^*]+)\*\*', '\1', 'g'
        )
      )
      else note
    end
    order by ordinality
  )
  from jsonb_array_elements(updates.notes) with ordinality as entries(note, ordinality)
), '[]'::jsonb)
where exists (
  select 1 from jsonb_array_elements(updates.notes) as entries(note)
  where jsonb_typeof(note) = 'string'
);

comment on column public.v2_updates.notes is
  'Blocos estruturados: heading, subheading, paragraph, highlight, list ou stat.';

commit;
