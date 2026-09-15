# Migração segura do Rework

## Limites desta migração

- O banco oficial continua sendo a única fonte de autenticação, contas, personagens e progresso.
- Nenhuma conta, sessão, senha ou personagem do Rework será importado.
- Não existe banco temporário nem sincronização entre projetos Supabase.
- Cada módulo novo nasce desligado e só pode ser exposto depois de testes e aprovação.

## Ordem de implantação

1. Classes e raças.
2. Atributos e poder total.
3. Habilidades e talentos.
4. Itens, equipamentos e inventário.
5. Mapa tático PvE.
6. Mapa tático PvP.
7. Ranqueada 2x2.

As liberações usam chaves `rollout.rework.*` em `v2_game_settings`. Ausência da chave, erro de leitura ou valor diferente do booleano `true` significam **desligado**.

## Processo de cada módulo

1. Criar transformações compatíveis com os registros oficiais existentes.
2. Validar em branch e deployment de preview.
3. Fazer backup lógico das tabelas oficiais que o módulo passará a escrever.
4. Aplicar somente migrações aditivas.
5. Verificar o módulo ainda desligado em produção.
6. Liberar para administradores, depois para um grupo pequeno e só então para todos.

## Reversão

1. Alterar a chave do módulo para `false`.
2. Restaurar o deployment estável anterior na Vercel.
3. Se for necessário remover esta fundação, executar `supabase/rollbacks/20260915180000_prepare_rework_rollout_flags.rollback.sql`.

O rollback da fundação remove somente as sete chaves com categoria `rework_rollout`. Ele não contém comandos contra `auth.users`, perfis, personagens, inventários ou progresso.
