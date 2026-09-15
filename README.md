# FerroSite — Engenharia Ferroviária e Metroviária (UFSC Joinville)

Site público (PT/EN) + Portal interno do curso. Next.js 16 (App Router, Turbopack), React 19, Tailwind 4, Supabase (Auth + Postgres com RLS). O plano de desenvolvimento e as decisões estão em `PLANO_DESENVOLVIMENTO_CLAUDE/`; cada etapa tem relatório em `docs/baseline/`.

## Começar

Node `>=20.9` (ver `.nvmrc`). `npm ci`, copie `.env.example` para `.env.local` (sem as variáveis do Supabase o Portal responde 503 e o site funciona sem publicações), depois:

```bash
npm run dev
```

Primeira execução do Playwright: `npx playwright install chromium`.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `src/app/(public)/[locale]` | site público: Início, Curso (fluxograma dos PDFs oficiais), Projetos, Experiências, Notícias, Eventos, Laboratórios, Para Empresas (+ formulário de desafio), Sobre, pré-visualização por token |
| `src/app/(portal)` | Portal: projetos/equipe/missões, pessoas, empresas/desafios (CRM), conteúdos (aprovação → publicação), arquivos, relatórios, configurações |
| `src/app/(auth)`, `src/app/api` | login/callback, health |
| `src/lib` | auth, portal (authz, ações, consultas), crm, content (Markdown restrito, projeção pública), observability, supabase (clientes server/browser/admin/public) |
| `src/i18n` | catálogos PT/EN tipados, formatação, metadata |
| `src/content`, `content/` | quarentena editorial (`editorial-inventory.json`), staging do protótipo, `labs.json` (gerado do portfólio), `curriculum/*.json` (gerado dos PDFs oficiais) |
| `src/data`, `scripts/` | loaders e geradores (`curriculum_from_pdf.py`, `labs_from_pdf.py`, `db-types-local.mjs`) |
| `supabase/migrations` | schema, RLS, triggers e funções (fonte única de verdade do banco) |
| `tests/` | `unit` (Vitest), `rls` (migrations reais em Postgres embutido), `e2e` (Playwright + axe), `integration` (nuvem, opcional) |
| `docs/` | relatórios por etapa, inventário editorial, `ops/runbook.md` |

## Scripts

| Comando | O que faz |
|---|---|
| `npm run lint` | ESLint com `--max-warnings 0` |
| `npm run typecheck` | `next typegen && tsc --noEmit` |
| `npm test` | Vitest (invariantes curriculares, i18n, quarentena, autorização, Markdown, formulário, logs) |
| `npm run test:rls` | políticas/triggers reais em Postgres embutido (sem nuvem) |
| `npm run test:e2e` | Playwright: smoke, links, axe estrito, quarentena, fluxograma, hubs, formulário, cabeçalhos (exige `npm run build`; porta 3100) |
| `npm run test:integration` | contra o Supabase real (pula sem variáveis) |
| `npm run build` | build de produção |
| `npm run check` | lint → typecheck → test → test:rls → build → test:e2e |
| `npm run db:push` / `npm run db:types` | aplica migrations / gera tipos contra a nuvem (`SUPABASE_DB_PASSWORD` em `.env.local`) |
| `npm run db:types:local` | gera `src/types/database.ts` das migrations em Postgres embutido (sem Docker) |
| `npm run content:report` | regenera `docs/content/inventario-editorial.md` |
| `npm run baseline:screenshots` | screenshots de referência em `docs/baseline/screenshots/` |

## Regras que o código respeita

- Nenhuma afirmação institucional sem fonte: conteúdo herdado do protótipo aparece com o selo "Conteúdo em verificação" (`NEXT_PUBLIC_CONTENT_MODE=strict` o oculta); dados pessoais/contatos não são publicados; lacunas ficam como `[CONTEÚDO PENDENTE]`.
- O site lê só a projeção pública aprovada (`public_publication`); o Portal produz, revisa, aprova e publica (snapshot, rollback, despublicação auditada).
- Autorização decidida no servidor/RLS; máquinas de estado e guardas vivem em triggers; tudo crítico é auditado (append-only).
- PT e EN têm conteúdo próprio; EN nunca mostra PT como fallback silencioso.
- Currículos e laboratórios vêm de geradores sobre os PDFs oficiais (com sha256) — não editar os JSON à mão.

Operação: `docs/ops/runbook.md`. Decisões e pendências institucionais: `PLANO_DESENVOLVIMENTO_CLAUDE/33_DECISOES_E_CONFLITOS_ENCONTRADOS.md`.
