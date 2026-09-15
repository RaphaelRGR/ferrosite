# DS-001 — Tokens semânticos, primitivos e logo oficial

Data: 2026-09-14 · Depende de ARCH-001 (`docs/baseline/ARCH-001-relatorio.md`)

## O que existe agora

### Tokens (`src/app/globals.css`)

Primitivos (`--brand-orange` `#E84E1B`, variantes) → semânticos (`bg.canvas/surface/surface-2`, `text.primary/muted/on-action`, `border.subtle/strong`, `action.primary/hover`, `accent`, `focus.ring`, `status.success/warning/danger/info`) → tema. Claro é o default (`:root`) **e** um escopo explícito (`[data-theme="light"]`); escuro em `[data-theme="dark"]`. Expostos ao Tailwind 4 por `@theme inline`: `bg-canvas`, `bg-surface`, `text-fg`, `text-fg-muted`, `border-line`, `bg-action`, `text-accent`, `ring-focus`, `text-success`…

Decisões medidas, não copiadas do mockup:

- **Branco sobre `#E84E1B` = 3,78:1, abaixo de AA (4,5:1).** O laranja institucional fica como `accent` (títulos grandes/decoração, ≥ 3:1) e `action.primary` usa `#D3420F` (4,57:1) com hover `#B8380C`. Mesma decisão nos dois temas.
- `border.strong` (bordas de controles) foi elevado a ≥ 3:1 (WCAG 1.4.11): `#6F7783` claro / `#6E747C` escuro.
- Canvas escuro é `#0A0A0A` para preservar o fundo atual do site público; surfaces `#1A1A1A`/`#242424` seguem os cards legados.
- Teste `tests/unit/tokens-contrast.test.ts` lê o CSS e exige AA em 16 pares por tema (33 asserções). Falhou três vezes durante a calibração — os valores acima são o resultado.

`<html data-theme="dark">` é o tema atual do site público (PUBLIC-001 migra para claro). Fica no `<html>` para que overscroll e `color-scheme` sigam o tema; Portal e catálogo abrem escopo `light` próprio. Fonte Geist agora expõe `--font-geist-sans` (a variável referenciada em `@theme` nunca era definida).

### Primitivos (`src/components/ui`)

| Componente | Estados/contratos |
|---|---|
| `Button` (client) + `button-classes.ts` | primary/secondary/ghost/danger; sm/md/lg (md/lg ≥ 44 px); hover, pressed, focus-visible (anel + offset), disabled, `loading` com spinner (`motion-reduce`) e `aria-busy`; `type="button"` por padrão |
| `LinkButton` | mesmas classes sobre `next/link` (link navega, botão age) |
| `Badge` | 5 tons; **ícone + rótulo**, nunca só cor |
| `Input` | label persistente, `help`, `error` (`role="alert"`), `required` anunciado, `aria-describedby`/`aria-invalid` |
| `Dialog` | `<dialog>.showModal()`: inert, Escape, retorno de foco; + wrap de Tab (APG), scroll lock, `aria-labelledby/describedby`, clique no backdrop fecha |
| `Skeleton` | preserva geometria; sem pulso em movimento reduzido |
| `EmptyState` | título, motivo, ação permitida |
| `BrandLogo` | PNG oficial inalterado em `public/brand/efm-logo-lockup.png`, sempre sobre mat branco com respiro |

Usos concretos (regra "dois usos antes de abstrair"): `SubjectModal` do fluxograma migrou para `Dialog` + `Button` (P1 de acessibilidade da auditoria; visual mantido); `error.tsx` público e do Portal usam `Button`; `not-found` usa `LinkButton`; header do Portal, footer público e menu mobile usam `BrandLogo`.

### Catálogo — `/design-system`

Todos os primitivos e estados, lado a lado nos temas claro e escuro. `robots: noindex`, fora da navegação, shell mínimo próprio (`(catalog)/layout.tsx`). Foi o catálogo que revelou o bug do escopo claro herdando o escuro (ver §3).

### Logo oficial

`referencias_ferro/LOGOS DE FERROCOMUNICA (1).png` (1080×1080, RGB, fundo branco) copiada sem alteração. Aplicada em: header do Portal (56 px), footer público (140 px), menu mobile (120 px), catálogo. **Não** na pill da Navbar: a 44 px o wordmark é ilegível e o doc 06 proíbe inventar tamanho mínimo e usar símbolo isolado sem versão oficial. O emoji 🚂 foi removido; a marca em texto ("Eng. Ferroviária / UFSC Joinville") agora aparece também no mobile (antes só o emoji aparecia).

`[CONTEÚDO PENDENTE]` para a instituição: vetor (SVG), versão horizontal, símbolo isolado, versão para fundo escuro e manual de uso. Favicon continua o padrão do Next por isso.

## Validação

- `npm run lint` 0/0 · `npm run typecheck` ok · `npm test` **63/63** (29 currículo + 34 tokens) · `npm run build` 16 rotas (+`/design-system`).
- `npm run test:e2e` **57/57**: smoke/landmarks/links/reduced motion anteriores + Dialog (catálogo: trap, Escape, retorno de foco, scroll lock; fluxograma: abre com o nome da disciplina) + axe (sem violações sérias/críticas no catálogo em ambos os temas e nas 4 rotas do Portal; baseline registrada das rotas públicas legadas e da 404).
- Verificação visual: catálogo nos dois temas, modal do fluxograma, Portal com logo, footer e menu mobile.

## Achados

1. **Escopo claro aninhado herdava o escuro**: `[data-theme="light"]` sem regras própria fazia Portal e catálogo renderizarem com tokens escuros dentro de `html[data-theme="dark"]`. Corrigido com `:root, [data-theme="light"]` e coberto por teste.
2. **`<dialog>` nativo não dá a volta no Tab**: o foco sai para a UI do navegador após o último controle. Implementado wrap manual; teste cobre 8 Tabs.
3. **Shell público legado falha contraste no axe** (Navbar `text-white/30` a 8 px; footer `text-white/40`/`white/30`): registrado na baseline; a Navbar/footer serão refeitos em PUBLIC-001.
4. `Button` precisa ser Client Component (recebe `onClick`); as classes vivem em `button-classes.ts` para o `LinkButton` (server) não importar um módulo cliente.
5. Os **158 `#E84E1B`** das seções legadas não foram migrados: essas seções serão substituídas em PUBLIC-*; migrá-las agora seria churn sem valor. Shells, estados e novos componentes usam só tokens.

## Novas dependências

| Pacote | Versão | Licença | Motivo | Alternativa descartada |
|---|---|---|---|---|
| `@axe-core/playwright` | 4.13.0 | MPL-2.0 (dev-only) | acceptance "axe e contraste" de DS-001; integra ao runner já existente | `pa11y` (CLI separado), `lighthouse` (mais lento, escopo maior) |

## Pendências relacionadas (fora do escopo)

- Toggle e persistência de tema, `data-theme` dinâmico no `<html>` do Portal → PORTAL-001.
- Migração do site público para claro e refatoração da Navbar (teclado/foco/escape, contraste) → PUBLIC-001.
- Select, Drawer, Tabs, Table, Tooltip, Toast → quando houver dois usos concretos (PORTAL-002/003).
- Cards do fluxograma como botões focáveis (o retorno de foco após fechar o modal só faz sentido quando o card for focável) → FLOW-002.
- Tokens `chart.*` → REPORT-001.
