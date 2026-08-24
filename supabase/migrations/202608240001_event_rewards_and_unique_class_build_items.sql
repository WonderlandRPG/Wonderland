begin;

-- Recompensas ilimitadas por evento e registro idempotente por personagem.
create table if not exists public.v2_event_rewards (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.v2_events(id) on delete cascade,
  reward_type text not null check (reward_type in ('gold','xp','item','title')),
  amount integer not null check (amount between 1 and 999999999),
  item_id uuid references public.v2_shop_items(id) on delete restrict,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  check (
    (reward_type in ('item','title') and item_id is not null)
    or (reward_type in ('gold','xp') and item_id is null)
  )
);

create table if not exists public.v2_event_registrations (
  event_id uuid not null references public.v2_events(id) on delete cascade,
  character_id uuid not null references public.v2_characters(id) on delete cascade,
  registered_at timestamptz not null default now(),
  primary key (event_id, character_id)
);

create index if not exists v2_event_rewards_event_order_idx
  on public.v2_event_rewards(event_id, sort_order, id);
create index if not exists v2_event_registrations_character_idx
  on public.v2_event_registrations(character_id, registered_at desc);

alter table public.v2_event_rewards enable row level security;
alter table public.v2_event_registrations enable row level security;

drop policy if exists "event rewards public read" on public.v2_event_rewards;
drop policy if exists "event rewards admin manage" on public.v2_event_rewards;
drop policy if exists "event rewards admin insert" on public.v2_event_rewards;
drop policy if exists "event rewards admin update" on public.v2_event_rewards;
drop policy if exists "event rewards admin delete" on public.v2_event_rewards;
drop policy if exists "event registrations owner read" on public.v2_event_registrations;
create policy "event rewards public read" on public.v2_event_rewards
  for select to anon, authenticated using (true);
create policy "event rewards admin insert" on public.v2_event_rewards
  for insert to authenticated with check ((select public.v2_is_admin()));
create policy "event rewards admin update" on public.v2_event_rewards
  for update to authenticated
  using ((select public.v2_is_admin())) with check ((select public.v2_is_admin()));
create policy "event rewards admin delete" on public.v2_event_rewards
  for delete to authenticated using ((select public.v2_is_admin()));
create policy "event registrations owner read" on public.v2_event_registrations
  for select to authenticated using (
    exists (
      select 1 from public.v2_characters character
      where character.id = v2_event_registrations.character_id
        and character.user_id = (select auth.uid())
    ) or (select public.v2_is_admin())
  );

grant select on public.v2_event_rewards to anon, authenticated;
grant insert, update, delete on public.v2_event_rewards to authenticated;
grant select on public.v2_event_registrations to authenticated;

create or replace function public.v2_register_for_event(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen public.v2_characters;
  event_row public.v2_events;
  reward_row record;
  delivered jsonb := '[]'::jsonb;
begin
  if (select auth.uid()) is null then
    raise exception 'Autenticação necessária' using errcode = '42501';
  end if;

  select character.* into chosen
  from public.v2_active_characters active
  join public.v2_characters character on character.id = active.character_id
  where active.user_id = (select auth.uid()) and character.user_id = (select auth.uid())
  for update of character;
  if chosen.id is null then raise exception 'Selecione um personagem'; end if;

  select * into event_row from public.v2_events where id = p_event_id and active;
  if event_row.id is null then raise exception 'Evento indisponível'; end if;

  insert into public.v2_event_registrations(event_id, character_id)
  values (event_row.id, chosen.id)
  on conflict do nothing;
  if not found then raise exception 'Personagem já inscrito'; end if;

  for reward_row in
    select reward.*, item.name as item_name, item.slot as item_slot
    from public.v2_event_rewards reward
    left join public.v2_shop_items item on item.id = reward.item_id
    where reward.event_id = event_row.id
    order by reward.sort_order, reward.id
  loop
    if reward_row.reward_type = 'gold' then
      update public.v2_characters set gold = gold + reward_row.amount, updated_at = now()
      where id = chosen.id;
    elsif reward_row.reward_type = 'xp' then
      update public.v2_characters set xp = xp + reward_row.amount, updated_at = now()
      where id = chosen.id;
    elsif reward_row.reward_type in ('item','title') then
      if reward_row.item_id is null
        or (reward_row.reward_type = 'title' and reward_row.item_slot <> 'title')
        or (reward_row.reward_type = 'item' and reward_row.item_slot = 'title') then
        raise exception 'Recompensa de evento inválida';
      end if;
      insert into public.v2_character_inventory(character_id, item_id, quantity)
      values (chosen.id, reward_row.item_id, reward_row.amount)
      on conflict(character_id, item_id) do update
      set quantity = public.v2_character_inventory.quantity + excluded.quantity,
          updated_at = now();
    end if;
    delivered := delivered || jsonb_build_array(jsonb_build_object(
      'type', reward_row.reward_type,
      'amount', reward_row.amount,
      'name', reward_row.item_name
    ));
  end loop;

  return jsonb_build_object('event_id', event_row.id, 'character_id', chosen.id, 'rewards', delivered);
end;
$$;

revoke execute on function public.v2_register_for_event(uuid) from public, anon;
grant execute on function public.v2_register_for_event(uuid) to authenticated;

-- Metadados tornam cada item balanceável por build e por classes recomendadas.
alter table public.v2_shop_items
  add column if not exists build_key text,
  add column if not exists build_name text,
  add column if not exists recommended_classes text[] not null default '{}';

-- O pedido é substituir equipamentos repetidos. Títulos administrativos são preservados.
-- O ON DELETE CASCADE já remove cópias antigas dos inventários para não deixar referências órfãs.
delete from public.v2_shop_items
where build_key is null and (slot <> 'title' or slot is null);

create unique index if not exists v2_shop_items_unique_lower_name_idx
  on public.v2_shop_items(lower(name));

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
  item_order integer := 0;
begin
  for build in
    select * from (values
      ('common','vigilia-ferro','Vigília de Ferro','Vanguarda Física',array['Guerreiro','Cavaleiro','Paladino'], 'FOR','DEF','Aço da Vigília'),
      ('common','primeira-centelha','Primeira Centelha','Conjurador Inicial',array['Mago','Feiticeiro','Bruxo'], 'INT','ARC','Centelha do Aprendiz'),
      ('uncommon','trilha-cacador','Trilha do Caçador','DPS Ágil',array['Arqueiro','Ladino','Ninja','Assassino'], 'INI','FOR','Marca da Trilha'),
      ('uncommon','cantico-verdejante','Cântico Verdejante','Suporte Sustentado',array['Clérigo','Bardo','Druida'], 'ARC','RES','Cântico das Folhas'),
      ('rare','furia-indomavel','Fúria Indomável','Brutamontes',array['Bárbaro','Monge','Guerreiro'], 'FOR','RES','Fúria Lapidada'),
      ('rare','circulo-runico','Círculo Rúnico','Controle Mágico',array['Alquimista','Mago','Necromante'], 'INT','RES','Runa de Contenção'),
      ('epic','bastiao-solar','Bastião Solar','Tanque Protetor',array['Cavaleiro','Paladino','Clérigo'], 'DEF','ARC','Juramento do Bastião'),
      ('epic','eclipse-silencioso','Eclipse Silencioso','Executor',array['Assassino','Ninja','Ladino','Bruxo'], 'INI','INT','Passo do Eclipse'),
      ('legendary','coroa-conquistador','Coroa do Conquistador','DPS de Linha de Frente',array['Bárbaro','Guerreiro','Paladino','Monge'], 'FOR','DEF','Domínio do Conquistador'),
      ('legendary','oraculo-celeste','Oráculo Celeste','Mago de Suporte',array['Clérigo','Bardo','Mago','Feiticeiro','Druida'], 'ARC','INT','Oráculo Harmônico'),
      ('mythic','relogio-eterno','Relógio Eterno','Especialista em Recarga',array['Ninja','Arqueiro','Alquimista','Mago','Necromante'], 'INI','INT','Instante Roubado'),
      ('mythic','coracao-primordial','Coração Primordial','Colosso Híbrido',array['Druida','Bárbaro','Cavaleiro','Necromante'], 'RES','DEF','Pulso Primordial')
    ) as builds(rarity,build_key,build_name,archetype,classes,primary_stat,secondary_stat,effect_name)
  loop
    tier_power := case build.rarity
      when 'common' then 6 when 'uncommon' then 10 when 'rare' then 15
      when 'epic' then 22 when 'legendary' then 30 else 40 end;

    for slot_row in
      select * from (values
        ('head','Elmo',1.00),('torso','Couraça',1.35),('hands','Manoplas',0.85),
        ('legs','Grevas',1.05),('feet','Passos',0.80),('main_weapon','Relíquia',1.50),
        ('off_weapon','Foco',1.00),('necklace','Medalhão',0.75),('ring','Selo',0.65),
        ('earring','Insígnia',0.60),('cape','Manto',0.90)
      ) as slots(slot,noun,multiplier)
    loop
      item_order := item_order + 1;
      primary_power := greatest(1, round(tier_power * slot_row.multiplier * 0.65));
      secondary_power := greatest(1, round(tier_power * slot_row.multiplier * 0.35));
      item_attributes := jsonb_build_object(
        build.primary_stat, primary_power,
        build.secondary_stat, secondary_power
      );
      item_name := slot_row.noun || ' — ' || build.build_name;
      item_description := format(
        '%s criado para a build %s. Prioriza %s e %s; recomendado para %s.',
        slot_row.noun, build.archetype, build.primary_stat, build.secondary_stat,
        array_to_string(build.classes, ', ')
      );
      item_price := case build.rarity
        when 'common' then 120 when 'uncommon' then 320 when 'rare' then 850
        when 'epic' then 2200 when 'legendary' then 6000 else 15000 end;

      item_effects := '[]'::jsonb;
      if build.rarity = 'legendary' then
        item_effects := jsonb_build_array(jsonb_build_object(
          'key', build.build_key || '-' || slot_row.slot,
          'name', build.effect_name || ': ' || slot_row.noun,
          'description', case slot_row.slot
            when 'main_weapon' then 'Ataques restauram 6% do dano causado como HP.'
            when 'off_weapon' then 'Reduz em 1 rodada a recarga das habilidades usadas.'
            else 'Concede um reforço equilibrado ao início do combate.' end,
          'kind', case slot_row.slot when 'main_weapon' then 'LIFE_STEAL' when 'off_weapon' then 'COOLDOWN_REDUCTION' else 'BATTLE_START' end,
          'trigger', case when slot_row.slot in ('main_weapon') then 'ON_DAMAGE_DEALT' when slot_row.slot = 'off_weapon' then 'ON_SKILL_USE' else 'BATTLE_START' end,
          'duration', 0,
          'power', case slot_row.slot when 'main_weapon' then 6 when 'off_weapon' then 1 else 0 end,
          'modifiers', case when slot_row.slot not in ('main_weapon','off_weapon') then jsonb_build_object(build.secondary_stat, 2) else '{}'::jsonb end,
          'shield', case when slot_row.slot = 'torso' then 35 else 0 end,
          'maxHpPercent', 0, 'mana', 0, 'classResource', 0, 'raceResource', 0
        ));
      elsif build.rarity = 'mythic' then
        item_effects := jsonb_build_array(jsonb_build_object(
          'key', build.build_key || '-' || slot_row.slot,
          'name', build.effect_name || ': ' || slot_row.noun,
          'description', case slot_row.slot
            when 'main_weapon' then 'Ataques restauram 9% do dano causado como HP.'
            when 'off_weapon' then 'Reduz em até 2 rodadas a recarga das habilidades usadas.'
            else 'Desperta uma proteção primordial no início do combate.' end,
          'kind', case slot_row.slot when 'main_weapon' then 'LIFE_STEAL' when 'off_weapon' then 'COOLDOWN_REDUCTION' else 'BATTLE_START' end,
          'trigger', case when slot_row.slot = 'main_weapon' then 'ON_DAMAGE_DEALT' when slot_row.slot = 'off_weapon' then 'ON_SKILL_USE' else 'BATTLE_START' end,
          'duration', 0,
          'power', case slot_row.slot when 'main_weapon' then 9 when 'off_weapon' then 2 else 0 end,
          'modifiers', case when slot_row.slot not in ('main_weapon','off_weapon') then jsonb_build_object(build.primary_stat, 3) else '{}'::jsonb end,
          'shield', case when slot_row.slot = 'torso' then 65 else 0 end,
          'maxHpPercent', case when slot_row.slot = 'cape' then 3 else 0 end,
          'mana', 0, 'classResource', 0, 'raceResource', 0
        ));
      end if;

      insert into public.v2_shop_items(
        slug,name,description,category,price,slot,rarity,attributes,two_handed,
        sort_order,special_effects,active,build_key,build_name,recommended_classes
      ) values (
        build.build_key || '-' || replace(slot_row.slot, '_', '-'),
        item_name,item_description,build.archetype,item_price,slot_row.slot,build.rarity,
        item_attributes,false,item_order,item_effects,true,build.build_key,build.build_name,build.classes
      );
    end loop;
  end loop;
end;
$$;

commit;
