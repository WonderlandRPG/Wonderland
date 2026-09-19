-- Fundação reversível para receber os módulos do Rework no site oficial.
-- Esta migração não lê, cria, copia ou altera contas, sessões ou personagens.
insert into public.v2_game_settings (
  key,
  category,
  label,
  description,
  value,
  status,
  published_at
)
values
  ('rollout.rework.classes_races_v2', 'rework_rollout', 'Classes e raças', 'Libera o catálogo de classes e raças do Rework.', 'false'::jsonb, 'published', now()),
  ('rollout.rework.attributes_power_v2', 'rework_rollout', 'Atributos e poder total', 'Libera os cálculos de atributos e poder total do Rework.', 'false'::jsonb, 'published', now()),
  ('rollout.rework.talents_v2', 'rework_rollout', 'Habilidades e talentos', 'Libera habilidades, talentos e loadouts do Rework.', 'false'::jsonb, 'published', now()),
  ('rollout.rework.inventory_equipment_v2', 'rework_rollout', 'Itens, equipamentos e inventário', 'Libera inventário, equipamentos e bônus do Rework.', 'false'::jsonb, 'published', now()),
  ('rollout.rework.tactical_pve_v2', 'rework_rollout', 'Mapa tático PvE', 'Libera o mapa tático para PvE.', 'false'::jsonb, 'published', now()),
  ('rollout.rework.tactical_pvp_v2', 'rework_rollout', 'Mapa tático PvP', 'Libera o mapa tático para PvP.', 'false'::jsonb, 'published', now()),
  ('rollout.rework.ranked_v2', 'rework_rollout', 'Ranqueada 2x2', 'Libera MD5, elo, PdL e pareamento ranqueado 2x2.', 'false'::jsonb, 'published', now())
on conflict (key) do nothing;

