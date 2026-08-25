begin;

drop function if exists public.v2_character_ranking();
create function public.v2_character_ranking()
returns table(
  id uuid,user_id uuid,name text,level integer,xp bigint,race_name text,class_name text,
  image_url text,kingdom text,adventure_rank text,title_name text,title_style jsonb,title_rarity text
)
language sql stable security definer set search_path='' as $$
  select c.id,c.user_id,c.name,c.level,c.xp,r.name,cl.name,c.image_url,c.kingdom,c.adventure_rank,
    title.name,title.title_style,title.rarity
  from public.v2_characters c
  join public.v2_content r on r.id=c.race_id
  join public.v2_content cl on cl.id=c.class_id
  left join public.v2_character_inventory ti on ti.character_id=c.id and ti.equipped_slot='title'
  left join public.v2_shop_items title on title.id=ti.item_id
  order by c.level desc,c.xp desc,c.created_at asc limit 100
$$;

drop function if exists public.v2_pvp_ranking();
create function public.v2_pvp_ranking()
returns table(
  id uuid,user_id uuid,name text,level integer,image_url text,race_name text,class_name text,
  adventure_rank text,matches bigint,victories bigint,defeats bigint,win_rate numeric,
  title_name text,title_style jsonb,title_rarity text
)
language sql stable security definer set search_path='' as $$
  select c.id,c.user_id,c.name,c.level,c.image_url,r.name,cl.name,c.adventure_rank,
    count(h.id),count(h.id) filter(where h.result='victory'),count(h.id) filter(where h.result='defeat'),
    round((count(h.id) filter(where h.result='victory')::numeric/nullif(count(h.id),0))*100,1),
    title.name,title.title_style,title.rarity
  from public.v2_pvp_history h
  join public.v2_characters c on c.id=h.character_id
  join public.v2_content r on r.id=c.race_id
  join public.v2_content cl on cl.id=c.class_id
  left join public.v2_character_inventory ti on ti.character_id=c.id and ti.equipped_slot='title'
  left join public.v2_shop_items title on title.id=ti.item_id
  group by c.id,c.user_id,c.name,c.level,c.image_url,r.name,cl.name,c.adventure_rank,title.name,title.title_style,title.rarity
  order by 12 desc,10 desc,9 desc,c.name limit 100
$$;

revoke all on function public.v2_character_ranking(),public.v2_pvp_ranking() from public,anon;
grant execute on function public.v2_character_ranking(),public.v2_pvp_ranking() to authenticated;

commit;
