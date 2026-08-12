update public.v2_content
set payload = jsonb_set(
      payload,
      '{imageUrl}',
      to_jsonb('/images/classes/' || slug || '.webp'::text),
      true
    ),
    updated_at = now()
where content_type = 'class'
  and slug = any(array[
    'barbaro', 'guerreiro', 'paladino', 'cavaleiro', 'arqueiro',
    'assassino', 'ladino', 'monge', 'mago', 'feiticeiro', 'bruxo',
    'clerigo', 'druida', 'bardo', 'alquimista', 'ninja', 'necromante'
  ]);
