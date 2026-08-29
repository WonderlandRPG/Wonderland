<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


## Wonderland Visual System

For any page, theme, component, or visual refactor:

- Read `docs/visual-system.md` before editing styles.
- `app/theme-tokens.css` is the only global source of semantic color tokens.
- New CSS must use `--wl-*` tokens instead of creating a literal palette.
- Do not add a competing `:root` palette.
- Do not use `!important` to solve contrast or cascade conflicts in new CSS.
- Prefer `app/visual-contract.css` surfaces/actions/fields/status contracts.
- A theme may only override `--wl-*` inside `[data-wl-theme="..."]`.
- Do not theme by targeting route/component selectors such as Loja, Ranking, Arena or Ficha.
- If an existing component does not respond to theme tokens, migrate that component instead of adding a theme-specific override.
- Background and foreground colors are a pair; both must pass the contrast tests.
- When replacing/removing a visual system, remove its components, imports, CSS, assets, routes and persistence references instead of hiding them.
- Run the full test/build suite before considering visual work complete.
