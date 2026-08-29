# Sistema Visual do Wonderland

Este documento é o contrato para páginas, temas e componentes novos.

## Fonte única de cores

A paleta oficial vive em \`app/design-tokens.css\`.

Nenhum tema deve procurar classes específicas do site para trocar cor. Um tema altera os tokens \`--wx-*\` no seu próprio escopo e todos os componentes que seguem o contrato acompanham a mudança.

\`\`\`css
[data-wx-theme="meu-tema"] {
  --wx-color-canvas: ...;
  --wx-color-surface: ...;
  --wx-color-text: ...;
  --wx-color-primary: ...;
  --wx-color-on-primary: ...;
}
\`\`\`

O fundo e a cor de texto são sempre tratados como um par.

## Tokens semânticos

Use:

- \`--wx-color-canvas\`: fundo geral.
- \`--wx-color-surface\`: painel principal.
- \`--wx-color-surface-raised\`: card elevado.
- \`--wx-color-text\`: texto em superfície clara.
- \`--wx-color-text-muted\`: texto secundário.
- \`--wx-color-surface-inverse\`: painel escuro.
- \`--wx-color-on-inverse\`: texto principal em painel escuro.
- \`--wx-color-on-inverse-muted\`: texto secundário em painel escuro.
- \`--wx-color-primary\` + \`--wx-color-on-primary\`: ação principal.
- \`--wx-color-accent\` + \`--wx-color-on-accent\`: destaque.
- tokens de \`success\`, \`warning\`, \`danger\` e \`info\`: estados.

Nunca escolha apenas o fundo. Escolha também o token \`on-*\` correspondente.

## Contrato de superfícies

Páginas novas podem usar:

\`\`\`html
<section data-wx-surface="default">...</section>
<section data-wx-surface="raised">...</section>
<section data-wx-surface="inverse">...</section>
\`\`\`

ou as classes \`.wx-surface\`, \`.wx-surface-raised\` e \`.wx-surface-inverse\`.

## Contraste automático

\`lib/design/theme-contract.test.ts\` valida os pares críticos em WCAG AA, mínimo 4.5:1.

Um tema novo deve receber teste equivalente antes de produção.

## Regras para páginas novas

1. usar tokens semânticos para fundo, texto, bordas e controles;
2. não criar uma paleta nova em \`:root\`;
3. não usar \`!important\` para consertar contraste;
4. não sobrescrever globalmente componentes de outra rota;
5. manter CSS da rota escopado pela classe raiz da página;
6. usar \`data-wx-surface\` quando possível.

## Regras para temas

Um tema é um conjunto de tokens. Ele não é uma coleção de correções CSS.

Não usar como estratégia:

- dezenas de seletores individuais;
- corrigir texto depois do fundo com \`!important\`;
- alterar estrutura, dimensões ou posicionamento;
- esconder estilo antigo em vez de removê-lo.

## Remoção

Quando um recurso visual for excluído, remover componente, import, CSS, asset, rota e dados/funções de banco relacionados. Depois pesquisar referências restantes antes do deploy.

## Compatibilidade

Os nomes antigos, como \`--ink\`, \`--forest\` e \`--paper\`, são aliases temporários dos tokens \`--wx-*\`. Código novo não deve usá-los.
