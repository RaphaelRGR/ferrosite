# BASE-001 — Relatório de baseline reproduzível

Data: 2026-09-14 · Branch: `main` · Node 24.16.0 / npm 11.13.0 · Windows 11

Objetivo: provar o estado do protótipo com pipeline verde, sem alterar visual nem dados curriculares. Este documento é a evidência exigida por `30_BACKLOG_CLAUDE_CODE.md` (BASE-001) e `29_ROADMAP` (F0).

## 1. Resultado por comando

| Comando | Antes | Depois |
|---|---|---|
| `npm audit --omit=dev` | 5 vulnerabilidades (1 crítica, 3 altas, 1 moderada) | **0** |
| `npm audit` (inclui dev) | 9 | **0** |
| `npm run lint` | 11 erros / 14 avisos | **0 / 0** (agora com `--max-warnings 0`) |
| `npm run typecheck` | passa | passa |
| `npm test` (Vitest) | inexistente | **29 testes** passam |
| `npm run build` | passa (15 páginas) | passa (15 páginas, Next 16.3.5) |
| `npm run test:e2e` (Playwright) | inexistente | **24 testes** passam |
| `npm run baseline:screenshots` | inexistente | 44 capturas (11 rotas × 4 viewports) |

Tempo observado: lint ~5 min nesta máquina (Windows + antivírus); build ~30 s; e2e ~40 s; screenshots ~2 min.

## 2. Dependências

| Pacote | De | Para | Motivo |
|---|---|---|---|
| `next` | 16.2.4 | 16.3.5 (exato) | 24 advisories, incluindo RCE crítico (GHSA-p293-qw3h-jr36) e bypass de middleware |
| `eslint-config-next` | 16.2.4 | 16.3.5 | acompanhar o Next |
| `@types/node` | ^20 | ^24 | alinhar ao runtime real (Node 24) e exigência do vitest 5 |
| transitivas (`postcss`, `sharp`, `nanoid`, `baseline-browser-mapping`, `brace-expansion`, `js-yaml`, `browserslist`, `@babel/core`) | vulneráveis | corrigidas via `npm audit fix` sem `--force` | apenas atualizações semver-compatíveis |

Novas devDependencies (não entram no bundle):

| Pacote | Versão | Licença | Problema que resolve | Alternativa descartada |
|---|---|---|---|---|
| `vitest` | 5.0.0 | MIT | testes unitários TS com alias `@/`; base para testes de componente futuros (`27`) | `node:test` — sem alias `@/`, sem ecossistema para React |
| `@playwright/test` | 1.63.0 | Apache-2.0 | smoke, crawler de links, reduced motion, screenshots; `31` exige teste Playwright específico para reduced motion | Cypress — mais pesado, sem API de `request` integrada; Puppeteer — sem runner |

`engines.node >=20.9.0` e `.nvmrc` = `24`.

## 3. Correções de lint (sem mudança visual)

| Arquivo | Diagnóstico | Correção |
|---|---|---|
| `src/components/layout/Navbar.tsx` | `react-hooks/set-state-in-effect` | fechar menus ao navegar usando ajuste de estado durante o render (padrão do react.dev) em vez de `useEffect` |
| `src/components/sections/CoursePillars.tsx` | `prefer-const` ×2, `STAIRS` não usado | `const`; constante morta removida |
| `src/components/sections/EventsHero.tsx` | `react-hooks/purity` ×2 (`Math.random` no render) | 20 posições determinísticas (mulberry32 com seed fixa) — também elimina o risco de hydration mismatch apontado na auditoria |
| `src/components/ui/CurriculumFlowchart.tsx` | `no-explicit-any` ×2 | interface `FlowLine`; nenhuma lógica alterada |
| `src/types/{database,events,news,visits}.ts` | `no-empty-object-type` ×4 | `Record<string, never>` (placeholder estrito; impede uso acidental) |
| `CourseCrea`, `NewsNewsletter`, `VisitsHero`, `NumbersSection`, `HowItWorksSection` | imports/variáveis mortos | removidos |
| `FeaturedEvent`, `NewsFeatured`, `NewsGrid`, `PastEventsGallery` | `ScrollTrigger` importado e "não usado" | **registrado explicitamente** (`gsap.registerPlugin`) — ver §5.1 |
| `src/components/sections/InnovationSection.tsx` | `@next/next/no-img-element` | `eslint-disable-next-line` com justificativa (imagem remota placeholder; migra em PUBLIC-001) |

Política de avisos adotada: `lint` roda com `--max-warnings 0`; um aviso só permanece com disable inline e comentário do porquê/quando sai.

## 4. Testes criados

### 4.1 Invariantes das matrizes — `tests/unit/curriculum-invariants.test.ts`

Para cada matriz (2025, 2016, 2012): dez fases 1..10; contagem do snapshot (60/15, 61/15, 61/6 obrigatórias/optativas); IDs únicos; id/nome/categoria/carga válidos; todo pré-requisito existe; sem auto-referência; grafo acíclico; obrigatória→optativa e pré-requisito na mesma fase limitados às **exceções conhecidas** (o teste falha se surgir uma nova ou se uma conhecida sumir sem atualizar a lista).

### 4.2 E2E — `tests/e2e/`

- `smoke.spec.ts`: 11 rotas HTML respondem 200, têm `h1` e não geram `pageerror`/`console.error`; 3 HTMLs + 3 PDFs das grades continuam servidos; 404 renderiza; `/api/auth/callback` redireciona incondicionalmente (stub documentado); `/portal` aberto a anônimo (estado conhecido).
- `links.spec.ts` + `known-broken-links.json`: crawler de `a[href]` internos em todas as rotas; verifica status e fragmentos. Falha se o conjunto de quebrados diferir da lista conhecida.
- `reduced-motion.spec.ts`: manifesto e jornada com `opacity: 1` sob `prefers-reduced-motion: reduce`; guarda do caminho animado normal. **Validado**: com o `return` antecipado original reinserido, os dois testes falham com `0` e `0.2`.

### 4.3 Baseline visual — `tests/baseline/screenshots.spec.ts`

`docs/baseline/screenshots/<rota>__<w>x<h>.png` em 375×812, 768×1024, 1366×768, 1440×900 (viewports de `27`). Página rolada até o fim antes da captura; `animations: "disabled"`. Vídeo do hero e seção "pinned" da jornada variam entre execuções — é referência para olho humano, não diff pixel a pixel. Pasta ignorada no Git por padrão (15 MB).

## 5. Mudanças de comportamento (além de lint)

### 5.1 Registro do ScrollTrigger em `/eventos` e `/noticias`

Confirmado empiricamente (dev server + Playwright) que em carregamento direto dessas rotas o console emitia `Invalid property scrollTrigger … Missing plugin? gsap.registerPlugin()`: as animações disparavam no mount, ignorando o scroll. Após navegar a partir da Home (que registra o plugin) o comportamento mudava. Em ESM o GSAP não define `window.gsap`, portanto o import isolado nunca registra o plugin. Com o registro explícito, o comportamento passa a ser determinístico e igual ao que o código já pretendia. É o item P1-5 da auditoria.

### 5.2 Reduced motion (`ManifestoSection`, `HowItWorksSection`)

Com a preferência ativa, o conteúdo agora fica imediatamente visível (palavras com `opacity: 1`; etapas com classe `is-active`). Sem a preferência nada muda. Adicionados `data-testid="manifesto-heading"` e `data-testid="journey-step-content"` para os testes não dependerem de copy.

## 6. Achados novos (não estavam na auditoria)

1. **Matriz 2012 — pré-requisito na mesma fase**: `EMB5605` (Eletrônica de Potência, fase 6) declara `EMB5116` (Eletrônica Analógica, fase 6). O HTML legado `fluxo2012.html` traz o mesmo dado (é cópia, não fonte independente). Em 2016 a mesma disciplina está nas optativas. `[CONTEÚDO PENDENTE]` — validar contra o PDF oficial em FLOW-001; registrado como exceção conhecida no teste.
2. **Matriz 2016 — slots `OPT-1..OPT-4`** ("Optativa Obrigatória I–IV") aparecem entre as obrigatórias (fases 8–9). São slots, não disciplinas; a contagem "61" os inclui. Decidir modelagem em FLOW-001.
3. **Matriz 2016 — `EMB5635` (optativa) depende de `EMB5113` (optativa)**: válido, apenas registrado.
4. **`not-found.tsx` não tem `h1`** (usa `h2`): viola o critério global de `31` (heading principal por página). Não alterado (design da 404 é TODO no próprio arquivo).
5. **`networkidle` nunca ocorre na Home**: o `hero.mp4` (~35 MB) mantém a rede ocupada; os testes usam `load`. Reforça o item de performance/vídeo de `22`/`31`.
6. **Lint lento** (~5 min) neste ambiente Windows; não é defeito do projeto, mas afeta o ciclo local.

Confirmados como descritos na auditoria: `EMB5512→EMB5107` (2012, optativa não renderizada); 4 links `/projetos/*` inexistentes; fragmento `/#portal` órfão; callback stub; Portal sem autenticação; `middleware` depreciado (Next sugere `proxy`; fica para AUTH-002).

## 7. Inventário de links internos quebrados

| Origem | Link | Situação |
|---|---|---|
| Navbar (dropdown + menu mobile), todas as rotas | `/projetos/comunica-ferro`, `/projetos/cavalos-de-ferro`, `/projetos/ferro-lab`, `/projetos/extensao` | 404 — rotas não existem (PUBLIC-002) |
| HeroSection (CTA primário da Home) | `#portal` | fragmento sem alvo na página (a Home tem apenas `id="curso"`) |

Controles com affordance e sem ação (inventário verificado no código; não corrigidos nesta tarefa):

| Arquivo | Controle | Estado |
|---|---|---|
| `Navbar.tsx` | botão "Projetos" (desktop) | só abre no hover; sem `onClick`/teclado |
| `Navbar.tsx` | "IG" / "LK" no menu mobile | `div` sem link |
| `EventsGrid.tsx:96` | botões de filtro | sem handler |
| `FeaturedEvent.tsx:69` | botão de inscrição do evento em destaque | sem handler |
| `NewsGrid.tsx:85-86` | setas de paginação ← → | sem handler |
| `NewsGrid.tsx:118` | "Carregar mais notícias" | sem handler |
| `NewsNewsletter.tsx` | formulário de newsletter | `onSubmit` só cancela; sem label/name/required |
| `VisitsSchedule.tsx:88` | "Ver Edital de Seleção" | sem handler |
| `HeroSection.tsx:100` | CTA primário `#portal` | fragmento inexistente |

Tratados em PUBLIC-002/BASE-002.

## 8. Riscos remanescentes

- Segurança: Portal aberto, callback stub, middleware fail-open sem env — inalterados por escopo (AUTH-001/002/003).
- Conteúdo: todos os números/parcerias/notícias continuam hard-coded e sem fonte (BASE-002).
- Dados curriculares: dois casos `[CONTEÚDO PENDENTE]` (§6.1 e EMB5512→EMB5107) só se resolvem com a fonte canônica (FLOW-001).
- `referencias_ferro/` e `PLANO_DESENVOLVIMENTO_CLAUDE/` continuam **não rastreados** no Git.
- Baseline visual não é comparação automática; regressões visuais dependem de revisão humana até haver tokens/estabilidade (DS-001).

## 9. Como reproduzir

```bash
npm ci
npx playwright install chromium
npm run check
npm run baseline:screenshots
```
