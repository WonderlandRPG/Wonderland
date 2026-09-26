-- A apuração de PdL é exclusiva do trigger de término da partida.
revoke all on function public.v2_process_ranked_result() from public,anon,authenticated;
