# CLEAN-001 — remoção controlada do legado

Data: 2026-09-15 · Fase F6 · Depende de PUBLIC-001/002, FLOW-002, PORTAL-001 · Docs 28, 33

## Removido (sem consumidor, verificado por busca no código e por build/testes)

| Item | Motivo |
|---|---|
| `src/components/sections/*` (33 componentes do protótipo) | substituídos por `components/public/**` e páginas novas em PUBLIC-001/002; só apareciam como origem em `staging.ts`/inventário (registros preservados). |
| `src/components/layout/Navbar.tsx`, `src/components/ui/CurriculumFlowchart.tsx`, `src/components/ui/SubjectModal.tsx` | substituídos por `PublicHeader`, `CurriculumExplorer` e `SubjectDialog` (paridade validada em FLOW-002). |
| `src/types/{events,news,visits}.ts` | sem importadores; os tipos reais vêm de `src/types/database.ts` (gerado). |
| dependência `gsap` | usada só pelo legado (23 arquivos removidos); `npm audit --omit=dev`: 0 vulnerabilidades. |
| `public/videos/hero.mp4` (35 MB) e `public/images/about/hero-bg.png`, `public/{next,vercel,file,globe,window}.svg` | mídia do protótipo sem licença/crédito registrados (25) e assets do template; `public/` cai para 1,2 MB. Recuperáveis pelo Git se houver decisão de uso com crédito. |
| `.gitkeep` em pastas já povoadas e as pastas vazias `src/actions`, `src/hooks` | ruído. |

## Mantido de propósito

- `public/grades/*.html|pdf`: fallback documental das grades (links externos conhecidos; smoke testa que continuam servidos).
- `src/data/curriculums.legacy.ts`: insumo do gerador (nomes curtos/categorias); documentado em `curriculums.ts`.
- `public/empresas/*` (logos): referenciados pelo staging sob quarentena até autorização de marca (13).
- Entradas do inventário editorial das seções legadas: preservadas com a nota "legado removido em CLEAN-001" — a decisão editorial (confirmar/corrigir/descartar) continua pendente por entrada.
- `/portal/questoes`: decisão pendente (33, pergunta 6) — virou página honesta com `[CONTEÚDO PENDENTE]` em vez de um `<h1>` com TODO. `/portal/acervo` redireciona para `/portal/arquivos` (FILE-001) para preservar links.

## README

Reescrito: estrutura real do repositório, scripts (incl. `test:rls`, `db:types:local`), regras que o código respeita e ponteiros para runbook e decisões.

## Validação

`npm run lint` 0/0 (src, tests, scripts) · `npm run typecheck` ok · `npm test` **135/135** · build ok (84 páginas) · `npm run test:e2e` **253/253** (grades legadas continuam servidas; 404/shell/axe sem regressão) · `npm audit --omit=dev` 0.
