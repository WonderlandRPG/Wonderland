-- Rollback específico da fundação do Rework.
-- A dupla condição impede a remoção de configurações preexistentes com outro propósito.
delete from public.v2_game_settings
where category = 'rework_rollout'
  and key in (
    'rollout.rework.classes_races_v2',
    'rollout.rework.attributes_power_v2',
    'rollout.rework.talents_v2',
    'rollout.rework.inventory_equipment_v2',
    'rollout.rework.tactical_pve_v2',
    'rollout.rework.tactical_pvp_v2',
    'rollout.rework.ranked_v2'
  );

