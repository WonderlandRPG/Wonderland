begin;

-- Os perfis locais começam com artigo ("a guardiã", "o mineiro"). Corrige as
-- contrações produzidas ao encaixá-los depois da preposição "de" e fecha as
-- orações explicativas antes de continuar a frase.
update public.v2_missions
set
  description = replace(
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(
                  replace(
                    replace(
                      replace(
                        replace(
                          replace(
                            replace(description,
                              'A pedido de a ', 'A pedido da '),
                            'A pedido de o ', 'A pedido do '),
                          'com o relato de a ', 'com o relato da '),
                        'com o relato de o ', 'com o relato do '),
                      'A Guilda recebeu o alerta de a ', 'A Guilda recebeu o alerta da '),
                    'A Guilda recebeu o alerta de o ', 'A Guilda recebeu o alerta do '),
                  'Sob os cuidados de a ', 'Sob os cuidados da '),
                'Sob os cuidados de o ', 'Sob os cuidados do '),
              'após um relato de a ', 'após um relato da '),
            'após um relato de o ', 'após um relato do '),
          'começa com o relato de a ', 'começa com o relato da '),
        'começa com o relato de o ', 'começa com o relato do '),
      'junto de a ', 'junto da '),
    'junto de o ', 'junto do '),
  updated_at = now()
where is_rank_trial = false
  and created_by is null
  and slug ~ '^(aokigahara|darkya|oymyakon|lesedi|namida|skypiece)-(e|d|c|b)-[0-9]{2}-[0-9]{2}$';

-- Fecha as explicações do personagem local nas três construções em que a
-- oração continuava imediatamente após o nome.
update public.v2_missions
set
  description = replace(description, ' e proteger ', ', e proteger '),
  updated_at = now()
where created_by is null
  and slug ~ '^(aokigahara|darkya|oymyakon|lesedi|namida|skypiece)-(e|d|c|b)-02-[0-9]{2}$';

update public.v2_missions
set
  description = replace(description, ' através de ', ', através de '),
  updated_at = now()
where created_by is null
  and slug ~ '^(aokigahara|darkya|oymyakon|lesedi|namida|skypiece)-(e|d|c|b)-04-[0-9]{2}$';

update public.v2_missions
set
  description = replace(description, ' está ', ', está '),
  updated_at = now()
where created_by is null
  and slug ~ '^(aokigahara|darkya|oymyakon|lesedi|namida|skypiece)-(e|d|c|b)-07-[0-9]{2}$';

do $$
begin
  if exists (
    select 1
    from public.v2_missions
    where is_rank_trial = false
      and created_by is null
      and slug ~ '^(aokigahara|darkya|oymyakon|lesedi|namida|skypiece)-(e|d|c|b)-[0-9]{2}-[0-9]{2}$'
      and description ~* '\mde (a|o)\M'
  ) then
    raise exception 'Ainda existem contrações nominais incorretas nas missões geradas';
  end if;
end;
$$;

commit;
