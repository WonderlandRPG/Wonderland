-- Corrige habilidades cujo texto prometia deslocamento sem operação executável.
with fixed as (
  select id,jsonb_set(payload,'{progression}',(select jsonb_agg(case when skill->>'key'='investida' then jsonb_set(skill,'{operations}',jsonb_build_array(jsonb_build_object('operation','MOVE','target','self','base',0,'scaling','[]'::jsonb,'damageType','none','status','','duration',0,'chance',100,'stacks',0,'maxStacks',0,'distance',3,'modifiers','[]'::jsonb))||(skill->'operations')) else skill end order by ord) from jsonb_array_elements(payload->'progression') with ordinality p(skill,ord))) payload
  from public.v2_content where content_type='class' and name='Guerreiro'
) update public.v2_content c set payload=f.payload,revision=revision+1,updated_at=now() from fixed f where c.id=f.id and not exists(select 1 from jsonb_array_elements(c.payload->'progression') s,jsonb_array_elements(s->'operations') o where s->>'key'='investida' and o->>'operation'='MOVE');

with fixed as (
  select id,jsonb_set(payload,'{progression}',(select jsonb_agg(case when skill->>'key'='salto-imprevisivel' then jsonb_set(skill,'{operations}',(select jsonb_agg(case when op->>'operation'='TELEPORT' then jsonb_set(op,'{distance}','4'::jsonb) else op end order by ord2) from jsonb_array_elements(skill->'operations') with ordinality o(op,ord2))) else skill end order by ord) from jsonb_array_elements(payload->'progression') with ordinality p(skill,ord))) payload
  from public.v2_content where content_type='class' and name='Feiticeiro'
) update public.v2_content c set payload=f.payload,revision=revision+1,updated_at=now() from fixed f where c.id=f.id;
