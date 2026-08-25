begin;

create or replace function public.v2_register_for_event(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := (select auth.uid());
  chosen public.v2_characters;
  event_row public.v2_events;
  registration_row public.v2_event_registrations;
  reward_row record;
  delivered jsonb := '[]'::jsonb;
begin
  if caller_id is null then
    raise exception 'Autenticação necessária' using errcode = '42501';
  end if;

  select character.* into chosen
  from public.v2_active_characters active
  join public.v2_characters character on character.id = active.character_id
  where active.user_id = caller_id and character.user_id = caller_id
  for update of character;
  if chosen.id is null then raise exception 'Selecione um personagem'; end if;

  select * into event_row
  from public.v2_events
  where id = p_event_id and active
  for update;
  if event_row.id is null then raise exception 'Evento indisponível'; end if;
  if now() < event_row.starts_at then raise exception 'Inscrições ainda não iniciadas'; end if;
  if now() > event_row.ends_at then raise exception 'Inscrições encerradas'; end if;

  select * into registration_row
  from public.v2_event_registrations
  where event_id = event_row.id and character_id = chosen.id;
  if registration_row.event_id is not null then
    return jsonb_build_object(
      'event_id', event_row.id,
      'character_id', chosen.id,
      'rewards', coalesce(registration_row.rewards_snapshot, '[]'::jsonb),
      'already_registered', true
    );
  end if;

  insert into public.v2_event_registrations(event_id, character_id, user_id)
  values (event_row.id, chosen.id, caller_id);

  for reward_row in
    select reward.*, item.name as item_name, item.slot as item_slot
    from public.v2_event_rewards reward
    left join public.v2_shop_items item on item.id = reward.item_id
    where reward.event_id = event_row.id
    order by reward.sort_order, reward.id
  loop
    if reward_row.reward_type = 'gold' then
      update public.v2_characters
      set gold = gold + reward_row.amount, updated_at = now()
      where id = chosen.id;
    elsif reward_row.reward_type = 'xp' then
      update public.v2_characters
      set xp = xp + reward_row.amount, updated_at = now()
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

  update public.v2_event_registrations
  set rewards_snapshot = delivered
  where event_id = event_row.id and character_id = chosen.id;

  return jsonb_build_object(
    'event_id', event_row.id,
    'character_id', chosen.id,
    'rewards', delivered,
    'already_registered', false
  );
end;
$$;

revoke all on function public.v2_register_for_event(uuid) from public, anon;
grant execute on function public.v2_register_for_event(uuid) to authenticated;

create or replace function public.v2_claim_daily_reward()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := (select auth.uid());
  chosen uuid;
  character_row public.v2_characters;
  reward_row public.v2_presence_rewards;
  config_row public.v2_presence_pass_config;
  existing_claim public.v2_presence_claims;
  local_today date := (now() at time zone 'America/Sao_Paulo')::date;
  claimed_count integer;
  next_day integer;
  item_slot text;
begin
  if caller_id is null then
    raise exception 'Autenticação necessária' using errcode = '42501';
  end if;

  select * into config_row from public.v2_presence_pass_config where id = true;
  if config_row.id is null or local_today < config_row.starts_on or local_today > config_row.ends_on then
    raise exception 'A Presença não está disponível nesta data';
  end if;

  select character_id into chosen
  from public.v2_active_characters
  where user_id = caller_id;
  if chosen is null then raise exception 'Selecione um personagem antes de marcar presença'; end if;

  select * into character_row
  from public.v2_characters
  where id = chosen and user_id = caller_id
  for update;
  if character_row.id is null then raise exception 'Personagem inválido' using errcode = '42501'; end if;

  select * into existing_claim
  from public.v2_presence_claims
  where character_id = chosen
    and campaign_start = config_row.starts_on
    and claim_date = local_today;
  if existing_claim.character_id is not null then
    return jsonb_build_object(
      'character_id', chosen,
      'day', existing_claim.day_number,
      'already_claimed', true
    );
  end if;

  select count(*) into claimed_count
  from public.v2_presence_claims
  where character_id = chosen and campaign_start = config_row.starts_on;
  if claimed_count >= config_row.day_count then
    raise exception 'Todas as recompensas desta Presença já foram resgatadas';
  end if;

  next_day := claimed_count + 1;
  select * into reward_row
  from public.v2_presence_rewards
  where active and day_number = next_day;
  if reward_row.day_number is null then raise exception 'A recompensa deste dia ainda não foi configurada'; end if;

  if reward_row.reward_type = 'wg' then
    update public.v2_characters set gold = gold + reward_row.amount where id = chosen;
  elsif reward_row.reward_type = 'xp' then
    update public.v2_characters set xp = xp + reward_row.amount where id = chosen;
  elsif reward_row.reward_type in ('item','title') then
    select slot into item_slot from public.v2_shop_items where id = reward_row.item_id;
    if item_slot is null then raise exception 'A recompensa configurada não existe'; end if;
    if reward_row.reward_type = 'title' and item_slot <> 'title' then raise exception 'A recompensa configurada não é um Título'; end if;
    if reward_row.reward_type = 'item' and item_slot = 'title' then raise exception 'Use o tipo Título para esta recompensa'; end if;
    insert into public.v2_character_inventory(character_id, item_id, quantity)
    values (chosen, reward_row.item_id, reward_row.amount)
    on conflict(character_id, item_id) do update
    set quantity = public.v2_character_inventory.quantity + excluded.quantity,
        updated_at = now();
  else
    raise exception 'Tipo de recompensa inválido';
  end if;

  insert into public.v2_presence_claims(character_id, campaign_start, claim_date, day_number)
  values (chosen, config_row.starts_on, local_today, next_day);
  update public.v2_characters
  set daily_streak = next_day, last_daily_claim = local_today, updated_at = now()
  where id = chosen;

  return jsonb_build_object(
    'character_id', chosen,
    'day', next_day,
    'reward_type', reward_row.reward_type,
    'amount', reward_row.amount,
    'item_id', reward_row.item_id,
    'already_claimed', false
  );
end;
$$;

revoke all on function public.v2_claim_daily_reward() from public, anon;
grant execute on function public.v2_claim_daily_reward() to authenticated;

commit;
