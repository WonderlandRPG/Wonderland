delete from public.v2_game_settings where key='character.rework_distributable_stars' and category='rework_attributes';
alter table public.v2_characters drop constraint if exists v2_characters_growth_profile_check;
alter table public.v2_characters drop column if exists growth_profile;
alter table public.v2_characters drop column if exists rework_attributes;
