# Publicação segura do Rework

1. Abra `/admin/homologacao` na URL de prévia da Vercel e confirme todos os indicadores.
2. Confirme no Supabase que o backup automático mais recente terminou antes de aplicar novas migrações. Para uma mudança de alto risco, crie também um backup sob demanda no painel.
3. Execute o portão completo com `npm run check` e simule uma partida PvE e uma PvP 2×2 na prévia.
4. Aplique as migrações aditivas. Não remova as tabelas de backup criadas pelas migrações do Rework.
5. Promova a implantação validada ao domínio oficial. Ative módulos em `/admin/migracao-rework` gradualmente.
6. Monitore `/api/health`, erros de execução, abandono de PvP e falhas de RPC durante a primeira hora.
7. Em regressão: desative o módulo afetado, reverta a implantação na Vercel e execute apenas o rollback específico documentado para a migração.

Nunca faça rollback destrutivo de personagens, inventário, moedas ou histórico competitivo.
