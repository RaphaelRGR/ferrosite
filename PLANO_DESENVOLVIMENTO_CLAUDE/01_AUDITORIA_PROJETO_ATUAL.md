# Auditoria do projeto atual

## Escopo percorrido

Foram inventariados todos os arquivos rastreados, todo `src/`, `public/`, os três HTML/PDF de grade e todo `referencias_ferro/`: 13 PNGs, o guia mestre e o portfólio de laboratórios de 13 páginas. Não há `AGENTS.md`. O README ainda é o padrão do Create Next App.

## Stack e estrutura real

- Next.js `16.2.4`, React `19.2.4`, TypeScript `strict`, App Router, Tailwind 4.
- Supabase SSR/JS instalado, mas sem schema, migrations, tipos reais ou uso funcional.
- GSAP `3.15.0`; 17 módulos o importam e 36 arquivos são Client Components.
- Scripts existentes: `dev`, `build`, `start`, `lint`. Não há `test`, `typecheck`, E2E ou CI.
- `public/` tem cerca de 36 MB; `public/videos/hero.mp4` sozinho tem ~35 MB.

## Rotas

| Rota | Estado atual | Problema | Ação |
|---|---|---|---|
| `/` | Home escura, estática, 11 seções | conteúdo não validado; CTA `#portal` morto | migrar por seções após fundações |
| `/curso` | hero, pilares, CREA, fluxograma | alegações absolutas; fluxo pouco adaptável | preservar grafo e refazer apresentação |
| `/sobre` | história/identidade/pesquisa | narrativa sem fonte e contradições | revisão editorial; possivelmente absorver em Curso/Comunidade |
| `/visitas` | hero, números, galeria, agenda | dados fictícios/placeholder; botões sem ação | evoluir para Experiências |
| `/eventos` | hero, destaque, grid, galeria | filtros e inscrição falsos; `Math.random` no render | criar conteúdo real/rotas/dados |
| `/noticias` | hero, destaque, grid, newsletter | notícias e paginação falsas; form cancela submit | hub + detalhe + workflow editorial |
| `/simuladores` | título/TODO | rota sem produto definido | decidir manter/ocultar |
| `/portal` | título/TODO | sem auth, shell ou dados | substituir após fundação segura |
| `/portal/projetos` | título/TODO | sem função | criar em fatia vertical |
| `/portal/questoes` | título/TODO | domínio não definido | decisão pendente, não remover às cegas |
| `/portal/acervo` | título/TODO | Drive/arquivos ausentes | implementar após política de dados |
| `/api/auth/callback` | redirect incondicional | OAuth não funciona | `exchangeCodeForSession`, erro e redirect seguro |

Rotas anunciadas e inexistentes: todos os `/projetos/*` do dropdown, além de hub/detalhes de Projetos, Experiências, Comunidade/Pessoas, Empresas, P&D, Laboratórios, Parceiros, Oportunidades e Contato.

## Funcionalidades existentes importantes

- Navbar responsiva com auto-hide, dropdown e menu mobile.
- Vídeo de hero e animações de entrada/scroll.
- Carrossel de logos.
- Página do curso composta por seções.
- Fluxograma curricular com três anos, 60/61/61 disciplinas principais, IDs únicos e pré-requisitos existentes.
- Modal de disciplina e dados tipados básicos.
- HTMLs legados das grades com tema/impressão e PDFs oficiais/auxiliares como fallback documental.
- Metadados básicos por rota e páginas globais de loading/error/404.

## Achados priorizados

### P0 — segurança e confiança

1. `src/lib/supabase/middleware.ts` chama `getUser()` e ignora o retorno; nunca bloqueia anônimo.
2. Falta configuração causa comportamento fail-open.
3. `src/app/api/auth/callback/route.ts` não troca código por sessão.
4. Não há login/logout, papéis, membership por projeto, RLS, Storage policy ou teste de isolamento.
5. Conteúdo institucional possivelmente fictício aparece como fato: R$ 600 bi, R$ 103 bi, 30 mil km, 15+ projetos, 48 visitas, 1,2 mil alunos, três países, datas/eventos/notícias e alegações CREA.
6. `npm audit` encontrou 5 vulnerabilidades em dependências de produção: 1 crítica, 3 altas e 1 moderada. O pacote direto `next@16.2.4` é reportado como crítico e o audit indica correção semver-compatible em `16.3.5`. O audit completo, incluindo desenvolvimento, soma 9 (1 crítica, 6 altas, 1 moderada, 1 baixa).

### P1 — arquitetura/UX

1. `src/app/layout.tsx` monta Navbar/footer públicos em todas as rotas, inclusive Portal; há `<main>` aninhados.
2. Navbar tem 340 linhas e mistura dados, desktop, mobile, dropdown, animação e scroll.
3. Navegação duplicada em `Navbar.tsx` e `src/lib/constants.ts` (o segundo está morto).
4. Dados editoriais estão em componentes, impedindo PT/EN, aprovação e reuso.
5. Cinco componentes usam `scrollTrigger` sem registrar o plugin localmente; comportamento depende de efeitos colaterais.
6. `EventsHero` usa `Math.random()` durante render, arriscando hydration mismatch.
7. `CoursePillars` possui lógicas de scroll concorrentes para limpar e ativar estado.
8. `#E84E1B` aparece centenas de vezes; não existem tokens semânticos.
9. Filtros, botões, paginação, cards e formulário exibem affordance sem ação.

### P1 — acessibilidade/performance

- Fluxograma usa `div` clicável sem teclado/foco; modal não tem semântica, trap, Escape ou devolução de foco.
- Em `ManifestoSection`, a preferência `prefers-reduced-motion: reduce` interrompe o efeito, mas as palavras continuam com `opacity: 0`: conteúdo principal desaparece. Em `HowItWorksSection`, o retorno antecipado mantém conteúdo esmaecido. Tratar como falha P0 de acesso a conteúdo.
- Dropdown desktop é orientado a hover; menu mobile não gerencia foco/Escape/scroll.
- `AnimatedSection`, marquee e várias animações não respeitam movimento reduzido.
- Form newsletter não tem label/nome/required/consentimento/feedback.
- Estado é frequentemente comunicado só por cor.
- MP4 não tem poster, preload controlado ou variantes; imagens remotas não têm pipeline editorial.
- Home hidrata e observa muito conteúdo estático.

## Código morto, duplicado e placeholder

- Sem consumidor: `AboutHistory.tsx`, `AboutPillars.tsx`, `MetricsSection.tsx`, `constants.ts`, `seo.ts`, `utils.ts`.
- Tipos vazios: `src/types/database.ts`, `events.ts`, `news.ts`, `visits.ts`.
- Assets padrão Next (`next.svg`, `vercel.svg`, etc.) e `.gitkeep` obsoletos.
- `logo-icon.png` e `images/about/hero-bg.png` não usados.
- Imports mortos de `Image`, GSAP e AnimatedSection.
- `public/grades/fluxo*.html` duplicam dados e lógica de `src/data/curriculums.ts`; manter até paridade comprovada.
- `optativas` estão nos dados, mas não aparecem no componente React.

## Matriz de ação

| Classe | Decisão baseada no código real |
|---|---|
| PRESERVAR | Next App Router, TS strict, composição por seções, dados das três matrizes sob validação, interação disciplina/relações/modal, PDFs de grade como fallback, logo oficial |
| MELHORAR | Navbar, SEO, estados globais, imagens, performance, acessibilidade, fluxo curricular, conteúdo com fonte |
| REFATORAR | shells, fronteiras server/client, animações, tokens, dados editoriais, módulo curricular, factories Supabase tipados |
| SUBSTITUIR | Portal placeholder, auth stub, formulários/filtros falsos, emoji como marca, direção escura pública |
| REMOVER | código/imports/assets mortos somente após teste de paridade e revisão de conteúdo |
| CRIAR | páginas faltantes, i18n, dual theme, schema/migrations/RLS, workflow editorial, testes/CI/observabilidade |

## Estado da validação executável

- `npm ci --prefer-offline --no-audit --no-fund`: **passou**, 365 pacotes instalados em aproximadamente 3 minutos.
- `npx tsc --noEmit`: **passou** sem diagnóstico.
- `npm run build`: **passou**, compilação e geração estática de 15 páginas concluídas. O build confirmou 7 páginas públicas, 4 páginas do Portal e o callback dinâmico.
- O build emitiu aviso de que a convenção `middleware` está depreciada no Next 16 e deve migrar para `proxy` de modo planejado.
- `npm run lint`: **falhou com 25 diagnósticos: 11 erros e 14 avisos**.
- `npm audit --omit=dev`: **falhou**, 5 vulnerabilidades (1 crítica/3 altas/1 moderada). `npm audit`: 9 no total.

Erros confirmados: `setState` síncrono em effect da Navbar; dois `prefer-const`; duas chamadas impuras a `Math.random()` no render; dois `any` explícitos no fluxograma; quatro tipos/interfaces placeholder vazios. Avisos incluem imports/constantes mortos e `<img>` sem otimização. `BASE-001` deve levar lint a zero erro e registrar a política de warnings antes de alteração visual.

## Estado após BASE-001 (2026-09-14)

Relatório completo: `docs/baseline/BASE-001-relatorio.md`.

- `next`/`eslint-config-next` 16.2.4 → 16.3.5; `npm audit` e `npm audit --omit=dev`: **0 vulnerabilidades**.
- `npm run lint` (`--max-warnings 0`): **0 erros / 0 avisos**. Política: aviso só permanece com disable inline justificado.
- Novos scripts: `typecheck`, `test` (Vitest, 29 invariantes das três matrizes), `test:e2e` (Playwright, 24 testes: smoke, links, reduced motion), `baseline:screenshots`, `check`. CI mínimo em `.github/workflows/ci.yml`.
- Confirmado empiricamente o P1-5: em carregamento direto de `/eventos` e `/noticias` o GSAP avisava `Missing plugin? gsap.registerPlugin()`; o plugin agora é registrado explicitamente nesses componentes.
- Reduced motion em `ManifestoSection`/`HowItWorksSection` corrigido (conteúdo visível) e coberto por teste que comprovadamente falha na versão anterior.
- Achados novos: matriz 2012 tem pré-requisito na mesma fase (`EMB5605`→`EMB5116`, `[CONTEÚDO PENDENTE]` para FLOW-001); matriz 2016 contém slots `OPT-1..4` entre as obrigatórias; `not-found.tsx` não tem `h1`; a Home nunca atinge `networkidle` por causa do `hero.mp4` (~35 MB).
- Inalterados por escopo: Portal aberto, callback stub, `middleware` depreciado (Next sugere `proxy`), conteúdo hard-coded, links `/projetos/*` e `#portal` (listados em `tests/e2e/known-broken-links.json`).

## Estado após ARCH-001 (2026-09-14)

Relatório: `docs/baseline/ARCH-001-relatorio.md`. Root layout mínimo; `(public)` com `PublicShell` (skip link, Navbar, `main#conteudo`, footer); `(portal)` com shell próprio, `data-theme` fixo e ponto marcado para o guard de AUTH-002. `<main>` aninhados eliminados em todas as rotas; P1-1 resolvido. URLs e visual público inalterados; Portal passa a base neutra clara. Smoke: 46 testes.

## Estado após DS-001 (2026-09-14)

Relatório: `docs/baseline/DS-001-relatorio.md`. Tokens semânticos com temas claro/escuro em `globals.css` (contraste AA verificado por teste; laranja `#E84E1B` reservado a acento — 3,78:1 com branco — e ações usam `#D3420F`); primitivos `Button`, `LinkButton`, `Badge`, `Input`, `Dialog`, `Skeleton`, `EmptyState`, `BrandLogo`; catálogo em `/design-system` (noindex); `SubjectModal` sobre `Dialog` acessível; emoji removido da Navbar e logo oficial no Portal/footer/menu mobile; axe sem violações sérias no catálogo e no Portal, baseline registrada nas rotas públicas legadas. Pendente da instituição: vetor, símbolo isolado e versão escura da marca.

## Estado após I18N-001 (2026-09-14)

Relatório: `docs/baseline/I18N-001-relatorio.md`. Site público sob `/pt` e `/en` (root layout por locale com `lang` real, `generateStaticParams`, canonical/hreflang/OG, sitemap e robots); URLs antigas redirecionam 307 por cookie → Accept-Language → pt; `middleware.ts` migrado para `proxy.ts`. Catálogos tipados em `src/i18n` (EN obrigado a cobrir todas as chaves), `Intl` para formatação, seletor PT/EN na Navbar. Em EN, conteúdo editorial não traduzido aparece como indisponibilidade explícita (não há PT como fallback). Portal segue sem prefixo até decisão de escopo. Unit 70, e2e 94.

## Estado após BASE-002 (2026-09-14)

Relatório: `docs/baseline/BASE-002-relatorio.md`. Inventário editorial em `content/editorial-inventory.json` (90 entradas, 31 seções, todas UNVERIFIED; relatório em `docs/content/inventario-editorial.md`). 26 seções públicas envolvidas por `<UnverifiedContent>`: em modo review exibem selo "Conteúdo em verificação"; em `NEXT_PUBLIC_CONTENT_MODE=strict` não renderizam. Texto original preservado como evidência. Testes impedem seção inventariada sem selo e VERIFIED sem fonte/owner/data. Pendente: decisão confirmar/corrigir/descartar por linha pelo owner editorial.

## Estado após AUTH-001/002 (2026-09-14)

Relatório: `docs/baseline/AUTH-001-002-relatorio.md`. Migration `supabase/migrations/20260914000100_identity_and_core.sql` com profile/papéis/membership/project/mission/audit e RLS em todas as tabelas; guard fail-closed no proxy (503 sem config, 307 para /login sem sessão), login por senha/link mágico sem auto-cadastro, callback com `exchangeCodeForSession`, logout, gate por perfil ativo no layout do Portal. P0 1–4 e 6 da auditoria resolvidos no código. Pendente: aplicar migrations no projeto Supabase (senha do banco), gerar tipos, rodar testes de isolamento e o e2e autenticado.

## Estado após PORTAL-001 (2026-09-15)

Relatório: `docs/baseline/PORTAL-001-relatorio.md`. Shell do Portal com sidebar/drawer/header, tema persistente sem flash, navegação por permissão, 404 própria e páginas honestas (sem KPIs fictícios). Harness de RLS em Postgres embutido valida as migrations reais (13 cenários). E2E autenticado real contra o Supabase (login/logout/tema).

## Estado após PUBLIC-001 (2026-09-15)

Relatório: `docs/baseline/PUBLIC-001-relatorio.md`. Site público claro com header/footer novos, Home e Curso refeitos na direção das referências, hub/detalhe de projetos (links 404 eliminados), `/visitas`→`/experiencias`, staging tipado sob quarentena, token `text-link`. Axe estrito nas páginas novas; e2e 121.

## Estado após FLOW-001/002 (2026-09-15)

Relatório: `docs/baseline/FLOW-001-002-relatorio.md`. Currículos gerados dos PDFs oficiais (content/curriculum/*.json com sha256), divergências do protótipo corrigidas com fonte (2025: +2 atividades e 4 pré-requisitos; 2016: +EMB5103 e pré-requisitos; ementas oficiais), 2012 sem pré-requisitos no PDF (arestas legadas marcadas). Explorador novo: claro, teclado/toque, ancestrais + dependentes, optativas, zoom/fase, lista, URL, diálogo acessível, axe estrito. Unit 103, e2e 128.

## Estado após PUBLIC-002 (2026-09-15)

Relatório: `docs/baseline/PUBLIC-002-relatorio.md`. Experiências (filtro por URL, detalhes, inscrição honesta), Notícias (sem paginação/newsletter falsas, sem autor inventado), Eventos (agenda vazia até validação), Sobre (sem dados pessoais) e Simuladores refeitos no shell claro; nenhuma página pública tem botão sem ação; axe estrito em todas as rotas públicas; 16 seções legadas sem consumidor. Bug de política da quarentena (entrada descartada escondia a seção) corrigido. e2e 164.

## Estado após LAB-001 (2026-09-15)

Relatório: `docs/baseline/LAB-001-relatorio.md`. Portfólio de laboratórios extraído para `content/labs.json` (sha256; sem contatos), 14 labs (11 detalhados, Robótica marcada como duplicata do LabDSE, 3 só índice), taxonomia de 20 capacidades com relação administrada e níveis descrita/potencial/pendente, hub `/laboratorios` por capacidade (URL), 28 páginas de laboratório, `/para-empresas` sem formulário nem e-mail até CRM-001. Unit 113, e2e 222.

## Estado após AUTH-003 / PORTAL-002 / PORTAL-003 (2026-09-15)

Relatório: `docs/baseline/AUTH-003-PORTAL-002-003-relatorio.md`. Migration 2 com máquinas de estado de projeto/missão no servidor, histórico de negócio separado da auditoria, checklist/comentários, guardas (responsável ∈ equipe; remoção exige reatribuir), busca de perfil com escopo e tipos gerados localmente. Portal: CRUD de projetos com busca/filtro/paginação por URL, equipe (papel/prazo/externo), missões em lista/Kanban/calendário com transição por botões, detalhe com checklist/comentários/histórico, página Pessoas. Unit 122, RLS 28, e2e 228.

## Estado após CRM-001 (2026-09-15)

Relatório: `docs/baseline/CRM-001-relatorio.md`. Migration 3: organização/contato/interação, pipeline com motivo e histórico, desafio com protocolo e cadeia de triagem, envio público só por service role com limites e auditoria sem PII. Site: formulário 'Tenho um desafio' (PT/EN) com consentimento, honeypot, tempo mínimo e confirmação por protocolo. Portal: Empresas e Desafios (triagem com labs relacionados por capacidade). Unit 127, RLS 36, e2e 243.

## Estado após FILE-001 / PUB-001 (2026-09-15)

Relatório: `docs/baseline/FILE-001-PUB-001-relatorio.md`. Migrations 4 e 5: file_asset com allowlist/consentimento/vínculos explícitos; conteúdo com revisões imutáveis, aprovação por terceiro, publicação como snapshot em projeção pública (view para anon), rollback, despublicação, preview por token e Markdown restrito. Site lê só a projeção (notícias/eventos). Portal: Conteúdos e Arquivos. Unit 132, RLS 45, e2e 250.

## Estado após REPORT-001 (2026-09-15)

Relatório: `docs/baseline/REPORT-001-relatorio.md`. Migration 6: `compute_indicators` (fórmula única, timezone declarado, `null` sem fonte), `report_snapshot` imutável/auditado; `/portal/relatorios` com período por URL, snapshot e exportação CSV auditada; Início do Portal com widgets por perfil. Unit 132, RLS 49, e2e 251.

## Estado após OPS-001 (2026-09-15)

Relatório: `docs/baseline/OPS-001-relatorio.md`. CSP e cabeçalhos de segurança, logs JSON com redação, instrumentation (onRequestError), health endpoint, error boundaries estruturados e runbook (`docs/ops/runbook.md`). Unit 135, e2e 253.

## Estado após CLEAN-001 (2026-09-15)

Relatório: `docs/baseline/CLEAN-001-relatorio.md`. Legado sem consumidor removido (33 seções, Navbar, CurriculumFlowchart, SubjectModal, tipos órfãos, gsap, mídia do protótipo sem licença, assets do template, .gitkeep); grades legadas, `curriculums.legacy.ts`, logos sob quarentena e registros do inventário preservados; `/portal/acervo` → `/portal/arquivos`; `/portal/questoes` honesto (decisão pendente). README reescrito. Todas as etapas do backlog (30) estão concluídas em commits locais; pendências institucionais listadas em 33.

## Estado após MAIL-001 (2026-09-17)

Relatório: `docs/baseline/MAIL-001-relatorio.md`. Migration 7: `mail_outbox` enfileirada por triggers (desafio recebido, revisão pedida, decisão, publicação, ingresso em equipe), reserva/baixa só pelo service role; entrega pós-resposta e por cron; provedor Resend via `fetch`; templates PT/EN; painel em Configurações (admin) com envio manual auditado; `/api/health` expõe `mailConfigured`. Unit 144, RLS 54, e2e 261. Aplicada na nuvem (pooler IPv4).

## Estado após DRIVE-001 (2026-09-21)

Relatório: `docs/baseline/DRIVE-001-relatorio.md`. Migration 8: verificação auditada (`verified_by`, reversão ao trocar o id), `publication.cover_file_id` na projeção, `public_file_info` (service role). Cliente Drive por conta de serviço via REST (sem SDK), verificação no Portal, original/miniatura por proxy autenticado e auditado, capa pública por `/api/midia/[id]` só para publicação viva com consentimento. Unit 153, RLS 58. Aplicada na nuvem.

## Estado após OPS-002 (2026-09-21)

Relatório: `docs/baseline/OPS-002-relatorio.md`. Sink de erros por webhook genérico (`ERROR_SINK_URL/TOKEN/LEVEL`), encaminhamento automático de `error`/`warn` do log estruturado com limite e contadores; `POST /api/telemetry` para erros do navegador (contrato validado, limite por origem hasheada); Configurações → Observabilidade (admin) com evento de teste auditado; `/api/health` expõe `errorSinkConfigured`. Unit 160. Sem migration.

## Estado após DRIVE-002 (2026-09-21)

Relatório: `docs/baseline/DRIVE-002-relatorio.md` e guia `docs/GOOGLE_DRIVE_INTEGRATION.md`. Migration 9: `drive_integration` (linha única, só service role, tokens cifrados) + `drive_integration_status()` sem tokens. OAuth 2.0 (state + PKCE, troca e refresh no servidor, revogação) com escopo `drive.readonly`; Configurações → Integrações (admin/coordenação; 403 nas rotas para os demais) com conectar/testar/pasta/desconectar auditados; cliente Drive passa a aceitar origem de token injetável (OAuth → conta de serviço). Unit 170, RLS 61. Aplicada na nuvem.

## Estado após DRIVE-003 (2026-09-21)

Relatório: `docs/baseline/DRIVE-003-relatorio.md`. Migration 10: allowlist com `uploadable`/`extension` (CAD e Office entram; ZIP/vídeo não), `file_asset.storage_path/drive_folder_id`, `drive_folder` (cache + trava), auditoria `file.uploaded`. Escopo `drive.file` adicionado; upload servidor→Drive com magic bytes, estrutura por entidade sob demanda, `/portal/arquivos/enviar` e `POST /portal/arquivos/upload`. Unit 177, RLS 64; e2e com upload real. Aplicada na nuvem; Drive institucional conectado com escrita, raiz `FERROSITE - (NÃO MEXER!)`.

## Estado após DRIVE-004 (2026-09-21)

Relatório: `docs/baseline/DRIVE-004-relatorio.md`. Migration 11: `content_file` (galeria de conteúdo), `publication.gallery_file_ids` (snapshot só com consentimento), `public_gallery`, `public_file_info` aceita galeria. `experience` ganha página pública (`/experiencias/<slug>`) com galeria pelo proxy; Portal ganha Galeria no conteúdo e **Importar do Drive** (idempotente, por lotes). 8 experiências reais criadas a partir dos relatórios do Drive (visitas FTC, RUMO, Metrô-SP; palestras Lanfranco, VIBTECH, RUMO; Dia do Ferroviário 2025/2026) com fotos importadas para as galerias (internas, consentimento pendente). RLS 67.

## Estado após publicação DRIVE-004 + PROJ-001 (2026-09-21)

8 experiências **publicadas** com capa e galeria (72 fotos públicas, consentimento registrado por autorização da coordenação); Home com foto institucional (`site_image.home_hero`, migration 12) e seção "Visitas técnicas e palestras realizadas"; 9 projetos reais cadastrados e públicos (`public_project`, migrations 13–14) em `/projetos`, `/projetos/<slug>` e na Home. Fixtures E2E purgadas do banco e do Drive. Nuvem com 14 migrations. Unit 177 · RLS 70 · e2e 274.

## Estado após UX-MOTION (2026-09-22)

Relatório: `docs/baseline/UX-MOTION-relatorio.md`. Site em produção na Vercel (`engferroviaria.vercel.app`, deploy automático do `main`). Movimento leve sem dependências (revelação ao rolar, hover, parallax, vapor/locomotiva, easter eggs), cartões inteiramente clicáveis, lightbox nativo na galeria, travessões removidos de todo texto visível (código e banco). `SITE_URL` usa o domínio da Vercel como fallback.

## Estado após PERF-001 (2026-09-22)

Relatório: `docs/baseline/PERF-001-relatorio.md`. O proxy público passou a servir miniaturas por largura (`/api/midia/[id]?w=`), com `srcset`/`sizes` em hero, cartões, capas e galeria: a Home caiu de 9,4 MB para ~0,4 MB de imagens e a página da visita à RUMO de 96 MB para ~1,1 MB no celular. Orçamento protegido por teste e2e (`media.spec.ts`).

## Estado após SEO-001 (2026-09-22)

Relatório: `docs/baseline/SEO-001-relatorio.md`. Todas as páginas públicas passaram a ter imagem de compartilhamento: cartão institucional gerado em `/og/<locale>` (1200x630, PT/EN) e, onde há capa publicada, a própria foto em `?w=1280`. `twitter:card` e `og:image:alt` incluídos; robots libera `/api/midia/`.

## Estado após EDIT-001 (2026-09-26)

Relatório: `docs/baseline/EDIT-001-relatorio.md`. Produção na Vercel passou a `strict` (conteúdo não verificado não aparece nem vai no código-fonte); fluxograma, grades e laboratórios verificados pela coordenação; bloco duplicado de experiências saiu da Home; Sobre e Notícias mostram "Em validação" quando não há conteúdo liberado.

## Estado após DESIGN-B (2026-09-26)

Relatório: `docs/baseline/DESIGN-B-relatorio.md`. Hub de Experiências em cartões com foto, agrupados por ano, com filtros de tipo e ano na URL; capa padrão da marca para experiência sem foto; metadados em "tipo · data" com local em linha própria; CTA de notícias só com notícia publicada.

## Estado após DESIGN-C (2026-09-26)

Relatório: `docs/baseline/DESIGN-C-relatorio.md`. Projetos com cor, ícone e capa ilustrada por categoria (tokens com contraste AA testado); hero do Curso com foto institucional (`site_image.course_hero`); seção de vídeo compacta; fundos alternados na Home. Auditoria de design de 2026-09-25: Blocos A, B e C concluídos.

## Estado após CLEAN-002 (2026-09-26)

Relatório: `docs/CLEANUP_REPORT.md`. Limpeza sem mudança de comportamento: código sem uso removido (`AnimatedSection`, `lib/constants.ts`, cliente Supabase de browser, CSS do marquee, exports órfãos); datas no fuso do curso centralizadas em `i18n/format.ts`; `src/data` → `src/content`; componentes por domínio (`components/editorial`, `public/{curriculum,projects,experiences}`, `portal/{shell,projects,content,files,crm,settings,people,reports}`); `lib/portal/queries` ao lado de `lib/portal/actions`. Documentação de entrada: `AI_CONTEXT.md`, `docs/PROJECT_STRUCTURE.md`, `docs/ARCHITECTURE.md`, `docs/CONVENTIONS.md`. Itens incertos em `docs/CLEANUP_PENDING.md`.
