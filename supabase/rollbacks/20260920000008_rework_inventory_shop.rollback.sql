-- Rollback seguro do Item 6: desativa armazenamento sem apagar histórico ou saldos posteriores.

update public.v2_character_inventory
set location = 'bag', updated_at = now()
where location = 'storage';

revoke execute on function public.v2_set_inventory_location(uuid, text) from authenticated;

-- A tabela de transações e o snapshot são deliberadamente preservados para auditoria.
-- A coluna location também permanece para que as funções de compra já publicadas continuem válidas.

