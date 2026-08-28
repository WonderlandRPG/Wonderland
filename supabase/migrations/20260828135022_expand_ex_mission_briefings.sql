update public.v2_missions
set description = description || ' A operação será dividida em investigação, preparação da rota, resgate de sobreviventes, confronto contra os responsáveis e estabilização definitiva da região. Decisões tomadas nas primeiras etapas poderão alterar os riscos e os objetivos das etapas seguintes.',
    updated_at = now()
where active
  and not is_rank_trial
  and rank = 'EX'
  and description not like '%A operação será dividida em investigação%';
