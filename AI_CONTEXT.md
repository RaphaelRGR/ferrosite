# AI_CONTEXT: contexto para Claude, Codex e outras IAs

Leia este arquivo inteiro antes de alterar o projeto. Ele diz o que o sistema é,
o que não pode quebrar e onde está cada coisa. Detalhes: `docs/ARCHITECTURE.md`
(como funciona), `docs/PROJECT_STRUCTURE.md` (onde colocar cada coisa) e
`docs/CONVENTIONS.md` (como escrever).

## 1. O que é

Site público (PT/EN) + Portal interno do curso de **Engenharia Ferroviária e
Metroviária da UFSC Joinville**. Em produção em https://engferroviaria.vercel.app
(deploy automático do branch `main` na Vercel).

- **Site público** (`/pt/...`, `/en/...`): curso, fluxograma curricular, projetos,
  experiências (visitas técnicas), notícias, eventos, laboratórios, para empresas,
  sobre, privacidade.
- **Portal** (`/portal/...`, só PT): projetos, equipes e missões, pessoas, empresas
  e desafios (CRM), conteúdos (redação → revisão → aprovação → publicação),
  arquivos (Google Drive), relatórios, configurações.

Stack: Next.js 16 (App Router, Turbopack; **não é o Next que você conhece**, ver
`AGENTS.md`), React 19, TypeScript estrito, Tailwind 4, Supabase (Auth + Postgres
com RLS), Google Drive (arquivos), Vercel. Sem ORM, sem biblioteca de UI, sem SDK
de terceiros além do Supabase.

## 2. O que NÃO pode quebrar

1. **Fluxograma curricular interativo** (página Curso, seção "A jornada técnica"):
   matrizes **2025, 2016 e 2012**, pré-requisitos, seleção, teclado, modal de
   disciplina, visão lista. Dados em `content/curriculum/<ano>.json`, **gerados**
   dos PDFs oficiais por `scripts/curriculum_from_pdf.py`; nunca editar à mão.
   `content/curriculum/legacy-prototype.ts` é insumo do gerador (categorias e as
   arestas da grade 2012, que o PDF não traz): não apagar.
2. **Autorização no servidor/banco.** RLS e triggers do Supabase são a autoridade;
   `lib/portal/authz.ts` só espelha regras para a UI. Esconder botão não é controle.
3. **Quarentena editorial.** Conteúdo herdado sem fonte só aparece com selo em modo
   `review`; em produção (`strict`) nem vai para o HTML. Nada institucional é
   inventado: lacunas ficam como `[CONTEÚDO PENDENTE]`.
4. **Sem dados pessoais/contatos publicados.** O site lê só projeções públicas
   aprovadas (`public_publication`, `public_project`, `public_site_image`...).
5. **PT e EN com conteúdo próprio.** EN nunca mostra PT como fallback silencioso;
   sem tradução, a seção aparece como pendente.
6. **Tema claro/escuro do Portal** (cookie + preferência no banco, sem flash).
7. **Google Drive**: OAuth serve SÓ para autorizar o Drive; login do Portal é do
   Supabase. Segredos nunca no código, logs, docs ou navegador.
8. **Service role** só no servidor (`lib/supabase/admin.ts`). Nunca em Client Component.
9. **Texto visível do site sem travessão "—"** (use dois-pontos, vírgula, parênteses,
   "·" ou "→"). Comentários de código podem usar.
10. **Vídeos (Shorts): um por vez**, com "Outro vídeo"/"Ver no YouTube" abaixo do vídeo.

## 3. Mapa rápido

| Preciso de... | Está em |
|---|---|
| Páginas do site público | `src/app/(public)/[locale]/**/page.tsx` |
| Páginas do Portal | `src/app/(portal)/portal/**/page.tsx` |
| Login | `src/app/(auth)/login` + `src/lib/auth` |
| APIs (callback, Drive OAuth, mídia, e-mail, saúde) | `src/app/api/**/route.ts` |
| Imagem de compartilhamento (OG) | `src/app/og/[locale]/route.tsx` |
| Roteamento por idioma + guard do Portal | `src/proxy.ts` (ex-middleware) |
| Componentes genéricos (botão, campo, diálogo) | `src/components/ui` |
| Shell do site (html, cabeçalho, rodapé) | `src/components/layout` |
| Selo de quarentena / "em validação" | `src/components/editorial` |
| Componentes do site por domínio | `src/components/public/<domínio>` |
| Componentes do Portal por domínio | `src/components/portal/<domínio>` |
| Server Actions do Portal (mutações) | `src/lib/portal/actions/*.ts` |
| Consultas do Portal (leituras) | `src/lib/portal/queries/*.ts` |
| Regras de papel e estados | `src/lib/portal/authz.ts` (espelho das migrations) |
| Leitura do conteúdo publicado no site | `src/lib/content/public.ts` |
| Google Drive | `src/lib/files/*` + `docs/GOOGLE_DRIVE_INTEGRATION.md` |
| Clientes Supabase | `src/lib/supabase/{server,middleware,public,admin,env}.ts` |
| Textos PT/EN | `src/i18n/dictionaries/{pt,en}.ts` |
| Datas e números | `src/i18n/format.ts` |
| Conteúdo estático tipado (currículo, labs, staging) | `src/content/*.ts` |
| Dados brutos (JSON gerados, inventário editorial) | `content/` (raiz) |
| Schema, RLS, triggers | `supabase/migrations/*.sql` (fonte única do banco) |
| Tipos do banco | `src/types/database.ts` (gerado; `npm run db:types:local`) |
| Tokens de cor e tema | `src/app/globals.css` |
| Testes | `tests/{unit,rls,e2e,integration}` |

## 4. Domínios

| Domínio | Site público | Portal | Banco (principais tabelas) |
|---|---|---|---|
| Curso e currículo | `/curso` (fluxograma) | não | nenhum (JSON estático) |
| Laboratórios | `/laboratorios` | não | nenhum (`content/labs.json`, gerado do portfólio PDF) |
| Projetos, equipes, missões | `/projetos` | `/portal/projetos/**` | `project`, `project_membership`, `mission*` |
| Pessoas e papéis | não | `/portal/pessoas` | `profile` (`global_role`) |
| Empresas e desafios (CRM) | `/para-empresas` (+ formulário) | `/portal/empresas`, `/portal/desafios` | `organization`, `research_challenge`, `relationship_activity` |
| Conteúdo e publicação | `/noticias`, `/eventos`, `/experiencias` | `/portal/conteudos/**` | `content_item`, `content_revision`, `approval_request`, `publication` |
| Arquivos (Drive) | fotos via `/api/midia/[id]` | `/portal/arquivos/**` | `file_asset`, `content_file`, `project_file`, `drive_*`, `site_image` |
| Relatórios | não | `/portal/relatorios` | `report_snapshot`, `compute_indicators()` |
| E-mail | não | Configurações | `mail_outbox` (fila por trigger) |
| Auditoria | não | não (append-only) | `audit_event`, `activity_event`, `crm_event` |

## 5. Site público

- Rotas sempre com prefixo de idioma; o `proxy.ts` redireciona `/curso` → `/pt/curso`
  (cookie > Accept-Language > pt).
- Conteúdo vem de três fontes, nesta ordem de confiança:
  1. **Publicado** pelo Portal (Supabase, projeção pública) → sempre exibido;
  2. **Verificado** (`content/editorial-inventory.json` com fonte/responsável/data);
  3. **Staging** herdado do protótipo (`src/content/staging.ts`) → só em `review`,
     com selo "Conteúdo em verificação".
- Modo editorial: `NEXT_PUBLIC_CONTENT_MODE` (`next.config.ts`): `strict` na
  produção da Vercel, `review` em preview/local/CI. Decisão por seção em
  `src/content/quarantine.ts` (`isSectionVisible`, `sectionStatus`).
- Imagens do acervo passam pelo proxy `/api/midia/[id]?w=<largura>` (larguras em
  `src/lib/content/media.ts`); nunca link direto do Drive.
- Animações leves em `src/components/public/motion` (respeitam reduced motion).

## 6. Portal

- Guard em camadas: `proxy.ts` (sem sessão → `/login`; sem Supabase → 503) →
  `src/app/(portal)/layout.tsx` + `AccessGate` (perfil **ativo**) → RLS.
- Papéis globais (`global_role`): `admin`, `coordination` (juntos = "overseer"),
  `advisor`, `member`, `external`, `viewer`. Papéis por projeto: `leader`,
  `member`, `viewer`, `external`. Menu por papel em `src/lib/portal/navigation.ts`.
- Mutação = Server Action em `lib/portal/actions/<domínio>.ts`, que devolve
  `ActionState` (`lib/portal/action-state.ts`) exibido por `ActionFeedback`.
- Publicação: rascunho → revisão → aprovação (por outra pessoa com papel de
  aprovação) → publicado (`publish_content()` gera o snapshot público). Estados
  guardados por trigger; o espelho está em `lib/portal/content-constants.ts`.
- `/portal/questoes` é placeholder por decisão pendente; `/portal/acervo` redireciona
  para Arquivos (links antigos). Não remover sem decisão.

## 7. Supabase

- Clientes: `server.ts` (sessão do usuário, Server Components/Actions),
  `middleware.ts` (renova sessão no proxy), `public.ts` (anônimo, só projeções
  públicas), `admin.ts` (service role, só servidor), `env.ts` (config pública).
- **Migrations são a fonte da verdade**: nova regra de acesso = nova migration +
  teste em `tests/rls`. Não alterar migrations já aplicadas; criar outra.
- `npm run test:rls` aplica as migrations reais num Postgres embutido (sem nuvem).
- `npm run db:push` aplica na nuvem (usa `SUPABASE_DB_URL`, pooler IPv4).

## 8. Google Drive

- Conexão institucional por OAuth (Configurações → Integrações), guardada cifrada
  em `drive_integration` (linha única). Fallback opcional: conta de serviço
  somente leitura. Tudo em `src/lib/files`; guia completo em
  `docs/GOOGLE_DRIVE_INTEGRATION.md`.
- O Portal guarda **metadados**; os bytes ficam no Drive e são servidos por proxy
  autenticado (Portal) ou por `/api/midia` (só arquivos públicos, verificados e
  com consentimento).
- Upload: tipo provado por magic bytes (`sniff.ts`), subpasta por entidade.
- Nunca importar as pastas `SENHAS` e `LIXEIRA` do Drive humano.

## 9. PT/EN e tema

- Dicionários tipados `src/i18n/dictionaries/{pt,en}.ts` (EN deve ter as mesmas
  chaves; `tests/unit/i18n.test.ts` verifica). Config em `src/i18n/config.ts`,
  metadata/canonical/hreflang em `src/i18n/metadata.ts`.
- Portal usa `getDictionary("pt")`: EN do Portal é decisão pendente.
- Tokens de cor em `src/app/globals.css` (`:root`/`[data-theme]`), contraste AA
  verificado por `tests/unit/tokens-contrast.test.ts`. Site público é claro; o
  Portal alterna por `data-theme` no `<html>` (`lib/portal/theme.ts`,
  `components/portal/shell/ThemeToggle.tsx`). Nunca duplicar componente por tema.
- Turbopack pode manter um `globals.css` antigo em cache: token novo de um
  componente vai num CSS próprio importado por ele (ex.:
  `components/public/projects/project-categories.css`).

## 10. Pastas que não são código

- `referencias_ferro/`: **fonte de referência** (mockups, identidade, portfólio de
  laboratórios em PDF, guia de redesign). Não apagar nem reorganizar.
- `PLANO_DESENVOLVIMENTO_CLAUDE/`: plano do produto e decisões. `33_DECISOES_...md`
  registra conflitos e pendências institucionais; `01_AUDITORIA...md` recebe
  adendos a cada etapa. Preservar.
- `docs/baseline/`: um relatório por etapa entregue (histórico; não reescrever).

## 11. Como validar

```bash
npm run lint        # ~5 min no Windows; --max-warnings 0
npm run typecheck
npm test            # unit (Vitest)
npm run test:rls    # RLS em Postgres embutido
npm run build
npm run test:e2e    # Playwright em next start :3100 (exige build)
```

- O e2e roda contra o Supabase real de `.env.local` e cria fixtures; o formulário
  de desafio tem limite de 5 envios/h por origem (falha legítima se repetir muito).
- `next dev` recria o bloco do `AGENTS.md`; isso é esperado.
- Arquivos com CRLF e LF misturados: preserve o final de linha ao editar por script.

## 12. Fluxo de trabalho esperado

Cada entrega: código + testes + `docs/baseline/<ID>-relatorio.md` + adendos em
`PLANO_DESENVOLVIMENTO_CLAUDE/01_*.md` e `33_*.md` quando houver decisão, commit
descritivo e push para `main` (que publica na Vercel). Itens incertos da limpeza
estão em `docs/CLEANUP_PENDING.md`.
