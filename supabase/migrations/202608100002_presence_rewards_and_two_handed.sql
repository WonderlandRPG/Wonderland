insert into public.v2_game_settings(key,category,label,description,value,status,published_at) values
('economy.daily_base_reward','economy','WG base da presença','WG recebido ao marcar presença.','50'::jsonb,'published',now()),
('economy.daily_streak_bonus','economy','Bônus por sequência','WG adicional por dia de sequência.','10'::jsonb,'published',now()),
('economy.daily_streak_cap','economy','Limite do bônus','Máximo de dias considerados no bônus.','7'::jsonb,'published',now()),
('progression.daily_xp_reward','progression','XP da presença','XP recebido ao marcar presença.','25'::jsonb,'published',now())
on conflict (key) do nothing;

update public.v2_shop_items set two_handed = true, updated_at = now()
where name ~* '\(duas mãos\)';

create or replace function public.v2_claim_daily_reward()
returns jsonb language plpgsql security definer set search_path='' as $$
declare chosen uuid; character_row public.v2_characters; base_reward integer; streak_bonus integer; streak_cap integer; xp_reward integer; reward integer;
begin
  select character_id into chosen from public.v2_active_characters where user_id=(select auth.uid());
  if chosen is null then raise exception 'Selecione um personagem antes de marcar presença'; end if;
  select * into character_row from public.v2_characters where id=chosen and user_id=(select auth.uid()) for update;
  if character_row.last_daily_claim=current_date then raise exception 'Presença já marcada hoje'; end if;
  select coalesce((value #>> '{}')::integer,50) into base_reward from public.v2_game_settings where key='economy.daily_base_reward' and status='published';
  select coalesce((value #>> '{}')::integer,10) into streak_bonus from public.v2_game_settings where key='economy.daily_streak_bonus' and status='published';
  select coalesce((value #>> '{}')::integer,7) into streak_cap from public.v2_game_settings where key='economy.daily_streak_cap' and status='published';
  select coalesce((value #>> '{}')::integer,25) into xp_reward from public.v2_game_settings where key='progression.daily_xp_reward' and status='published';
  character_row.daily_streak := case when character_row.last_daily_claim=current_date-1 then character_row.daily_streak+1 else 1 end;
  reward := greatest(0,base_reward) + least(character_row.daily_streak,greatest(1,streak_cap))*greatest(0,streak_bonus);
  update public.v2_characters set gold=gold+reward,xp=xp+greatest(0,xp_reward),daily_streak=character_row.daily_streak,last_daily_claim=current_date,updated_at=now() where id=chosen;
  return jsonb_build_object('reward',reward,'xp_reward',greatest(0,xp_reward),'streak',character_row.daily_streak,'character_id',chosen);
end; $$;
revoke execute on function public.v2_claim_daily_reward() from public,anon;
grant execute on function public.v2_claim_daily_reward() to authenticated;
