# Wonderland RPG — Fundação v2

Reconstrução do Wonderland como uma aplicação completa em Next.js, React e TypeScript.

## Objetivos da nova base

- uma única fonte de regras para Ficha, Arena, criação de personagem e painel;
- conteúdo e balanceamento administráveis pelo painel;
- dados versionados, com rascunho, publicação e histórico;
- autenticação e segurança por usuário através do Supabase;
- validação automática para impedir valores inválidos como `NaN`;
- testes de regras antes de cada publicação.

## Desenvolvimento local

1. Instale o Node.js 20.9 ou superior.
2. Execute `npm install`.
3. Copie `.env.example` para `.env.local` e preencha as chaves do Supabase.
4. Execute `npm run dev`.

## Validação

```bash
npm run check
```

Esse comando executa lint, verificação de tipos, testes e build de produção.

## Banco de dados

A migração inicial está em `supabase/migrations/202608060001_v2_foundation.sql`.
Ela cria tabelas v2 isoladas e não remove nenhuma tabela antiga automaticamente.
