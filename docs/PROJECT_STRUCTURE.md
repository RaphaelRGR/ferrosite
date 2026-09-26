# Estrutura do projeto

Mapa das pastas: o que existe em cada uma, o que pode entrar e o que não deve.
Arquitetura (como as partes conversam): `docs/ARCHITECTURE.md`. Regras de escrita:
`docs/CONVENTIONS.md`.

## Árvore principal

```
/
├── AI_CONTEXT.md              contexto para IAs (ler primeiro)
├── README.md                  visão geral, como rodar, scripts
├── AGENTS.md / CLAUDE.md      instruções de agente (bloco do Next + ponteiro para AI_CONTEXT)
├── content/                   dados brutos versionados (JSON gerado, inventário editorial)
│   ├── curriculum/            2025/2016/2012.json (gerados dos PDFs) + legacy-prototype.ts (insumo do gerador)
│   ├── labs.json              gerado do portfólio de laboratórios (PDF)
│   └── editorial-inventory.json   quarentena editorial: fonte/responsável/estado de cada bloco de texto
├── docs/                      documentação técnica e relatórios
│   ├── ARCHITECTURE.md · PROJECT_STRUCTURE.md · CONVENTIONS.md
│   ├── CLEANUP_REPORT.md · CLEANUP_PENDING.md
│   ├── GOOGLE_DRIVE_INTEGRATION.md
│   ├── baseline/              um relatório por etapa entregue (histórico)
│   ├── content/               inventario-editorial.md (gerado por npm run content:report)
│   └── ops/runbook.md         operação: deploy, logs, incidentes
├── PLANO_DESENVOLVIMENTO_CLAUDE/   plano do produto, decisões e pendências (preservar)
├── referencias_ferro/         referências visuais, identidade e documentos de origem (preservar)
├── public/                    arquivos servidos como estão (URLs públicas estáveis)
│   ├── brand/                 logo oficial
│   ├── empresas/              logos de empresas (uso sob autorização de marca)
│   └── grades/                PDFs oficiais das matrizes + fluxogramas HTML legados
├── scripts/                   ferramentas de manutenção (geradores, banco, env)
├── src/
│   ├── app/                   rotas do Next (App Router)
│   ├── components/            componentes React
│   ├── content/               conteúdo estático tipado e regras editoriais
│   ├── i18n/                  idiomas, dicionários, formatação, metadata
│   ├── lib/                   lógica de servidor e integrações
│   ├── types/                 tipos gerados (database.ts)
│   ├── proxy.ts               idioma do site + guard do Portal (ex-middleware)
│   └── instrumentation.ts     captura de erros do servidor
├── supabase/
│   ├── migrations/            schema, RLS, triggers e funções (fonte única do banco)
│   └── config.toml
└── tests/
    ├── unit/                  Vitest: regras puras, i18n, contraste, Drive, e-mail...
    ├── rls/                   políticas reais em Postgres embutido
    ├── e2e/                   Playwright + axe contra o build de produção
    ├── integration/           contra o Supabase da nuvem (opcional, pula sem env)
    ├── baseline/              captura de screenshots de referência
    └── helpers/               rotas conhecidas e crawler de links
```

## `src/app`: rotas

Grupos de rota separam os quatro "sites" que compartilham o projeto. Cada grupo
tem seu próprio root layout.

| Pasta | O que é |
|---|---|
| `(public)/[locale]/` | site público. `layout.tsx` monta o shell; cada seção é uma pasta (`curso`, `projetos/[slug]`, `experiencias/[id]`, `noticias`, `eventos`, `laboratorios`, `para-empresas`, `sobre`, `privacidade`, `simuladores`, `previa/[token]`). `[...rest]` devolve 404 localizado. |
| `(portal)/portal/` | Portal. `(portal)/layout.tsx` exige sessão e perfil ativo (`AccessGate`). Pastas espelham o menu: `projetos`, `pessoas`, `empresas`, `desafios`, `conteudos`, `arquivos`, `relatorios`, `configuracoes`. `route.ts` internos servem bytes do Drive e exportações. |
| `(auth)/login/` | tela de login (Supabase Auth). |
| `(catalog)/design-system/` | catálogo de componentes para desenvolvimento (noindex, fora do menu). |
| `api/` | rotas HTTP: `auth/callback` (Supabase), `auth/google/*` (conectar o Drive), `midia/[id]` (fotos públicas), `mail/dispatch` (cron da fila), `telemetry` (erros do navegador), `health`. |
| `og/[locale]/` | imagem de compartilhamento (Open Graph). |
| `globals.css` | tokens de cor, tema e estilos globais. |
| `robots.ts`, `sitemap.ts`, `favicon.ico` | convenções do Next. |

**Pode entrar:** `page.tsx`, `layout.tsx`, `route.ts`, `error.tsx`, `loading.tsx`,
`not-found.tsx` e componentes usados por uma única rota (ex.: `LoginForm.tsx`).
**Não deve entrar:** consultas ao banco repetidas entre páginas (vão para `lib`),
componentes reutilizáveis (vão para `components`), textos fixos (vão para `i18n`).

## `src/components`

| Pasta | O que é | Não colocar |
|---|---|---|
| `ui/` | primitivas sem domínio: `Button`, `LinkButton`, `Input`, `Field` (Select/Textarea), `Dialog`, `Drawer`, `Badge`, `EmptyState`, `Skeleton`, `BrandLogo`. | nada que saiba de projeto, missão, Supabase ou idioma. |
| `layout/` | moldura das páginas: `HtmlShell` (html/body compartilhado), `PublicShell` + `PublicHeader` + `LocaleSwitcher` (site). | conteúdo de página. O shell do Portal está em `portal/shell/`. |
| `editorial/` | estado editorial: `UnverifiedContent` (quarentena, Server Component), `UnverifiedFrame` (selo), `PendingContent` (`EditorialPending`, `PendingPage`). | componentes visuais comuns. |
| `public/` | componentes do site público. Na raiz, os usados por várias páginas (`SectionHeading`, `HeroArt`, `PublishedArticle`, `PublishedGallery`, `ShortsStrip`). Subpastas por domínio: `home/`, `course/`, `curriculum/` (fluxograma), `projects/`, `experiences/`, `labs/`, `companies/`, `motion/` (animações e easter eggs). | nada do Portal. |
| `portal/` | componentes do Portal. Na raiz só `ActionFeedback` (retorno de toda Server Action). Subpastas por domínio: `shell/` (menu, menu móvel, tema), `projects/` (projeto, equipe, missões, transições), `content/` (conteúdos e galeria), `files/` (metadados, envio, importação, integração com o Drive), `crm/`, `people/`, `reports/`, `settings/`. | componentes do site público. |

Uma pasta de domínio pode ter um único arquivo: o critério é previsibilidade
("componente de Pessoas fica em `portal/people`").

## `src/lib`: lógica e integrações

| Pasta | O que é |
|---|---|
| `supabase/` | clientes: `server` (sessão do usuário), `middleware` (renova sessão no proxy), `public` (anônimo, só projeções públicas), `admin` (service role, só servidor), `env`. |
| `auth/` | sessão atual (`session.ts`), login/logout (`actions.ts`), redirects seguros (`redirects.ts`). |
| `portal/` | regras do Portal. `actions/` = Server Actions (mutações, `"use server"`); `queries/` = leituras; na raiz: `authz` (papéis e estados), `action-state` (retorno padrão das ações), `context`, `navigation`, `theme`, `*-constants` (listas e transições importáveis por Client Components). |
| `content/` | conteúdo publicado no site: `public.ts` (lê as projeções públicas), `media.ts` (URLs do proxy de mídia com larguras), `markdown.ts` (Markdown restrito), `videos.ts` (oEmbed do YouTube). |
| `files/` | Google Drive: `drive.ts` (API REST), `google-oauth.ts`, `drive-connection.ts`, `drive-folders.ts`, `upload.ts`, `import.ts`, `sniff.ts` (tipo por magic bytes), `proxy.ts` (servir bytes), `drive-guard.ts`, `drive-errors.ts`. |
| `crm/` | lado público do CRM: formulário "Tenho um desafio" (validação e envio). |
| `curriculum/` | grafo de pré-requisitos do fluxograma. |
| `mail/` | modelos PT/EN, provedor (Resend via fetch) e entrega da fila `mail_outbox`. |
| `observability/` | logs JSON com redação de segredos, sink de erros por webhook, relatório do navegador. |

**Não colocar em `lib`:** JSX (vai para `components`), textos de interface (vão
para `i18n`), dados estáticos (vão para `src/content`).

## `src/content`: conteúdo estático tipado

Sem I/O de rede; importável em qualquer lugar.

| Arquivo | O que é |
|---|---|
| `curriculums.ts` | tipos e carga das matrizes (`content/curriculum/*.json`). |
| `labs.ts`, `capabilities.ts` | laboratórios (de `content/labs.json`) e o mapa capacidade → laboratório. |
| `quarantine.ts` | decisão editorial por seção (`isSectionVisible`, `sectionStatus`), lê `content/editorial-inventory.json`. |
| `staging.ts` | textos herdados do protótipo, só exibidos sob quarentena. |
| `videos.ts` | IDs dos Shorts do YouTube. |

Diferença entre as três "content": `content/` (raiz) = arquivos de dados;
`src/content/` = acesso tipado a eles e conteúdo fixo; `src/lib/content/` =
leitura em tempo de execução do que o Portal publicou.

## `src/i18n`

`config.ts` (idiomas, prefixo de rota, negociação), `dictionaries/{pt,en}.ts`
(todos os textos de interface, mesmas chaves nos dois), `format.ts` (datas no fuso
do curso, números, listas), `metadata.ts` (título, canonical, hreflang, OG).

## `public/`

Servido na raiz do domínio com a mesma URL. Renomear quebra links externos.

- `brand/efm-logo-lockup.png`: logo oficial (cabeçalho, OG).
- `empresas/*.png`: logos de empresas (bloco em quarentena até haver autorização de marca).
- `grades/grade<ano>.pdf`: PDFs oficiais (fonte do fluxograma e botão "baixar grade").
- `grades/fluxo<ano>.html`: fluxogramas HTML do protótipo, mantidos como fallback documental (testados por `tests/helpers/routes.ts`).

Fotos de projetos, experiências e capas **não** entram aqui: ficam no Google Drive
e são cadastradas pelo Portal.

## `scripts/`

| Script | Uso |
|---|---|
| `curriculum_from_pdf.py` | regenera `content/curriculum/*.json` dos PDFs (`pip install pypdf`). |
| `labs_from_pdf.py` | regenera `content/labs.json` do portfólio em `referencias_ferro/`. |
| `content-inventory-report.mjs` | `npm run content:report` → `docs/content/inventario-editorial.md`. |
| `db-push.mjs` | `npm run db:push` / `db:types` contra a nuvem. |
| `db-types-local.mjs` | `npm run db:types:local` → `src/types/database.ts` via Postgres embutido. |
| `google-env.mjs` | `npm run google:env`: copia Client ID/secret de `secrets/` para `.env.local`. |
| `create-test-user.mjs` | cria usuário de teste do e2e e grava credenciais em `.env.local`. |

Scripts avulsos de sessão (`/_*.mjs` na raiz) são ignorados pelo git e não fazem
parte do projeto.

## Arquivos locais (não versionados)

`.env.local` (variáveis reais), `secrets/` (JSON do OAuth do Google), `.next/`,
`test-results/`, `docs/baseline/screenshots/`, `supabase/.temp/`,
`tsconfig.tsbuildinfo`, `next-env.d.ts`. Todos estão no `.gitignore`.

## ONDE COLOCO UM NOVO...?

| Novo... | Vai em |
|---|---|
| Botão, campo, modal, badge genérico | `src/components/ui/` (confira antes se já existe; `Button` tem variantes e tamanhos) |
| Componente específico de Projeto no site | `src/components/public/projects/` |
| Componente específico de Projeto ou Missão no Portal | `src/components/portal/projects/` |
| Componente de Pessoa no Portal | `src/components/portal/people/` |
| Componente ligado ao Drive/arquivos no Portal | `src/components/portal/files/` |
| Componente usado por várias páginas públicas | `src/components/public/` (raiz) |
| Seção de uma página pública específica | `src/components/public/<página>/` (ex.: `home/HomeSections.tsx`) |
| Página pública | `src/app/(public)/[locale]/<rota>/page.tsx` + textos em `pt.ts` e `en.ts` + `publicPageMetadata` + rota em `tests/helpers/routes.ts` |
| Tela do Portal | `src/app/(portal)/portal/<rota>/page.tsx` + item em `lib/portal/navigation.ts` (com `requires` se restrita) + rota em `tests/helpers/routes.ts` |
| Mutação no Portal | Server Action em `src/lib/portal/actions/<domínio>.ts`, devolvendo `ActionState` |
| Consulta Supabase do Portal | `src/lib/portal/queries/<domínio>.ts` |
| Consulta pública (site) | `src/lib/content/public.ts`, sempre por view/função pública |
| Regra de acesso | nova migration em `supabase/migrations/` + teste em `tests/rls/`; espelho para a UI em `lib/portal/authz.ts` |
| Tabela ou coluna | nova migration + `npm run db:types:local` para atualizar `src/types/database.ts` |
| Integração externa | `src/lib/<integração>/` (servidor), env só no servidor, nome em `.env.example` |
| Tipo compartilhado | junto do módulo dono (ex.: `lib/portal/queries/projects.ts`); tipos do banco vêm de `src/types/database.ts` |
| Lista/transição usada por Client Component | `src/lib/portal/<domínio>-constants.ts` |
| Texto de interface | `src/i18n/dictionaries/pt.ts` **e** `en.ts` |
| Formatação de data/número | `src/i18n/format.ts` |
| Conteúdo institucional fixo | `content/editorial-inventory.json` (com fonte) e o texto no dicionário; sem fonte, `[CONTEÚDO PENDENTE]` |
| Imagem do site (foto real) | Google Drive, cadastrada em Portal → Arquivos; capa da Home/Curso em Configurações |
| Ícone ou logo fixo da interface | `public/brand/` (ou SVG inline no componente) |
| Token de cor | `src/app/globals.css` (claro e escuro) + par no teste de contraste; se for de um componente só, CSS próprio importado por ele |
| Animação | `src/components/public/motion/` (sempre com reduced motion) |
| Script de manutenção | `scripts/` + entrada em `package.json` se for recorrente |
| Teste de regra pura | `tests/unit/` |
| Teste de política do banco | `tests/rls/` |
| Teste de tela | `tests/e2e/` |
| Relatório de etapa | `docs/baseline/<ID>-relatorio.md` |
| Decisão ou pendência institucional | `PLANO_DESENVOLVIMENTO_CLAUDE/33_DECISOES_E_CONFLITOS_ENCONTRADOS.md` |
| Referência visual, mockup, documento de origem | `referencias_ferro/` |
