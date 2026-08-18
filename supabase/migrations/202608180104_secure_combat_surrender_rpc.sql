revoke execute on function public.v2_combat_surrender_status(text,uuid) from public, anon;
revoke execute on function public.v2_request_combat_surrender(text,uuid) from public, anon;

grant execute on function public.v2_combat_surrender_status(text,uuid) to authenticated;
grant execute on function public.v2_request_combat_surrender(text,uuid) to authenticated;
