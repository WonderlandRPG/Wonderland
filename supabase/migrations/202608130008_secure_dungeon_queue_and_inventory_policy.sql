-- Fecha execução anônima recriada por DROP/CREATE e otimiza a política do inventário.
begin;

revoke all on function public.v2_join_dungeon_queue(text,uuid) from public,anon;
grant execute on function public.v2_join_dungeon_queue(text,uuid) to authenticated;

drop policy if exists "shop authenticated read" on public.v2_shop_items;
create policy "shop authenticated read" on public.v2_shop_items for select to authenticated using (
  active or public.v2_is_admin() or exists (
    select 1 from public.v2_character_inventory inventory
    join public.v2_characters character on character.id=inventory.character_id
    where inventory.item_id=v2_shop_items.id and character.user_id=(select auth.uid())
  )
);

commit;
