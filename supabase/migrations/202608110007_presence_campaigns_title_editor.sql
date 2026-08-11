-- Campanhas datadas de Presença, Títulos como recompensa e estilos editáveis.
begin;

alter table public.v2_shop_items
  add column if not exists title_style jsonb not null default '{}'::jsonb;

alter table public.v2_presence_rewards
  drop constraint if exists v2_presence_rewards_reward_type_check;
alter table public.v2_presence_rewards
  add constraint v2_presence_rewards_reward_type_check
  check (reward_type in ('xp', 'wg', 'item', 'title'));

alter table public.v2_presence_rewards
  drop constraint if exists v2_presence_rewards_check;
alter table public.v2_presence_rewards
  drop constraint if exists v2_presence_rewards_check1;
alter table public.v2_presence_rewards
  add constraint v2_presence_rewards_item_reference_check check (
    (reward_type in ('item', 'title') and item_id is not null)
    or (reward_type in ('xp', 'wg') and item_id is null)
  );

create table if not exists public.v2_presence_pass_config (
  id boolean primary key default true check (id),
  starts_on date not null,
  ends_on date not null,
  day_count smallint not null default 15 check (day_count between 1 and 31),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

insert into public.v2_presence_pass_config(id, starts_on, ends_on, day_count)
values (true, (now() at time zone 'America/Sao_Paulo')::date,
  (now() at time zone 'America/Sao_Paulo')::date + 30, 15)
on conflict (id) do nothing;

create table if not exists public.v2_presence_claims (
  character_id uuid not null references public.v2_characters(id) on delete cascade,
  campaign_start date not null,
  claim_date date not null,
  day_number smallint not null check (day_number between 1 and 31),
  created_at timestamptz not null default now(),
  primary key (character_id, campaign_start, claim_date),
  unique (character_id, campaign_start, day_number)
);

alter table public.v2_presence_pass_config enable row level security;
alter table public.v2_presence_claims enable row level security;
drop policy if exists "presence config authenticated read" on public.v2_presence_pass_config;
drop policy if exists "presence config admin manage" on public.v2_presence_pass_config;
drop policy if exists "presence claims owner read" on public.v2_presence_claims;
create policy "presence config authenticated read" on public.v2_presence_pass_config
for select to authenticated using (true);
create policy "presence config admin manage" on public.v2_presence_pass_config
for all to authenticated using ((select public.v2_is_admin())) with check ((select public.v2_is_admin()));
create policy "presence claims owner read" on public.v2_presence_claims
for select to authenticated using (exists (
  select 1 from public.v2_characters c where c.id=character_id and c.user_id=(select auth.uid())
));
grant select on public.v2_presence_pass_config, public.v2_presence_claims to authenticated;
grant insert, update, delete on public.v2_presence_pass_config to authenticated;

update public.v2_shop_items set title_style = jsonb_build_object(
  'primary', '#fff1b5', 'secondary', '#1f7a4c', 'glow', '#d7ad45'
) where slot='title' and title_style='{}'::jsonb;

create or replace function public.v2_claim_daily_reward()
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  chosen uuid; character_row public.v2_characters; reward_row public.v2_presence_rewards;
  config_row public.v2_presence_pass_config; local_today date := (now() at time zone 'America/Sao_Paulo')::date;
  claimed_count integer; cycle_day integer; title_slot text;
begin
  select * into config_row from public.v2_presence_pass_config where id=true;
  if config_row.id is null or local_today < config_row.starts_on or local_today > config_row.ends_on then
    raise exception 'A Presença não está disponível nesta data';
  end if;
  select character_id into chosen from public.v2_active_characters where user_id=(select auth.uid());
  if chosen is null then raise exception 'Selecione um personagem antes de marcar presença'; end if;
  select * into character_row from public.v2_characters where id=chosen and user_id=(select auth.uid()) for update;
  if character_row.id is null then raise exception 'Personagem inválido' using errcode='42501'; end if;
  if exists(select 1 from public.v2_presence_claims where character_id=chosen and campaign_start=config_row.starts_on and claim_date=local_today) then
    raise exception 'Presença já marcada hoje';
  end if;
  select count(*) into claimed_count from public.v2_presence_claims where character_id=chosen and campaign_start=config_row.starts_on;
  if claimed_count >= config_row.day_count then raise exception 'Todas as recompensas desta Presença já foram resgatadas'; end if;
  cycle_day := claimed_count + 1;
  select * into reward_row from public.v2_presence_rewards where active and day_number=cycle_day;
  if reward_row.day_number is null then raise exception 'A recompensa deste dia ainda não foi configurada'; end if;
  if reward_row.reward_type='wg' then update public.v2_characters set gold=gold+reward_row.amount where id=chosen;
  elsif reward_row.reward_type='xp' then update public.v2_characters set xp=xp+reward_row.amount where id=chosen;
  elsif reward_row.reward_type in ('item','title') then
    select slot into title_slot from public.v2_shop_items where id=reward_row.item_id;
    if reward_row.reward_type='title' and title_slot<>'title' then raise exception 'A recompensa configurada não é um Título'; end if;
    if reward_row.reward_type='item' and title_slot='title' then raise exception 'Use o tipo Título para esta recompensa'; end if;
    insert into public.v2_character_inventory(character_id,item_id,quantity)
    values(chosen,reward_row.item_id,reward_row.amount)
    on conflict(character_id,item_id) do update set quantity=public.v2_character_inventory.quantity+excluded.quantity,updated_at=now();
  end if;
  insert into public.v2_presence_claims(character_id,campaign_start,claim_date,day_number)
  values(chosen,config_row.starts_on,local_today,cycle_day);
  update public.v2_characters set daily_streak=cycle_day,last_daily_claim=local_today,updated_at=now() where id=chosen;
  return jsonb_build_object('character_id',chosen,'day',cycle_day,'reward_type',reward_row.reward_type,'amount',reward_row.amount,'item_id',reward_row.item_id);
end $$;

revoke execute on function public.v2_claim_daily_reward() from public, anon;
grant execute on function public.v2_claim_daily_reward() to authenticated;
commit;
