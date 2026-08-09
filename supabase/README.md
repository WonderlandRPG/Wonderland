# Supabase — Fundação v2

A migração `migrations/202608060001_v2_foundation.sql` cria a base nova sem remover as tabelas antigas existentes.

Depois de aplicar a migração e criar a conta principal, um fundador deve ser promovido diretamente pelo SQL Editor uma única vez:

```sql
update public.v2_user_roles
set role = 'founder'
where user_id = (
  select id
  from auth.users
  where email = 'EMAIL_DO_FUNDADOR'
);
```

Depois dessa primeira promoção, as permissões poderão ser administradas pelo próprio painel.

## URLs obrigatórias da autenticação

Em **Authentication → URL Configuration**, configure:

- **Site URL:** `https://wonderland-six.vercel.app`
- **Redirect URL de produção:** `https://wonderland-six.vercel.app/**`
- **Redirect URL das previews da Vercel:** `https://*-wonderland-ltda.vercel.app/**`

O curinga é necessário porque confirmação e recuperação usam `/auth/callback` com parâmetros de
consulta. Se a URL não estiver na lista, o Supabase ignora o destino solicitado e volta para a
Site URL. A página inicial também possui uma ponte de segurança para códigos PKCE que chegarem nela.

## Estrutura

- `v2_profiles`: dados públicos básicos da conta;
- `v2_user_roles`: papéis e permissões;
- `v2_content`: catálogo central de raças, classes, itens e outros módulos;
- `v2_content_revisions`: histórico automático de conteúdo;
- `v2_game_settings`: valores globais de balanceamento;
- `v2_setting_revisions`: histórico automático das configurações.
