# Sistema Visual do Wonderland

## Objetivo

Toda página nova e todo tema devem usar uma única fonte de verdade para cor: `app/theme-tokens.css`.

O sistema separa **intenção** de **cor**. Componentes não devem decidir que "texto é #291f18"; devem pedir `--wl-text`. Um tema troca o valor do token sem reescrever componentes.

## Regras obrigatórias

1. Código novo usa tokens `--wl-*`. Os nomes antigos (`--ink`, `--forest`, `--paper` etc.) são apenas compatibilidade temporária.
2. Um tema futuro pode sobrescrever **somente tokens semânticos**. Não deve estilizar dezenas de classes de página.
3. Tema não usa `!important` para trocar paleta.
4. Superfícies claras usam `--wl-text` / `--wl-text-muted`.
5. Superfícies escuras usam `--wl-text-inverse` / `--wl-text-inverse-muted`.
6. Estados de sucesso, aviso e erro usam seus pares `bg/text/border`.
7. Antes de adicionar uma combinação nova, ela precisa entrar no teste de contraste.
8. Se uma implementação visual for substituída, o código antigo deve ser removido, não escondido por outra camada.

## Contraste

O build executa `lib/ui/theme-contrast.test.ts`. Os pares semânticos principais precisam atingir **WCAG AA (4.5:1)** para texto normal.

Isso não substitui revisão visual, mas impede que combinações fundamentais de texto/fundo sejam publicadas com contraste insuficiente.

## Páginas novas

Prefira os contratos de `app/visual-contract.css`:

- `.wl-surface`
- `.wl-surface-raised`
- `.wl-surface-dark`
- `.wl-action`
- `.wl-field`
- `.wl-status-success`
- `.wl-status-warning`
- `.wl-status-danger`

Uma página pode definir layout, tipografia e decoração próprios, mas deve consumir cores semânticas.

## Temas futuros

Exemplo conceitual:

```css
[data-wl-theme="halloween"] {
  --wl-text: ...;
  --wl-surface: ...;
  --wl-accent: ...;
  --wl-text-inverse: ...;
}
```

O tema muda tokens. Ele não deve conter seletores como `.market-page h3`, `.ranking-card p`, `.arena-panel span` etc.

## Migração

As folhas antigas ainda possuem cores literais e `!important`. Elas continuam por compatibilidade para não alterar o visual atual de uma vez. A partir desta arquitetura, novas alterações devem migrar o trecho tocado para tokens em vez de adicionar mais uma camada de override.
