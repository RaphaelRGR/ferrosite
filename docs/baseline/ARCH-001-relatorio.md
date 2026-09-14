# ARCH-001 — Separação dos shells

Data: 2026-09-14 · Depende de BASE-001 (`docs/baseline/BASE-001-relatorio.md`)

## Problema

`src/app/layout.tsx` montava Navbar, `<main>` e footer públicos para todas as rotas. Resultado: Portal herdava a navegação do site; `<main>` aninhado em dois níveis no site (layout + página) e em três no Portal (root + layout do Portal + página); `selection:*` e cores do body vazavam para o Portal; `loading`/`error` na raiz faziam a Navbar desaparecer durante carregamento.

## O que mudou

| Arquivo | Mudança |
|---|---|
| `src/app/layout.tsx` | root mínimo: `html`/`body`/fonte/`globals.css`/metadata. `lang="pt-BR"` permanece aqui até I18N-001. |
| `src/components/layout/PublicShell.tsx` (novo) | skip link + Navbar + `<main id="conteudo">` + footer (markup do footer movido verbatim). Classes `bg-[#0A0A0A] text-white selection:*` saíram do body para este wrapper. |
| `src/app/(public)/layout.tsx` (novo) | usa `PublicShell`. |
| `src/app/page.tsx` → `src/app/(public)/page.tsx` | Home entra no grupo público; URL `/` inalterada. |
| `src/app/loading.tsx`, `error.tsx` → `src/app/(public)/` | estados renderizam dentro do shell público (Navbar persiste). `error`: `h2` → `h1`. |
| `src/app/not-found.tsx` | monta `PublicShell` explicitamente (root layout não tem mais shell); `h2` → `h1`. |
| `src/app/(portal)/layout.tsx` | shell próprio: wrapper `data-theme="light"` (gancho para 06A, valor fixo), skip link, `<header>` com marca e "Voltar ao site" (`nav aria-label="Portal"`), `<main id="conteudo">`. Comentário marca onde AUTH-002 insere o guard server-side. |
| `src/app/(portal)/loading.tsx`, `error.tsx` (novos) | estados do Portal dentro do shell do Portal. |
| 4 páginas do Portal | `<main>` → fragmento. |
| 7 páginas públicas | `<main …>` → `<div …>` com as mesmas classes. |
| `src/components/layout/Navbar.tsx` | `aria-label="Navegação principal"` no `<nav>`. |
| `package.json` | `typecheck` = `next typegen && tsc --noEmit` (ver §4). |
| `tests/e2e/smoke.spec.ts` | +22 testes: um único `main#conteudo` e um skip link por rota; rotas públicas sem shell do Portal; rotas do Portal sem Navbar/footer públicos; 404 com `h1` e shell público. |

## Validação

`npm run lint` 0/0 · `npm run typecheck` ok · `npm test` 29/29 · `npm run build` 15 rotas (mesmas de antes) · `npm run test:e2e` **46/46** · verificação visual: Home idêntica, skip link visível ao focar, 404 com Navbar/footer, Portal com shell próprio.

## Decisões e interpretações

1. **"Public shell claro"** foi lido como "explícito/separado". A direção visual clara do site público é DS-001/PUBLIC-001; mudá-la agora quebraria "preservar visual" do próprio ARCH-001.
2. **Portal em base neutra clara** (`bg-neutral-50`): os placeholders do Portal deixam de herdar o fundo escuro do site. Coerente com 06A ("default claro") e com "tema isolado". Não há toggle nem tokens ainda.
3. **Sem guard de auth**: um guard falso seria atalho inseguro. O ponto de inserção está comentado no layout e o smoke continua documentando o Portal aberto.
4. **`not-found` raiz com `PublicShell`**: URL inexistente continua com navegação pública; `notFound()` lançado dentro de `(public)` também cai nesse boundary (renderiza uma vez, dentro do root).

## Achado novo

`tsconfig.json` inclui `.next/types/**` e `.next/dev/types/**`. Após mover rotas, tipos gerados obsoletos em `.next/dev/types` (só regenerados pelo `next dev`) quebram o `tsc`. `next typegen` regenera apenas `.next/types`. Mitigação: `typecheck` roda `next typegen` antes; se `.next/dev` estiver obsoleto localmente, remover a pasta ou rodar `next dev`. Em CI não existe `.next/dev`.

## Pendências relacionadas (fora do escopo)

- `lang` por locale e seletor PT/EN no shell público → I18N-001.
- Tokens, tema persistente e `data-theme` dinâmico → DS-001/PORTAL-001.
- Sidebar/busca/preferências do Portal → PORTAL-001.
- Guard server-side, callback e `middleware` → `proxy` → AUTH-002.
- Design das páginas 404/erro/loading (ainda TODO nos arquivos) → DS-001.
