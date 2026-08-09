# Wonderland RPG

Portal oficial do Wonderland RPG, com contas, progressão, economia, conquistas, ranking, eventos e Painel ADM.

## Publicação

1. Configure as variáveis descritas em `.env.example` na hospedagem.
2. Aplique as migrações de `supabase/migrations` em ordem.
3. Execute `npm run check` antes de publicar.

O e-mail transacional deve usar SMTP próprio no Supabase Authentication, com domínio autenticado (SPF, DKIM e DMARC), remetente `contato@seudominio` e `NEXT_PUBLIC_SITE_URL` apontando para a URL oficial.
