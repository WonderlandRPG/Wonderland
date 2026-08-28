update public.v2_content
set payload = jsonb_set(
      payload,
      '{resource}',
      (payload -> 'resource')
        || jsonb_build_object(
          'generationRules', case slug
            when 'alquimista' then jsonb_build_array('Ganha 5 Catalisadores ao usar uma categoria de operação diferente da ação anterior, limitado a 10 por rodada.')
            else jsonb_build_array('Ganha 5 Almas quando uma invocação expira ou uma unidade perde ao menos 20% do HP máximo em uma ação.')
          end,
          'generationEvents', jsonb_build_array(jsonb_build_object('amount', 5, 'trigger', 'BASIC_ATTACK_HIT', 'limitPerAction', 1))
        )
    ),
    updated_at = now()
where content_type = 'class' and slug in ('alquimista', 'necromante');
