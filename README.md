# FerroSite: Engenharia Ferroviária e Metroviária (UFSC Joinville)

Site público (PT/EN) e Portal interno do curso de Engenharia Ferroviária e
Metroviária da UFSC Joinville. Em produção: https://engferroviaria.vercel.app

## O que é

- **Site público**: apresenta o curso (com o fluxograma curricular interativo das
  matrizes 2025, 2016 e 2012), projetos, experiências e visitas técnicas,
  notícias, eventos, laboratórios e a área para empresas. Português e inglês.
- **Portal**: ferramenta da coordenação e das equipes para gerir projetos,
  missões, pessoas e papéis, empresas e desafios, conteúdos (com aprovação antes
  de publicar), arquivos, relatórios e configurações.

## Estrutura geral

| Parte | Tecnologia | Papel |
|---|---|---|
| Aplicação | Next.js 16 (App Router), React 19, TypeScript, Tailwind 4 | site e Portal no mesmo app |
| Identidade e dados | Supabase (Auth + Postgres com RLS) | login, dados, regras de acesso, auditoria |
| Arquivos | Google Drive institucional (OAuth) | fotos e documentos; o banco guarda só metadados |
| Hospedagem | Vercel | deploy automático a cada push em `main` |

O site lê apenas o que foi aprovado e publicado pelo Portal; o Portal é protegido
por sessão, perfil ativo e RLS. Detalhes em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Como executar

1. Node `>=20.9` (ver `.nvmrc`).
2. `npm ci`
3. Copie `.env.example` para `.env.local` e preencha. Sem Supabase, o site
   funciona sem publicações e o Portal responde 503.
4. `npm run dev` → http://localhost:3000 (o site redireciona para `/pt`).
5. Testes de tela, na primeira vez: `npx playwright install chromium`.

## Variáveis de ambiente

Nomes apenas; valores ficam em `.env.local` (nunca versionado). Descrição de cada
uma em `.env.example`.

| Grupo | Variáveis |
|---|---|
| Supabase (público) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Site | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTENT_MODE` (`review`/`strict`) |
| Supabase (servidor) | `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `SUPABASE_DB_URL` |
| Formulário público | `CHALLENGE_HASH_SECRET` |
| E-mail | `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_REPLY_TO`, `MAIL_DISPATCH_SECRET` |
| Google Drive | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`, `DRIVE_TOKEN_KEY`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_KEY` |
| Erros | `ERROR_SINK_URL`, `ERROR_SINK_TOKEN`, `ERROR_SINK_LEVEL` |
| Testes e2e | `E2E_ADMIN_*`, `E2E_REVIEWER_*`, `E2E_MEMBER_*`, `E2E_UPLOAD_PROJECT_SLUG` |

## Estrutura de pastas

```
src/app/          rotas: (public)/[locale] site · (portal)/portal Portal · (auth) login · api · og
src/components/   ui · layout · editorial · public/<domínio> · portal/<domínio>
src/lib/          supabase · auth · portal (actions, queries, authz) · content · files (Drive) · crm · mail · observability
src/content/      conteúdo estático tipado (currículo, labs, quarentena editorial)
src/i18n/         dicionários PT/EN, formatação, metadata
content/          JSON gerados (currículo, labs) e inventário editorial
supabase/         migrations (schema, RLS, triggers)
tests/            unit · rls · e2e · integration
docs/             arquitetura, estrutura, convenções, relatórios
scripts/          geradores e utilitários de banco/env
```

Mapa completo, com "onde coloco um novo...?": [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md).

## Scripts importantes

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento (porta 3000) |
| `npm run build` / `npm start` | build e servidor de produção |
| `npm run lint` | ESLint, zero avisos |
| `npm run typecheck` | tipos das rotas + `tsc` |
| `npm test` | testes unitários (Vitest) |
| `npm run test:rls` | políticas do banco em Postgres embutido (sem nuvem) |
| `npm run test:e2e` | Playwright + axe no build de produção (porta 3100; exige `npm run build`) |
| `npm run test:integration` | contra o Supabase real (pula sem variáveis) |
| `npm run check` | lint → typecheck → test → test:rls → build → test:e2e |
| `npm run db:push` / `npm run db:types` | aplica migrations / gera tipos na nuvem |
| `npm run db:types:local` | gera `src/types/database.ts` a partir das migrations, sem Docker |
| `npm run google:env` | copia Client ID/secret de `secrets/client_secret*.json` para `.env.local` |
| `npm run content:report` | regenera `docs/content/inventario-editorial.md` |
| `npm run baseline:screenshots` | screenshots de referência |

## Onde está a documentação

| Documento | Para quê |
|---|---|
| [AI_CONTEXT.md](AI_CONTEXT.md) | resumo para IAs e para quem chega agora: o que não quebrar e onde está cada coisa |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | como site, Portal, Supabase e Drive se conectam |
| [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) | pastas e onde colocar código novo |
| [docs/CONVENTIONS.md](docs/CONVENTIONS.md) | nomes, imports, serviços, erros |
| [docs/GOOGLE_DRIVE_INTEGRATION.md](docs/GOOGLE_DRIVE_INTEGRATION.md) | configurar e operar o Drive |
| [docs/ops/runbook.md](docs/ops/runbook.md) | operação e incidentes |
| `docs/baseline/` | relatório de cada etapa entregue |
| `PLANO_DESENVOLVIMENTO_CLAUDE/` | plano do produto; `33_DECISOES_E_CONFLITOS_ENCONTRADOS.md` guarda decisões e pendências |
| [docs/CLEANUP_REPORT.md](docs/CLEANUP_REPORT.md) / [docs/CLEANUP_PENDING.md](docs/CLEANUP_PENDING.md) | última limpeza e itens para decisão |

## Onde estão as referências

`referencias_ferro/`: mockups, identidade visual, guia de redesign e o portfólio
de laboratórios (PDF que gera `content/labs.json`). É material de referência: não
apagar nem reorganizar.

## Regras importantes

- **Nada institucional inventado.** Texto sem fonte fica em quarentena (selo em
  `review`, oculto em `strict`, que é o modo da produção); lacunas aparecem como
  `[CONTEÚDO PENDENTE]`. Sem dados pessoais ou contatos publicados.
- **Autorização no servidor e no banco** (RLS, triggers, funções); a interface
  apenas espelha.
- **PT e EN com conteúdo próprio**; EN nunca mostra PT como fallback.
- **Currículos e laboratórios são gerados** dos PDFs oficiais (`scripts/*.py`):
  não editar os JSON à mão.
- **Segredos só no servidor**: service role e credenciais do Google nunca vão ao
  navegador, ao código, aos logs ou à documentação. O OAuth do Google serve só ao
  Drive; o login do Portal é do Supabase.
- **Arquivos no Drive**, servidos por proxy; o site nunca expõe link do Drive.
- **Texto visível sem travessão "—"**; vídeos curtos aparecem um por vez.
