alter table public.characters
add column if not exists kingdom_id text;

alter table public.characters
alter column wg set default 1500;

update public.characters
set wg = 1500
where wg is null;

create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Apenas administradores podem excluir contas.';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Não é permitido excluir a própria conta pelo painel.';
  end if;

  delete from auth.users where id = target_user_id;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;

notify pgrst, 'reload schema';
