-- Funções usadas exclusivamente por gatilhos não devem ser chamadas pela API.
revoke execute on function public.v2_create_pvp_match_room() from public, anon, authenticated;
revoke execute on function public.v2_record_pvp_result() from public, anon, authenticated;
revoke execute on function public.v2_block_combat_during_mission() from public, anon, authenticated;
