# Sistema Visual do Wonderland

## Objetivo

Toda página nova e todo tema devem usar uma única fonte de verdade para cor: \`app/theme-tokens.css\`.

O sistema separa **intenção** de **cor**. Componentes não devem decidir que "texto é #291f18"; devem pedir \`--wl-text\`. Um tema troca o valor do token sem reescrever componentes.

## Arquivos canônicos

- \`app/theme-tokens.css\`: única paleta global.
- \`app/visual-contract.css\`: superfícies, ações, campos e estados reutilizáveis.
- \`lib/ui/theme-contrast.test.ts\`: fiscalização automática de contraste e arquitetura.

Esses três arquivos formam o contrato visual. Nenhuma página deve criar um sistema paralelo.

## Regras obrigatórias

1. Código novo usa tokens \`--wl-*\`.
2. Um tema sobrescreve somente tokens semânticos.
3. Tema não usa \`!important\` para trocar paleta.
4. Fundo e texto são sempre tratados como pares.
5. Superfícies claras usam \`--wl-text\` / \`--wl-text-muted\`.
6. Superfícies escuras usam \`--wl-text-inverse\` / \`--wl-text-inverse-muted\`.
7. Botões usam \`--wl-action-bg\` / \`--wl-action-text\`.
8. Estados usam seus trios \`bg/text/border\`.
9. CSS novo não pode inventar uma nova paleta literal.
10. Se uma implementação visual for substituída, o código antigo é removido, não escondido.

## Contrato de superfícies

Prefira:

\`\`\`html
<section data-wl-surface="default">...</section>
<section data-wl-surface="raised">...</section>
<section data-wl-surface="dark">...</section>
\`\`\`

Equivalentes por classe:

- \`.wl-surface\`
- \`.wl-surface-raised\`
- \`.wl-surface-dark\`

Para componentes genéricos:

\`\`\`html
<section data-wl-component="panel">...</section>
<article data-wl-component="card">...</article>
\`\`\`

## Ações e campos

\`\`\`html
<button data-wl-action="primary">Confirmar</button>
<button data-wl-action="accent">Comprar</button>
<input data-wl-field />
\`\`\`

## Estados

\`\`\`html
<div data-wl-status="success">...</div>
<div data-wl-status="warning">...</div>
<div data-wl-status="danger">...</div>
\`\`\`

## Contraste

O build executa \`lib/ui/theme-contrast.test.ts\`.

Os pares essenciais precisam atingir **WCAG AA (4.5:1)** para texto normal. O teste inclui:

- texto principal e secundário em superfícies claras;
- texto principal e secundário em superfícies escuras;
- texto de ação sobre botão principal;
- texto sobre ação dourada;
- sucesso, aviso e erro.

Se o contraste cair abaixo do mínimo, o deploy deve falhar.

## Temas

O seletor oficial para temas é:

\`\`\`css
[data-wl-theme="nome-do-tema"] {
  --wl-text: ...;
  --wl-surface: ...;
  --wl-accent: ...;
  --wl-accent-contrast: ...;
}
\`\`\`

Um tema **não pode** conter regras como:

\`\`\`css
.market-page h3 { ... }
.ranking-card p { ... }
.arena-panel span { ... }
\`\`\`

Se um componente não responde ao tema, o componente deve ser migrado para tokens. Não se cria uma correção específica do tema.

## Páginas novas

Uma página nova pode escolher layout, tipografia, imagens e decoração, mas deve consumir a paleta semântica.

Não permitido em CSS novo:

- hex, rgb/rgba, hsl/hsla para montar uma paleta própria;
- \`:root\` concorrente;
- \`!important\` usado para vencer outro estilo;
- seletor global que atinja outra rota;
- folha "hotfix" para esconder conflito de cascata.

## Dívida técnica legada

O projeto ainda possui folhas antigas com cores literais e \`!important\`. Elas estão explicitamente congeladas em uma lista de compatibilidade no teste.

Isso significa:

- elas podem ser migradas e removidas da lista;
- novos arquivos não recebem essa exceção;
- a quantidade de arquitetura paralela não pode continuar crescendo.

## Remoção de recursos visuais

Ao apagar um sistema visual, remover também:

- componente;
- import;
- CSS;
- asset;
- rota;
- persistência de banco;
- funções/RPC relacionadas.

Depois pesquisar referências restantes e só então publicar.

## Critério de conclusão

Uma página/tema não está pronto só porque "parece bonito". Está pronto quando:

1. usa o contrato semântico;
2. passa contraste;
3. não cria conflito global;
4. funciona em mobile;
5. não deixa CSS/asset antigo escondido;
6. passa o build completo.
