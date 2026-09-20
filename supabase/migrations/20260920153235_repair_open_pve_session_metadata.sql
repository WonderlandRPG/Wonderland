begin;

update public.v2_arena_sessions as session
set creature_id = coalesce(
      session.creature_id,
      (
        select creature.id
        from public.v2_creatures as creature
        where creature.active
          and creature.rank = (
            select character.adventure_rank
            from public.v2_characters as character
            where character.id = session.character_id
          )
        order by random()
        limit 1
      )
    ),
    map_id = coalesce(session.map_id, 'ruinas-centrais'),
    battle_state = case
      when session.battle_state = '{}'::jsonb
        then jsonb_build_object('version', 1, 'outcome', 'ongoing')
      else session.battle_state
    end,
    updated_at = now()
where session.mode = 'pve'
  and session.status = 'open'
  and (session.creature_id is null or session.map_id is null);

commit;
