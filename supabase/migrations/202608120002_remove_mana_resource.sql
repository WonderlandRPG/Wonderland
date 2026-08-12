update public.v2_content
set payload = jsonb_set(
  jsonb_set(payload, '{baseMana}', '0'::jsonb, true),
  '{abilitiesV2}',
  coalesce((select jsonb_agg(case when ability->>'resource' = 'mana' then jsonb_set(jsonb_set(ability, '{resource}', '"special"'), '{resourceKey}', '"race"') else ability end) from jsonb_array_elements(coalesce(payload->'abilitiesV2','[]'::jsonb)) ability), '[]'::jsonb),
  true
)
where content_type = 'race';

update public.v2_content
set payload = jsonb_set(
  jsonb_set(
    payload,
    '{progression}',
    coalesce((select jsonb_agg(case when skill->>'resource' = 'mana' then jsonb_set(jsonb_set(skill, '{resource}', '"special"'), '{resourceKey}', '"class"') else skill end) from jsonb_array_elements(coalesce(payload->'progression','[]'::jsonb)) skill), '[]'::jsonb),
    true
  ),
  '{paths}',
  coalesce((select jsonb_agg(jsonb_set(path, '{skills}', coalesce((select jsonb_agg(case when skill->>'resource' = 'mana' then jsonb_set(jsonb_set(skill, '{resource}', '"special"'), '{resourceKey}', '"class"') else skill end) from jsonb_array_elements(coalesce(path->'skills','[]'::jsonb)) skill), '[]'::jsonb), true)) from jsonb_array_elements(coalesce(payload->'paths','[]'::jsonb)) path), '[]'::jsonb),
  true
)
where content_type = 'class';
