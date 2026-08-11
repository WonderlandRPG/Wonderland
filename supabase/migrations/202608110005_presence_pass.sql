-- Passe de presença configurável por personagem.
begin;

create table if not exists public.v2_presence_rewards (
  day_number smallint primary key check (day_number between 1 and 31),
  reward_type text not null check (reward_type in ('xp', 'wg', 'item')),
  amount integer not null default 1 check (amount > 0),
  item_id uuid references public.v2_shop_items(id) on delete set null,
  active boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  check (reward_type = 'item' or item_id is null),
  check (reward_type <> 'item' or item_id is not null)
);

insert into public.v2_presence_rewards(day_number, reward_type, amount)
values
  (1, 'wg', 100), (2, 'xp', 100), (3, 'wg', 150), (4, 'xp', 200),
  (6, 'wg', 250), (7, 'xp', 300), (8, 'wg', 300), (9, 'xp', 400),
  (11, 'wg', 450), (12, 'xp', 550), (13, 'wg', 600), (14, 'xp', 750)
on conflict (day_number) do nothing;

insert into public.v2_presence_rewards(day_number, reward_type, amount, item_id)
select seed.day_number, 'item', 1, item.id
from (values (5, 'common'), (10, 'rare'), (15, 'epic')) seed(day_number, rarity)
cross join lateral (
  select id from public.v2_shop_items
  where active and v2_shop_items.rarity = seed.rarity
  order by price, sort_order, name
  limit 1
) item
on conflict (day_number) do nothing;

alter table public.v2_presence_rewards enable row level security;
drop policy if exists "presence rewards authenticated read" on public.v2_presence_rewards;
drop policy if exists "presence rewards admin manage" on public.v2_presence_rewards;
create policy "presence rewards authenticated read" on public.v2_presence_rewards
for select to authenticated using (active or (select public.v2_is_admin()));
create policy "presence rewards admin manage" on public.v2_presence_rewards
for all to authenticated using ((select public.v2_is_admin())) with check ((select public.v2_is_admin()));
grant select on public.v2_presence_rewards to authenticated;
grant insert, update, delete on public.v2_presence_rewards to authenticated;

create or replace function public.v2_claim_daily_reward()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen uuid;
  character_row public.v2_characters;
  reward_row public.v2_presence_rewards;
  local_today date := (now() at time zone 'America/Sao_Paulo')::date;
  reward_count integer;
  next_streak integer;
  cycle_day integer;
begin
  select character_id into chosen
  from public.v2_active_characters
  where user_id = (select auth.uid());

  if chosen is null then
    raise exception 'Selecione um personagem antes de marcar presença';
  end if;

  select * into character_row
  from public.v2_characters
  where id = chosen and user_id = (select auth.uid())
  for update;

  if character_row.id is null then
    raise exception 'Personagem inválido' using errcode = '42501';
  end if;
  if character_row.last_daily_claim = local_today then
    raise exception 'Presença já marcada hoje';
  end if;

  select count(*) into reward_count from public.v2_presence_rewards where active;
  if reward_count = 0 then
    raise exception 'O passe de presença ainda não possui recompensas ativas';
  end if;

  next_streak := case
    when character_row.last_daily_claim = local_today - 1 then character_row.daily_streak + 1
    else 1
  end;
  cycle_day := mod(next_streak - 1, reward_count) + 1;

  select * into reward_row
  from public.v2_presence_rewards
  where active
  order by day_number
  offset cycle_day - 1 limit 1;

  if reward_row.reward_type = 'wg' then
    update public.v2_characters set gold = gold + reward_row.amount where id = chosen;
  elsif reward_row.reward_type = 'xp' then
    update public.v2_characters set xp = xp + reward_row.amount where id = chosen;
  elsif reward_row.reward_type = 'item' then
    insert into public.v2_character_inventory(character_id, item_id, quantity)
    values (chosen, reward_row.item_id, reward_row.amount)
    on conflict (character_id, item_id) do update
      set quantity = public.v2_character_inventory.quantity + excluded.quantity,
          updated_at = now();
  end if;

  update public.v2_characters
  set daily_streak = next_streak,
      last_daily_claim = local_today,
      updated_at = now()
  where id = chosen;

  return jsonb_build_object(
    'character_id', chosen,
    'streak', next_streak,
    'day', reward_row.day_number,
    'reward_type', reward_row.reward_type,
    'amount', reward_row.amount,
    'item_id', reward_row.item_id
  );
end;
$$;

revoke execute on function public.v2_claim_daily_reward() from public, anon;
grant execute on function public.v2_claim_daily_reward() to authenticated;

commit;
