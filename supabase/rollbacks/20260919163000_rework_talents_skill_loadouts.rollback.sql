delete from public.v2_game_settings
where key in ('combat.loadout_limits', 'combat.skill_balance_overrides');

drop table if exists public.v2_character_skill_loadouts;
drop function if exists public.v2_touch_skill_loadout();
