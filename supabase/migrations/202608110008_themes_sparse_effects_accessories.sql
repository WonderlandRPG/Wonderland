-- Temas administráveis, efeitos especiais raros e catálogo de acessórios.
begin;

insert into public.v2_game_settings(
  key,category,label,description,value,status,published_at
) values (
  'appearance.available_themes','appearance','Temas disponíveis',
  'Define quais temas podem ser escolhidos pelos jogadores.',
  '{"classic":true,"accessible":true,"christmas":false}'::jsonb,'published',now()
)
on conflict(key) do nothing;

-- Vinte acessórios em cada uma das seis raridades (120 itens ao todo).
do $$
declare
  tier text;
  tier_label text;
  tier_index integer;
  item_index integer;
  accessory_slot text;
  base_name text;
  suffix text;
  stat_value integer;
  item_price integer;
begin
  foreach tier in array array['common','uncommon','rare','epic','legendary','mythic'] loop
    tier_index := array_position(array['common','uncommon','rare','epic','legendary','mythic'],tier);
    tier_label := (array['Comum','Incomum','Raro','Épico','Lendário','Mítico'])[tier_index];
    suffix := (array['Simples','Reforçado','Rúnico','Magistral','Ancestral','Primordial'])[tier_index];
    stat_value := (array[2,4,7,11,16,23])[tier_index];
    item_price := (array[80,180,420,950,2400,6000])[tier_index];
    for item_index in 1..20 loop
      accessory_slot := case
        when item_index <= 5 then 'necklace'
        when item_index <= 10 then 'ring'
        when item_index <= 15 then 'earring'
        else 'cape'
      end;
      base_name := case accessory_slot
        when 'necklace' then (array['Colar de Cristal Lapidado','Colar do Viajante','Colar de Correntes Finas','Colar de Mana Serenada','Colar do Guardião'])[item_index]
        when 'ring' then (array['Anel de Aço Polido','Anel de Runas Precisas','Anel do Duelista','Anel da Reserva Arcana','Anel da Muralha'])[item_index-5]
        when 'earring' then (array['Brinco de Gota Lunar','Brinco de Quartzo Azul','Brinco do Passo Veloz','Brinco da Mente Clara','Brinco da Harmonia'])[item_index-10]
        else (array['Capa de Linho Encantado','Capa do Batedor','Capa de Escamas Leves','Capa do Conjurador','Capa da Guarda Real'])[item_index-15]
      end;
      insert into public.v2_shop_items(
        slug,name,description,category,price,slot,rarity,attributes,two_handed,sort_order,special_effects,active
      ) values (
        format('acessorio-%s-%s',tier,lpad(item_index::text,2,'0')),
        format('%s %s',base_name,suffix),
        format('%s de qualidade %s, criado para ocupar os espaços de acessórios do aventureiro.',base_name,tier_label),
        case accessory_slot when 'necklace' then 'Colar' when 'ring' then 'Anel' when 'earring' then 'Brinco' else 'Capa' end,
        item_price,accessory_slot,tier,
        case mod(item_index-1,6)
          when 0 then jsonb_build_object('FOR',stat_value)
          when 1 then jsonb_build_object('DEF',stat_value)
          when 2 then jsonb_build_object('RES',stat_value)
          when 3 then jsonb_build_object('INI',stat_value)
          when 4 then jsonb_build_object('INT',stat_value)
          else jsonb_build_object('ARC',stat_value)
        end,
        false,200000+tier_index*100+item_index,'[]'::jsonb,true
      ) on conflict(slug) do update set
        name=excluded.name,description=excluded.description,category=excluded.category,
        price=excluded.price,slot=excluded.slot,rarity=excluded.rarity,
        attributes=excluded.attributes,two_handed=false,sort_order=excluded.sort_order,
        active=true,updated_at=now();
    end loop;
  end loop;
end $$;

-- Primeiro, todos os equipamentos voltam a não ter efeito. Depois uma amostra
-- estável, pequena e aparentemente aleatória é escolhida em cada raridade.
update public.v2_shop_items
set special_effects='[]'::jsonb,
    name=regexp_replace(name,' (do Veneno Persistente|da Ferida Profunda|da Sede Vital|do Fluxo Acelerado|do Gelo Eterno|da Praga Alquímica|da Hemorragia Implacável|do Banquete Carmesim|do Tempo Fraturado|do Inverno Absoluto)$',''),
    updated_at=now()
where rarity in ('legendary','mythic') and slot<>'title';

with ranked as (
  select id,slug,rarity,
    mod(abs(hashtext(slug || ':wonderland:sparse-effects')),5) family,
    row_number() over(partition by rarity order by md5(slug || ':wonderland:effect-lottery')) position,
    count(*) over(partition by rarity) total
  from public.v2_shop_items
  where rarity in ('legendary','mythic') and slot<>'title'
), chosen as (
  select *, rarity='mythic' is_mythic
  from ranked
  where position <= greatest(1,ceil(total * case when rarity='legendary' then .12 else .08 end))
), effects as (
  select id,family,is_mythic,
    case family
      when 0 then case when is_mythic then ' da Praga Alquímica' else ' do Veneno Persistente' end
      when 1 then case when is_mythic then ' da Hemorragia Implacável' else ' da Ferida Profunda' end
      when 2 then case when is_mythic then ' do Banquete Carmesim' else ' da Sede Vital' end
      when 3 then case when is_mythic then ' do Tempo Fraturado' else ' do Fluxo Acelerado' end
      else case when is_mythic then ' do Inverno Absoluto' else ' do Gelo Eterno' end
    end name_suffix,
    jsonb_build_array(jsonb_build_object(
      'key',slug||'-rare-effect',
      'kind',(array['POISON','BLEED','LIFE_STEAL','COOLDOWN_REDUCTION','FREEZE'])[family+1],
      'trigger',case when family=3 then 'ON_SKILL_USE' else 'ON_DAMAGE_DEALT' end,
      'name',case family
        when 0 then case when is_mythic then 'Praga Alquímica' else 'Veneno Persistente' end
        when 1 then case when is_mythic then 'Hemorragia Implacável' else 'Ferida Profunda' end
        when 2 then case when is_mythic then 'Banquete Carmesim' else 'Sede Vital' end
        when 3 then case when is_mythic then 'Tempo Fraturado' else 'Fluxo Acelerado' end
        else case when is_mythic then 'Inverno Absoluto' else 'Gelo Eterno' end end,
      'description',case family
        when 0 then format('Ataques aplicam Envenenamento por %s rodadas.',case when is_mythic then 4 else 3 end)
        when 1 then format('Ataques aplicam Sangramento por %s rodadas.',case when is_mythic then 3 else 2 end)
        when 2 then format('Recupera %s%% do dano causado como HP.',case when is_mythic then 22 else 10 end)
        when 3 then format('Reduz em %s a recarga da habilidade usada.',case when is_mythic then 2 else 1 end)
        else format('Ataques reduzem a INI do alvo em %s.',case when is_mythic then 24 else 12 end) end,
      'duration',case when family in (0,1,4) then case when is_mythic then 3 else 2 end else 0 end,
      'power',case family when 0 then case when is_mythic then 16 else 8 end when 1 then case when is_mythic then 20 else 10 end when 2 then case when is_mythic then 22 else 10 end when 3 then case when is_mythic then 2 else 1 end else case when is_mythic then 24 else 12 end end,
      'modifiers','{}'::jsonb,'shield',0,'maxHpPercent',0,'mana',0,'classResource',0,'raceResource',0
    )) special_effects
  from chosen
)
update public.v2_shop_items item
set special_effects=effects.special_effects,name=item.name||effects.name_suffix,updated_at=now()
from effects where item.id=effects.id;

commit;
