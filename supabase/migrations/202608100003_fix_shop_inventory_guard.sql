create or replace function public.v2_guard_inventory_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  item_payload jsonb;
  stack_limit integer;
begin
  if exists (select 1 from public.v2_shop_items where id = new.item_id) then
    stack_limit := 999;
  else
    select payload into item_payload
    from public.v2_content
    where id = new.item_id and content_type = 'item';

    if item_payload is null then
      raise exception 'Item inválido.' using errcode = '23514';
    end if;

    stack_limit := case
      when coalesce((item_payload ->> 'stackable')::boolean, false)
        then coalesce((item_payload ->> 'maxStack')::integer, 1)
      else 1
    end;
  end if;

  if new.quantity < 1 or new.quantity > stack_limit then
    raise exception 'A quantidade ultrapassa o limite permitido.' using errcode = '23514';
  end if;

  new.updated_at := now();
  return new;
end;
$$;
