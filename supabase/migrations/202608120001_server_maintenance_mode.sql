insert into public.v2_game_settings (
  key,
  category,
  label,
  description,
  value,
  status,
  published_at
)
values (
  'system.server_online',
  'system',
  'Servidor disponível para jogadores',
  'Quando falso, somente administradores e fundadores podem autenticar e navegar no site.',
  'true'::jsonb,
  'published',
  now()
)
on conflict (key) do nothing;
