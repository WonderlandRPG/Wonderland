begin;
drop function if exists public.v2_finish_pve_defeat(uuid);
drop function if exists public.v2_save_pve_battle_state(uuid,jsonb);
drop index if exists public.v2_arena_sessions_open_pve_character_idx;
alter table public.v2_arena_sessions drop column if exists updated_at, drop column if exists battle_state,
  drop column if exists map_id, drop column if exists creature_id;
commit;
