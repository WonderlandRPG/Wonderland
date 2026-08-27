begin;

-- O pulso de presença é uma operação autenticada e não pode falhar por grants antigos.
revoke all on function public.v2_touch_player_presence() from public, anon;
grant execute on function public.v2_touch_player_presence() to authenticated;

-- Garante que registros antigos continuem vinculados ao proprietário para leitura via RLS.
update public.v2_event_registrations registration
set user_id = character.user_id
from public.v2_characters character
where registration.character_id = character.id
  and registration.user_id is distinct from character.user_id;

commit;
