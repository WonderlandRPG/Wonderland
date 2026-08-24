begin;

alter table public.v2_events add column if not exists ends_at timestamptz;
update public.v2_events set ends_at = starts_at + interval '7 days' where ends_at is null;
alter table public.v2_events alter column ends_at set not null;
alter table public.v2_events drop constraint if exists v2_events_valid_period_check;
alter table public.v2_events add constraint v2_events_valid_period_check check (ends_at > starts_at);

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

  insert into public.v2_event_registrations(event_id, character_id, user_id)
  values (event_row.id, chosen.id, caller_id)
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
      update public.v2_characters set gold = gold + reward_row.amount, updated_at = now() where id = chosen.id;
    elsif reward_row.reward_type = 'xp' then
      update public.v2_characters set xp = xp + reward_row.amount, updated_at = now() where id = chosen.id;
    elsif reward_row.reward_type in ('item','title') then
      if reward_row.item_id is null
        or (reward_row.reward_type = 'title' and reward_row.item_slot <> 'title')
        or (reward_row.reward_type = 'item' and reward_row.item_slot = 'title') then
        raise exception 'Recompensa de evento inválida';
      end if;
      insert into public.v2_character_inventory(character_id, item_id, quantity)
      values (chosen.id, reward_row.item_id, reward_row.amount)
      on conflict(character_id, item_id) do update
      set quantity = public.v2_character_inventory.quantity + excluded.quantity, updated_at = now();
    end if;
    delivered := delivered || jsonb_build_array(jsonb_build_object(
      'type', reward_row.reward_type, 'amount', reward_row.amount, 'name', reward_row.item_name
    ));
  end loop;

  update public.v2_event_registrations
  set rewards_snapshot = delivered
  where event_id = event_row.id and character_id = chosen.id;

  return jsonb_build_object('event_id', event_row.id, 'character_id', chosen.id, 'rewards', delivered);
end;
$$;

revoke all on function public.v2_register_for_event(uuid) from public, anon;
grant execute on function public.v2_register_for_event(uuid) to authenticated;

commit;
