begin;
update public.v2_shop_items set name = case rarity
  when 'common' then 'Manoplas de Combate'
  when 'uncommon' then 'Manoplas de Combate do Peregrino'
  when 'rare' then 'Manoplas de Combate da Aurora Velada'
  when 'epic' then 'Manoplas de Combate do Trono Esmeralda'
  when 'legendary' then 'Manoplas de Combate da Coroa Eterna'
  when 'mythic' then 'Manoplas de Combate do Primeiro Sonho'
end, updated_at = now()
where slug = 'punho-manoplas' or slug like 'punho-manoplas-%';
commit;
