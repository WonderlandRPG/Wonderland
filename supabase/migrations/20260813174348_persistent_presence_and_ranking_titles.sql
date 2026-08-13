-- Presença progressiva e títulos equipados nos rankings públicos.
begin;

create or replace function public.v2_claim_daily_reward()
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  chosen uuid; character_row public.v2_characters; reward_row public.v2_presence_rewards;
  config_row public.v2_presence_pass_config; local_today date := (now() at time zone 'America/Sao_Paulo')::date;
  claimed_count integer; next_day integer; item_slot text;
begin
  select * into config_row from public.v2_presence_pass_config where id=true;
  if config_row.id is null or local_today < config_row.starts_on or local_today > config_row.ends_on then raise exception 'A Presença não está disponível nesta data'; end if;
  select character_id into chosen from public.v2_active_characters where user_id=(select auth.uid());
  if chosen is null then raise exception 'Selecione um personagem antes de marcar presença'; end if;
  select * into character_row from public.v2_characters where id=chosen and user_id=(select auth.uid()) for update;
  if character_row.id is null then raise exception 'Personagem inválido' using errcode='42501'; end if;
  if exists(select 1 from public.v2_presence_claims where character_id=chosen and campaign_start=config_row.starts_on and claim_date=local_today) then raise exception 'Presença já marcada hoje'; end if;
  select count(*) into claimed_count from public.v2_presence_claims where character_id=chosen and campaign_start=config_row.starts_on;
  if claimed_count >= config_row.day_count then raise exception 'Todas as recompensas desta Presença já foram resgatadas'; end if;
  next_day := claimed_count + 1;
  select * into reward_row from public.v2_presence_rewards where active and day_number=next_day;
  if reward_row.day_number is null then raise exception 'A recompensa deste dia ainda não foi configurada'; end if;
  if reward_row.reward_type='wg' then update public.v2_characters set gold=gold+reward_row.amount where id=chosen;
  elsif reward_row.reward_type='xp' then update public.v2_characters set xp=xp+reward_row.amount where id=chosen;
  elsif reward_row.reward_type in ('item','title') then
    select slot into item_slot from public.v2_shop_items where id=reward_row.item_id;
    if reward_row.reward_type='title' and item_slot<>'title' then raise exception 'A recompensa configurada não é um Título'; end if;
    if reward_row.reward_type='item' and item_slot='title' then raise exception 'Use o tipo Título para esta recompensa'; end if;
    insert into public.v2_character_inventory(character_id,item_id,quantity) values(chosen,reward_row.item_id,reward_row.amount)
    on conflict(character_id,item_id) do update set quantity=public.v2_character_inventory.quantity+excluded.quantity,updated_at=now();
  end if;
  insert into public.v2_presence_claims(character_id,campaign_start,claim_date,day_number) values(chosen,config_row.starts_on,local_today,next_day);
  update public.v2_characters set daily_streak=next_day,last_daily_claim=local_today,updated_at=now() where id=chosen;
  return jsonb_build_object('character_id',chosen,'day',next_day,'reward_type',reward_row.reward_type,'amount',reward_row.amount,'item_id',reward_row.item_id);
end $$;
revoke execute on function public.v2_claim_daily_reward() from public,anon;
grant execute on function public.v2_claim_daily_reward() to authenticated;

drop function if exists public.v2_character_ranking();
create function public.v2_character_ranking()
returns table(id uuid,user_id uuid,name text,level integer,xp bigint,race_name text,class_name text,image_url text,kingdom text,adventure_rank text,title_name text)
language sql stable security definer set search_path='' as $$
  select c.id,c.user_id,c.name,c.level,c.xp,r.name,cl.name,c.image_url,c.kingdom,c.adventure_rank,title.name
  from public.v2_characters c join public.v2_content r on r.id=c.race_id join public.v2_content cl on cl.id=c.class_id
  left join public.v2_character_inventory ti on ti.character_id=c.id and ti.equipped_slot='title'
  left join public.v2_shop_items title on title.id=ti.item_id
  order by c.level desc,c.xp desc,c.created_at asc limit 100
$$;
revoke execute on function public.v2_character_ranking() from public,anon;
grant execute on function public.v2_character_ranking() to authenticated;

drop function if exists public.v2_pvp_ranking();
create function public.v2_pvp_ranking()
returns table(id uuid,user_id uuid,name text,level integer,image_url text,race_name text,class_name text,adventure_rank text,matches bigint,victories bigint,defeats bigint,win_rate numeric,title_name text)
language sql stable security definer set search_path='' as $$
  select c.id,c.user_id,c.name,c.level,c.image_url,r.name,cl.name,c.adventure_rank,
    count(h.id) as matches,
    count(h.id) filter(where h.result='victory') as victories,
    count(h.id) filter(where h.result='defeat') as defeats,
    round((count(h.id) filter(where h.result='victory')::numeric/nullif(count(h.id),0))*100,1) as win_rate,
    title.name
  from public.v2_pvp_history h join public.v2_characters c on c.id=h.character_id
  join public.v2_content r on r.id=c.race_id join public.v2_content cl on cl.id=c.class_id
  left join public.v2_character_inventory ti on ti.character_id=c.id and ti.equipped_slot='title'
  left join public.v2_shop_items title on title.id=ti.item_id
  group by c.id,c.user_id,c.name,c.level,c.image_url,r.name,cl.name,c.adventure_rank,title.name
  order by win_rate desc,victories desc,matches desc,c.name limit 100
$$;
revoke execute on function public.v2_pvp_ranking() from public,anon;
grant execute on function public.v2_pvp_ranking() to authenticated;
commit;
