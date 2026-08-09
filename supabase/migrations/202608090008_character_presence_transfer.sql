alter table public.v2_characters disable trigger v2_characters_guard;

update public.v2_characters character
set daily_streak=progress.daily_streak,
    last_daily_claim=progress.last_daily_claim,
    updated_at=now()
from public.v2_active_characters active
join public.v2_player_progress progress on progress.user_id=active.user_id
where character.id=active.character_id
  and character.daily_streak=0
  and character.last_daily_claim is null;

alter table public.v2_characters enable trigger v2_characters_guard;
