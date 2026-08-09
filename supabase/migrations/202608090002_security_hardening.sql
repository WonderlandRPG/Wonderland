begin;

-- Funções internas de triggers nunca devem ser chamadas pela API.
revoke all on function public.v2_archive_content_revision() from public, anon, authenticated;
revoke all on function public.v2_archive_setting_revision() from public, anon, authenticated;
revoke all on function public.v2_handle_new_user() from public, anon, authenticated;
revoke all on function public.v2_guard_character() from public, anon, authenticated;
revoke all on function public.v2_guard_inventory_row() from public, anon, authenticated;

-- Nenhuma função privilegiada fica disponível sem autenticação.
revoke all on function public.v2_is_admin() from public, anon;
revoke all on function public.v2_publish_content(uuid) from public, anon;
revoke all on function public.v2_publish_setting(text) from public, anon;
revoke all on function public.v2_set_player_role(uuid, text) from public, anon;
revoke all on function public.v2_claim_daily_reward() from public, anon;
revoke all on function public.v2_buy_shop_item(uuid) from public, anon;
revoke all on function public.v2_equip_inventory_item(uuid, text) from public, anon;
revoke all on function public.v2_unequip_inventory_item(uuid) from public, anon;
revoke all on function public.v2_grant_item(uuid, uuid, integer) from public, anon;

grant execute on function public.v2_is_admin() to authenticated;
grant execute on function public.v2_publish_content(uuid) to authenticated;
grant execute on function public.v2_publish_setting(text) to authenticated;
grant execute on function public.v2_set_player_role(uuid, text) to authenticated;
grant execute on function public.v2_claim_daily_reward() to authenticated;
grant execute on function public.v2_buy_shop_item(uuid) to authenticated;
grant execute on function public.v2_equip_inventory_item(uuid, text) to authenticated;
grant execute on function public.v2_unequip_inventory_item(uuid) to authenticated;

-- Políticas explícitas por papel evitam avaliar v2_is_admin() em requisições anônimas.
drop policy if exists "v2 published content is public" on public.v2_content;
drop policy if exists "v2 content managed by admins" on public.v2_content;
create policy "v2 published content anon read" on public.v2_content for select to anon
using (status = 'published');
create policy "v2 content authenticated read" on public.v2_content for select to authenticated
using (status = 'published' or public.v2_is_admin());
create policy "v2 content admin insert" on public.v2_content for insert to authenticated
with check (public.v2_is_admin());
create policy "v2 content admin update" on public.v2_content for update to authenticated
using (public.v2_is_admin()) with check (public.v2_is_admin());
create policy "v2 content admin delete" on public.v2_content for delete to authenticated
using (public.v2_is_admin());

drop policy if exists "v2 published settings are public" on public.v2_game_settings;
drop policy if exists "v2 settings managed by admins" on public.v2_game_settings;
create policy "v2 published settings anon read" on public.v2_game_settings for select to anon
using (status = 'published');
create policy "v2 settings authenticated read" on public.v2_game_settings for select to authenticated
using (status = 'published' or public.v2_is_admin());
create policy "v2 settings admin manage" on public.v2_game_settings for all to authenticated
using (public.v2_is_admin()) with check (public.v2_is_admin());

drop policy if exists "shop public read" on public.v2_shop_items;
drop policy if exists "shop admin manage" on public.v2_shop_items;
create policy "shop anon read" on public.v2_shop_items for select to anon using (active);
create policy "shop authenticated read" on public.v2_shop_items for select to authenticated
using (active or public.v2_is_admin());
create policy "shop admin manage" on public.v2_shop_items for all to authenticated
using (public.v2_is_admin()) with check (public.v2_is_admin());

commit;
