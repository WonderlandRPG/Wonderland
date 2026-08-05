-- Wonderland — Anel dos Administradores
-- Item administrativo de teste, fora dos padrões normais de balanceamento.
-- Execute este arquivo no SQL Editor do Supabase.

create or replace function public.grant_admin_ring_to_admin_characters()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_character record;
  v_inventory_id uuid;
  v_position integer;
  v_granted integer := 0;
  v_metadata jsonb := jsonb_build_object(
    'name','Anel dos Administradores',
    'slot','ring_1',
    'rarity','Mítico',
    'price_wg',55000000,
    'stats',jsonb_build_object('FOR',100,'DEF',100,'RES',100,'INI',100,'INT',100,'ARC',100),
    'icon','💍',
    'image','https://i.pinimg.com/1200x/6d/11/14/6d11147899a0a5756ca43d953b319631.jpg',
    'two_handed',false,
    'occupies_both_hands',false,
    'test_item',true,
    'description','Item administrativo de teste, deliberadamente fora dos padrões normais de balanceamento do RPG.'
  );
begin
  for v_character in
    select c.id
    from public.characters c
    join public.profiles p on p.id = c.user_id
    where lower(coalesce(p.role,'')) = 'admin'
  loop
    -- Se já estiver equipado, apenas atualiza os metadados e não duplica.
    update public.character_equipment
    set metadata = v_metadata
    where character_id = v_character.id
      and item_key = 'anel-dos-administradores';

    if found then
      continue;
    end if;

    select id into v_inventory_id
    from public.character_inventory
    where character_id = v_character.id
      and item_key = 'anel-dos-administradores'
    limit 1;

    if v_inventory_id is not null then
      update public.character_inventory
      set quantity = greatest(quantity,1),
          metadata = v_metadata
      where id = v_inventory_id;
    else
      select coalesce(max(slot_position),0) + 1
      into v_position
      from public.character_inventory
      where character_id = v_character.id;

      insert into public.character_inventory(
        character_id,
        item_key,
        quantity,
        slot_position,
        metadata
      ) values (
        v_character.id,
        'anel-dos-administradores',
        1,
        v_position,
        v_metadata
      );

      v_granted := v_granted + 1;
    end if;
  end loop;

  return v_granted;
end;
$$;

-- Distribui agora para todos os personagens pertencentes a contas ADMIN.
select public.grant_admin_ring_to_admin_characters() as personagens_que_receberam_o_anel;

-- A função fica disponível para ser executada novamente caso uma nova conta
-- seja promovida a ADMIN ou um administrador crie outro personagem.
