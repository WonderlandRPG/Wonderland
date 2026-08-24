begin;

-- Segunda coleção de builds: 12 conjuntos completos e 132 equipamentos únicos.
-- Cada conjunto contém os 11 espaços, incluindo colar, anel, brinco e capa.
do $$
declare
  build record;
  slot_row record;
  tier_power integer;
  primary_power integer;
  secondary_power integer;
  item_attributes jsonb;
  item_effects jsonb;
  item_name text;
  item_description text;
  item_price bigint;
  item_order integer;
begin
  select coalesce(max(sort_order), 0) into item_order from public.v2_shop_items;

  for build in
    select * from (values
      ('common','guardiao-cinzas','Guardião das Cinzas','Defensor Resiliente',array['Cavaleiro','Paladino','Guerreiro'], 'DEF','RES','bastion',
        array['Coroa da Brasa Morta','Peitoral do Último Carvão','Punhos do Forno Silente','Grevas do Caminho Cinzento','Botas da Vigília Fumegante','Espada do Fogo Extinto','Broquel da Cinza Fiel','Medalhão da Fogueira Antiga','Anel do Sentinela Cinzento','Brinco da Faísca Guardada','Capa do Guardião Sem Chamas']),
      ('common','veu-novico','Véu do Noviço','Curador Iniciante',array['Clérigo','Bardo','Druida'], 'ARC','INT','support',
        array['Capuz da Prece Serena','Vestes do Primeiro Hino','Luvas do Toque Gentil','Calças do Peregrino Azul','Sandálias da Fonte Clara','Cajado da Luz Menor','Livro das Orações Simples','Pingente da Gota Sagrada','Aliança do Primeiro Voto','Brinco da Voz Suave','Véu da Manhã Serena']),
      ('uncommon','presas-lua','Presas da Lua','Caçador Noturno',array['Bárbaro','Ladino','Assassino','Monge'], 'FOR','INI','predator',
        array['Máscara do Alfa Jovem','Arnês da Caçada Lunar','Garras da Lua Crescente','Perneiras do Rastro Prateado','Botas do Uivo Distante','Presa da Noite Jovem','Garra da Alcateia','Colar do Osso Lunar','Anel da Caçada Sem Fim','Brinco do Faro Aguçado','Pele da Lua Nascente']),
      ('uncommon','laboratorio-voltaico','Laboratório Voltaico','Artilheiro Arcano',array['Alquimista','Mago','Feiticeiro'], 'INT','ARC','caster',
        array['Óculos do Arco Elétrico','Jaleco das Bobinas Vivas','Luvas do Reagente Azul','Calças do Condutor Rúnico','Botas de Isolamento Místico','Bastão do Primeiro Trovão','Catalisador de Cobre Vivo','Ampola da Tempestade Engarrafada','Anel da Faísca Calculada','Brinco do Pulso Voltaico','Manto do Campo Magnético']),
      ('rare','juramento-mare','Juramento da Maré','Guardião Restaurador',array['Clérigo','Druida','Paladino','Bardo'], 'RES','ARC','support',
        array['Diadema da Maré Mansa','Cota do Recife Protetor','Manoplas da Água Curativa','Grevas da Corrente Serena','Passos da Praia Sem Pegadas','Tridente do Juramento Azul','Concha do Santuário Submerso','Colar da Pérola Compassiva','Anel da Onda Retornante','Brinco do Canto da Baleia','Capa da Espuma Eterna']),
      ('rare','danca-laminas','Dança das Lâminas','Duelista Veloz',array['Ladino','Ninja','Assassino','Monge'], 'INI','FOR','duelist',
        array['Faixa do Primeiro Corte','Colete do Giro Impossível','Luvas das Cem Estocadas','Calças do Passo Cruzado','Sapatilhas do Duelo Breve','Lâmina do Compasso Carmesim','Adaga do Contratempo','Gargantilha do Ritmo Fatal','Anel da Guarda Aberta','Brinco do Aço Sussurrante','Capa do Último Movimento']),
      ('epic','trono-espinhos','Trono de Espinhos','Invocador de Desgaste',array['Druida','Necromante','Bruxo'], 'ARC','RES','poison',
        array['Coroa do Rei Enraizado','Carapaça do Jardim Voraz','Garras da Hera Faminta','Grevas das Raízes Profundas','Passos do Bosque Proibido','Cetro da Rosa Carnívora','Ídolo do Espinho Ancestral','Colar das Sementes Negras','Anel da Flor Cadavérica','Brinco da Seiva Venenosa','Manto da Primavera Cruel']),
      ('epic','muralha-abismo','Muralha do Abismo','Tanque Antimagia',array['Cavaleiro','Paladino','Necromante','Guerreiro'], 'RES','DEF','bastion',
        array['Elmo do Horizonte Vazio','Armadura da Fenda Imóvel','Manoplas do Peso Infinito','Grevas do Fosso Sem Fundo','Botas do Limite Escuro','Martelo da Fronteira Abissal','Escudo da Boca do Vazio','Amuleto da Pedra Nula','Anel do Silêncio Profundo','Brinco do Eco Devorado','Capa do Abismo Contido']),
      ('legendary','peste-rubra','Peste Rubra','Carrasco Venenoso',array['Alquimista','Necromante','Bruxo'], 'INT','RES','poison',
        array['Máscara do Médico Rubro','Casaco da Quarentena Eterna','Luvas do Contágio Perfeito','Calças do Vetor Carmesim','Botas da Cidade Selada','Báculo da Febre Soberana','Frasco da Última Cura','Rosário dos Treze Sintomas','Anel da Carne Febril','Brinco do Sopro Infecto','Manto da Névoa Escarlate']),
      ('legendary','lua-sangrenta','Lua Sangrenta','Predador de Sangramento',array['Assassino','Bárbaro','Ninja','Guerreiro'], 'FOR','INI','bleed',
        array['Elmo do Eclipse Feral','Couraça da Caçada Carmesim','Garras do Uivo Sangrento','Grevas do Predador Lunar','Passos da Presa Marcada','Foice da Lua Sangrenta','Presa da Meia-Noite','Colar do Coração Caçado','Anel do Alfa Escarlate','Brinco do Uivo Sem Lua','Capa da Alcateia Vermelha']),
      ('mythic','tempestade-astral','Tempestade Astral','Mago Explosivo e Controle',array['Mago','Feiticeiro','Alquimista'], 'INT','INI','freeze',
        array['Coroa do Olho da Tempestade','Manto-Túnica do Firmamento Partido','Luvas dos Mil Relâmpagos','Grevas da Órbita Celeste','Passos do Cometa Azul','Cetro do Trovão Astral','Orbe do Inverno Cósmico','Colar da Supernova Cativa','Anel do Céu Estilhaçado','Brinco da Estrela Polar','Capa da Galáxia Tormentosa']),
      ('mythic','hino-aurora','Hino da Aurora','Suporte Supremo',array['Clérigo','Bardo','Druida','Paladino'], 'ARC','RES','support',
        array['Aurora dos Sete Cânticos','Vestes do Amanhecer Imortal','Mãos da Graça Infinita','Grevas da Procissão Dourada','Passos da Primeira Luz','Cajado do Sol Compassivo','Partitura da Criação','Colar da Alma Radiante','Anel da Promessa Eterna','Brinco da Voz Celestial','Capa do Horizonte Dourado'])
    ) as builds(rarity,build_key,build_name,archetype,classes,primary_stat,secondary_stat,effect_style,item_names)
  loop
    tier_power := case build.rarity
      when 'common' then 6 when 'uncommon' then 10 when 'rare' then 15
      when 'epic' then 22 when 'legendary' then 30 else 40 end;

    for slot_row in
      select * from (values
        ('head',1,1.00,0.65),('torso',2,1.35,0.65),('hands',3,0.85,0.65),
        ('legs',4,1.05,0.65),('feet',5,0.80,0.65),('main_weapon',6,1.50,0.70),
        ('off_weapon',7,1.05,0.60),('necklace',8,0.85,0.55),('ring',9,0.80,0.70),
        ('earring',10,0.75,0.45),('cape',11,1.00,0.60)
      ) as slots(slot,name_index,multiplier,primary_ratio)
    loop
      item_order := item_order + 1;
      primary_power := greatest(1, round(tier_power * slot_row.multiplier * slot_row.primary_ratio));
      secondary_power := greatest(1, round(tier_power * slot_row.multiplier) - primary_power);
      item_attributes := jsonb_build_object(build.primary_stat, primary_power, build.secondary_stat, secondary_power);
      item_name := build.item_names[slot_row.name_index];
      item_description := format(
        '%s integra a build %s (%s). Prioriza %s e %s; ideal para %s.',
        item_name, build.build_name, build.archetype, build.primary_stat, build.secondary_stat,
        array_to_string(build.classes, ', ')
      );
      item_price := round((case build.rarity
        when 'common' then 120 when 'uncommon' then 320 when 'rare' then 850
        when 'epic' then 2200 when 'legendary' then 6000 else 15000 end) * slot_row.multiplier);

      item_effects := '[]'::jsonb;
      if build.rarity in ('legendary','mythic') then
        item_effects := jsonb_build_array(jsonb_build_object(
          'key', build.build_key || '-' || slot_row.slot,
          'name', build.build_name || ': ' || item_name,
          'description', case
            when build.effect_style = 'poison' and slot_row.slot = 'main_weapon' then 'Aplica veneno por 3 rodadas sempre que causa dano.'
            when build.effect_style = 'bleed' and slot_row.slot = 'main_weapon' then 'Aplica sangramento por 3 rodadas sempre que causa dano.'
            when build.effect_style = 'freeze' and slot_row.slot = 'main_weapon' then 'Congela o fluxo do alvo e reduz sua INI por 2 rodadas.'
            when slot_row.slot = 'off_weapon' then 'Reduz a recarga das habilidades usadas.'
            when slot_row.slot = 'torso' then 'Concede um escudo no início da batalha.'
            when slot_row.slot = 'necklace' and build.effect_style = 'support' then 'Restaura Mana no início da batalha.'
            when slot_row.slot = 'ring' and build.effect_style = 'support' then 'Concede recurso de classe no início da batalha.'
            when slot_row.slot = 'earring' and build.effect_style = 'support' then 'Concede recurso racial no início da batalha.'
            when slot_row.slot = 'cape' then 'Aumenta a vida máxima no início da batalha.'
            else 'Reforça os atributos centrais da build no início da batalha.' end,
          'kind', case
            when build.effect_style = 'poison' and slot_row.slot = 'main_weapon' then 'POISON'
            when build.effect_style = 'bleed' and slot_row.slot = 'main_weapon' then 'BLEED'
            when build.effect_style = 'freeze' and slot_row.slot = 'main_weapon' then 'FREEZE'
            when slot_row.slot = 'off_weapon' then 'COOLDOWN_REDUCTION'
            else 'BATTLE_START' end,
          'trigger', case
            when slot_row.slot = 'main_weapon' and build.effect_style in ('poison','bleed','freeze') then 'ON_DAMAGE_DEALT'
            when slot_row.slot = 'off_weapon' then 'ON_SKILL_USE'
            else 'BATTLE_START' end,
          'duration', case when slot_row.slot = 'main_weapon' and build.effect_style in ('poison','bleed') then 3 when build.effect_style = 'freeze' and slot_row.slot = 'main_weapon' then 2 else 0 end,
          'power', case
            when build.effect_style = 'poison' and slot_row.slot = 'main_weapon' then case when build.rarity = 'mythic' then 12 else 8 end
            when build.effect_style = 'bleed' and slot_row.slot = 'main_weapon' then case when build.rarity = 'mythic' then 14 else 10 end
            when build.effect_style = 'freeze' and slot_row.slot = 'main_weapon' then 8
            when slot_row.slot = 'off_weapon' then case when build.rarity = 'mythic' then 2 else 1 end
            else 0 end,
          'modifiers', case when slot_row.slot not in ('main_weapon','off_weapon','torso','necklace','ring','earring','cape')
            then jsonb_build_object(build.primary_stat, case when build.rarity = 'mythic' then 3 else 2 end) else '{}'::jsonb end,
          'shield', case when slot_row.slot = 'torso' then case when build.rarity = 'mythic' then 70 else 40 end else 0 end,
          'maxHpPercent', case when slot_row.slot = 'cape' then case when build.rarity = 'mythic' then 4 else 2 end else 0 end,
          'mana', case when build.effect_style = 'support' and slot_row.slot = 'necklace' then case when build.rarity = 'mythic' then 35 else 20 end else 0 end,
          'classResource', case when build.effect_style = 'support' and slot_row.slot = 'ring' then case when build.rarity = 'mythic' then 15 else 8 end else 0 end,
          'raceResource', case when build.effect_style = 'support' and slot_row.slot = 'earring' then case when build.rarity = 'mythic' then 15 else 8 end else 0 end
        ));
      end if;

      insert into public.v2_shop_items(
        slug,name,description,category,price,slot,rarity,attributes,two_handed,
        sort_order,special_effects,active,build_key,build_name,recommended_classes
      ) values (
        build.build_key || '-' || replace(slot_row.slot, '_', '-'),
        item_name,item_description,build.archetype,item_price,slot_row.slot,build.rarity,
        item_attributes,false,item_order,item_effects,true,build.build_key,build.build_name,build.classes
      ) on conflict do nothing;
    end loop;
  end loop;
end;
$$;

commit;
