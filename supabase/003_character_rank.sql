begin;

alter table public.characters
  add column if not exists guild_rank text not null default 'E';

alter table public.characters
  drop constraint if exists characters_guild_rank_check;

alter table public.characters
  add constraint characters_guild_rank_check
  check (guild_rank in ('E','D','C','B','A','S','EX'));

update public.characters
set guild_rank = 'E'
where guild_rank is null
   or guild_rank not in ('E','D','C','B','A','S','EX');

commit;
