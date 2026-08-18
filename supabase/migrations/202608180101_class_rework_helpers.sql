create or replace function public._v2_rework_op(
  p_operation text,
  p_target text,
  p_damage_type text default 'none',
  p_scaling jsonb default '[]'::jsonb,
  p_status text default '',
  p_duration integer default 0,
  p_modifiers jsonb default '[]'::jsonb
) returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'operation', p_operation,
    'target', p_target,
    'base', 0,
    'scaling', p_scaling,
    'damageType', p_damage_type,
    'status', p_status,
    'duration', p_duration,
    'chance', 100,
    'stacks', 1,
    'maxStacks', 1,
    'distance', 0,
    'modifiers', p_modifiers
  );
$$;

create or replace function public._v2_rework_skill(
  p_name text,
  p_level integer,
  p_code text,
  p_description text,
  p_attr_one text,
  p_attr_two text,
  p_damage_type text,
  p_resource_max integer
) returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_key text := lower(regexp_replace(translate(p_name, 'ÁÀÃÂÉÊÍÓÔÕÚÇáàãâéêíóôõúç', 'AAAAEEIOOOUCaaaaeeiooouc'), '[^a-zA-Z0-9]+', '-', 'g'));
  v_area integer := coalesce(nullif(substring(p_code from 'A([234])'), '')::integer, 0);
  v_power numeric;
  v_cost integer;
  v_cooldown integer;
  v_buff integer;
  v_debuff integer;
  v_kind text := 'damage';
  v_category text := 'Ofensiva';
  v_target text := case when v_area > 0 then 'area' else 'enemy' end;
  v_dtype text := p_damage_type;
  v_scaling jsonb;
  v_operations jsonb;
  v_reach text;
  v_modifiers jsonb;
  v_control text;
begin
  v_power := case
    when p_level <= 1 then 1.05
    when p_level <= 8 then 1.20
    when p_level <= 16 then 1.35
    when p_level <= 24 then 1.50
    when p_level <= 32 then 1.70
    when p_level <= 40 then 1.90
    when p_level <= 48 then 2.25
    when p_level <= 50 then 1.50
    when p_level <= 60 then 1.70
    when p_level <= 70 then 1.90
    when p_level <= 85 then 2.10
    else 2.50
  end;

  if p_level >= 50 then
    v_cooldown := case when p_level <= 50 then 1 when p_level <= 70 then 2 when p_level <= 85 then 3 else 4 end;
    v_cost := case when p_resource_max <= 6 then case when p_level <= 60 then 1 when p_level <= 85 then 2 else 3 end
                   else case when p_level <= 50 then 10 when p_level <= 60 then 15 when p_level <= 70 then 20 when p_level <= 85 then 25 else 35 end end;
  else
    v_cooldown := case when p_level <= 1 then 0 when p_level <= 16 then 1 when p_level <= 32 then 2 when p_level <= 40 then 3 else 4 end;
    v_cost := case when p_resource_max <= 6 then case when p_level <= 1 then 0 when p_level <= 16 then 1 when p_level <= 40 then 2 else 3 end
                   else case when p_level <= 1 then 0 when p_level <= 8 then 10 when p_level <= 16 then 15 when p_level <= 24 then 20 when p_level <= 32 then 25 when p_level <= 40 then 30 else 40 end end;
  end if;

  v_buff := 10 + greatest(0, p_level / 12);
  v_debuff := -(8 + greatest(0, p_level / 15));
  v_scaling := jsonb_build_array(jsonb_build_object('attribute', p_attr_one, 'multiplier', v_power));

  if p_code in ('H','HA2','HA3','HA4') then
    v_kind := 'heal'; v_category := 'Suporte'; v_target := 'ally'; v_dtype := 'none';
    v_scaling := jsonb_build_array(jsonb_build_object('attribute','ARC','multiplier',round(v_power * 1.05, 2)));
    v_operations := jsonb_build_array(public._v2_rework_op('HEAL','ally','none',v_scaling));
  elsif p_code = 'S' then
    v_kind := 'shield'; v_category := 'Proteção'; v_target := 'ally'; v_dtype := 'none';
    v_scaling := jsonb_build_array(jsonb_build_object('attribute',case when p_attr_one in ('DEF','FOR') and p_attr_two='DEF' then 'DEF' else 'ARC' end,'multiplier',v_power));
    v_operations := jsonb_build_array(public._v2_rework_op('SHIELD','ally','none',v_scaling));
  elsif p_code = 'HS' then
    v_kind := 'heal'; v_category := 'Suporte'; v_target := 'ally'; v_dtype := 'none';
    v_scaling := jsonb_build_array(jsonb_build_object('attribute','ARC','multiplier',round(v_power * 1.10, 2)));
    v_operations := jsonb_build_array(
      public._v2_rework_op('HEAL','ally','none',v_scaling),
      public._v2_rework_op('SHIELD','ally','none',jsonb_build_array(jsonb_build_object('attribute','ARC','multiplier',round(v_power * 0.65, 2))))
    );
  elsif p_code = 'P' then
    v_kind := 'utility'; v_category := 'Purificação'; v_target := 'ally'; v_dtype := 'none'; v_scaling := '[]'::jsonb;
    v_operations := jsonb_build_array(
      public._v2_rework_op('REMOVE_STATUS','ally','none','[]'::jsonb,'negative'),
      public._v2_rework_op('HEAL','ally','none',jsonb_build_array(jsonb_build_object('attribute','ARC','multiplier',round(v_power * 0.65, 2))))
    );
  elsif p_code = 'B' or p_code like 'BA%' then
    v_kind := 'utility'; v_category := 'Fortalecimento'; v_target := 'ally'; v_dtype := 'none'; v_scaling := '[]'::jsonb;
    v_modifiers := jsonb_build_array(jsonb_build_object('attribute',p_attr_one,'value',v_buff),jsonb_build_object('attribute',p_attr_two,'value',greatest(6,v_buff-4)));
    v_operations := jsonb_build_array(public._v2_rework_op('BUFF','ally','none','[]'::jsonb,v_key,2,v_modifiers));
  elsif p_code = 'Bself' then
    v_kind := 'utility'; v_category := 'Postura'; v_target := 'self'; v_dtype := 'none'; v_scaling := '[]'::jsonb;
    v_modifiers := jsonb_build_array(jsonb_build_object('attribute',p_attr_one,'value',v_buff),jsonb_build_object('attribute',p_attr_two,'value',greatest(6,v_buff-4)));
    v_operations := jsonb_build_array(public._v2_rework_op('BUFF','self','none','[]'::jsonb,v_key,2,v_modifiers));
  elsif p_code = 'X' then
    v_kind := 'utility'; v_category := 'Controle'; v_target := 'enemy'; v_dtype := 'none'; v_scaling := '[]'::jsonb;
    v_modifiers := jsonb_build_array(jsonb_build_object('attribute',p_attr_one,'value',v_debuff),jsonb_build_object('attribute',p_attr_two,'value',least(-5,v_debuff+4)));
    v_operations := jsonb_build_array(public._v2_rework_op('DEBUFF','enemy','none','[]'::jsonb,v_key,2,v_modifiers));
  elsif p_code = 'Xtaunt' then
    v_kind := 'utility'; v_category := 'Controle'; v_target := 'enemy'; v_dtype := 'none'; v_scaling := '[]'::jsonb;
    v_operations := jsonb_build_array(public._v2_rework_op('TAUNT','enemy','none','[]'::jsonb,'provocado',2,jsonb_build_array(jsonb_build_object('attribute','INI','value',-8))));
  elsif p_code = 'C' then
    v_kind := 'utility'; v_category := 'Controle'; v_target := 'enemy'; v_dtype := 'none'; v_scaling := '[]'::jsonb;
    v_control := case when lower(p_name) like '%sil%' then 'SILENCE' else 'FEAR' end;
    v_operations := jsonb_build_array(public._v2_rework_op(v_control,'enemy','none','[]'::jsonb,v_key,1,jsonb_build_array(jsonb_build_object('attribute','INI','value',-10))));
  elsif p_code = 'U' then
    v_kind := 'utility'; v_category := 'Invocação'; v_target := 'self'; v_dtype := 'none'; v_scaling := '[]'::jsonb;
    v_operations := jsonb_build_array(public._v2_rework_op('SUMMON','self','none','[]'::jsonb,v_key,3,jsonb_build_array(jsonb_build_object('attribute','INT','value',v_buff),jsonb_build_object('attribute','DEF','value',greatest(5,v_buff-5)))));
  elsif p_code = 'T' then
    v_kind := 'damage'; v_category := 'Execução'; v_target := 'enemy'; v_dtype := 'true';
    v_scaling := jsonb_build_array(jsonb_build_object('attribute',p_attr_one,'multiplier',round(v_power * 0.90, 2)));
    v_operations := jsonb_build_array(public._v2_rework_op('DAMAGE','enemy','true',v_scaling));
  else
    if right(p_code,1)='T' then v_dtype := 'true'; end if;
    v_operations := jsonb_build_array(public._v2_rework_op('DAMAGE',case when v_area>0 then 'area' else 'enemy' end,v_dtype,v_scaling));
    if position('X' in p_code)>0 then
      v_operations := v_operations || jsonb_build_array(public._v2_rework_op('DEBUFF','enemy','none','[]'::jsonb,v_key||'-debuff',2,jsonb_build_array(jsonb_build_object('attribute','DEF','value',v_debuff),jsonb_build_object('attribute','RES','value',v_debuff))));
    end if;
    if position('C' in p_code)>0 or p_code='DC' then
      v_control := case when lower(p_name) like '%sil%' or lower(p_name) like '%conden%' then 'SILENCE' else 'FEAR' end;
      v_operations := v_operations || jsonb_build_array(public._v2_rework_op(v_control,'enemy','none','[]'::jsonb,v_key||'-controle',1,jsonb_build_array(jsonb_build_object('attribute','INI','value',-10))));
    end if;
    if position('H' in p_code)>0 then
      v_operations := v_operations || jsonb_build_array(public._v2_rework_op('HEAL','self','none',jsonb_build_array(jsonb_build_object('attribute','ARC','multiplier',round(v_power * 0.55, 2)))));
    end if;
  end if;

  if v_area > 0 and (p_code like 'HA%' or p_code like 'BA%') then v_target := 'ally'; end if;
  v_reach := case when v_target='self' then 'Próprio usuário' when v_area>0 and v_target='ally' then 'Até '||v_area||' aliados' when v_area>0 then 'Até '||v_area||' inimigos' when v_target='ally' then 'Aliado selecionado' else 'Inimigo selecionado' end;

  return jsonb_build_object(
    'key',trim(both '-' from v_key),'name',p_name,'level',p_level,'category',v_category,'type','Ativa','effect',p_description,
    'kind',v_kind,'damageType',v_dtype,'target',v_target,'resource','special','resourceKey','class','cost',v_cost,
    'cooldown',v_cooldown,'range',0,'area',v_area,'duration',case when v_kind='utility' then 2 else 0 end,
    'scaling',v_scaling,'reachText',v_reach,'conditions','[]'::jsonb,
    'systemRule','Consome o recurso de classe quando houver custo e executa as operações cadastradas na ordem.',
    'playerDescription',p_description,'chance',100,'maxStacks',1,'operations',v_operations
  );
end;
$$;

revoke all on function public._v2_rework_op(text,text,text,jsonb,text,integer,jsonb) from public, anon, authenticated;
revoke all on function public._v2_rework_skill(text,integer,text,text,text,text,text,integer) from public, anon, authenticated;
