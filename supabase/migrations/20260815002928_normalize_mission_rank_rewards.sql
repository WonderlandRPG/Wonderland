begin;

with official_rewards(rank,reward_xp,reward_gold) as (values
  ('E',500::bigint,100::bigint),
  ('D',1000::bigint,250::bigint),
  ('C',2000::bigint,600::bigint),
  ('B',4000::bigint,1500::bigint),
  ('A',8000::bigint,4000::bigint),
  ('S',15000::bigint,10000::bigint),
  ('EX',30000::bigint,25000::bigint)
)
update public.v2_missions mission
set reward_xp=reward.reward_xp,reward_gold=reward.reward_gold,updated_at=now()
from official_rewards reward
where mission.rank=reward.rank
  and (mission.reward_xp,mission.reward_gold) is distinct from (reward.reward_xp,reward.reward_gold);

do $$
begin
  if exists (
    select 1 from public.v2_missions
    where (rank='E' and (reward_xp<>500 or reward_gold<>100))
       or (rank='D' and (reward_xp<>1000 or reward_gold<>250))
       or (rank='C' and (reward_xp<>2000 or reward_gold<>600))
       or (rank='B' and (reward_xp<>4000 or reward_gold<>1500))
       or (rank='A' and (reward_xp<>8000 or reward_gold<>4000))
       or (rank='S' and (reward_xp<>15000 or reward_gold<>10000))
       or (rank='EX' and (reward_xp<>30000 or reward_gold<>25000))
  ) then
    raise exception 'Existem missões fora da tabela oficial de recompensas';
  end if;
end;
$$;

commit;
