# BASE-002 — Quarentena editorial

Data: 2026-09-14 · Depende de BASE-001 (inventário de rotas) e I18N-001 (locale do selo)

## O que foi feito

1. **Inventário** — `content/editorial-inventory.json`: **90 entradas em 31 seções**, extraídas do código (não de mockups), com o registro mínimo do doc 35: `content_id`, tipo, valor PT, valor EN, fonte, URL, owner, status, `verified_at`, próxima revisão, classificação, consentimento/licença, decisão e notas. Toda entrada nasce `UNVERIFIED`; `VERIFIED` exige fonte primária + owner + `verified_at` (validado por teste). Relatório legível: `docs/content/inventario-editorial.md` (`npm run content:report`).
2. **Marcação em runtime** — `src/content/quarantine.ts` + `<UnverifiedContent section="…">` ([src/components/content/UnverifiedContent.tsx](../../src/components/content/UnverifiedContent.tsx)) envolvendo **26 seções com rota** (Home 10, Curso 4, Sobre 4, Visitas 4, Eventos 4, Notícias 4). Política:
   - `review` (default): renderiza com selo visível **"Conteúdo em verificação"** (ícone + texto; `title` e texto `sr-only` explicam), `data-content-status="unverified"` e `data-content-section`.
   - `strict` (`NEXT_PUBLIC_CONTENT_MODE=strict`, inlined no build): conteúdo não verificado **não é renderizado**.
   - `VERIFIED` (todas as entradas da seção com `decision: confirmar`): sem selo. `DISCARDED`/`descartar`: nunca renderiza.
3. **Texto preservado como evidência** — nenhum componente teve copy alterada; a quarentena é uma camada por cima. Componentes sem consumidor (`MetricsSection`, `AboutHistory`, `AboutPillars`) foram inventariados como `unused.*` (contêm as variantes conflitantes "3 de 3 cursos no Brasil" e "fundação 2014").
4. **Testes** — unit (+8): ids únicos, tipos/status/decisões válidos, `VERIFIED` exige fonte/owner/data, toda seção marcada existe no inventário **e toda seção inventariada com rota está marcada no código** (impede afirmação nova sem selo), pessoas/logos exigem consentimento antes de `VERIFIED`, política de renderização. E2E (+8): contagem de selos por rota (10/4/4/4/4/4), `/en` só com o hero marcado (editorial já pendente), selo com explicação acessível.

## Por que `review` é o default (decisão a confirmar)

O aceite pede "nenhuma métrica/notícia/parceria/data pública sem `verified_at`/fonte". Duas leituras: ocultar ou marcar. Escolhi **marcar por default** porque (a) não existe deploy de produção antes do gate de F5 (`29`); (b) o selo visível já impede que o conteúdo seja lido como fato; (c) ocultar tudo deixaria o protótipo vazio para revisão editorial — exatamente o trabalho que este inventário destrava. `strict` existe e é testado na unidade; para publicação real, basta `NEXT_PUBLIC_CONTENT_MODE=strict` no build (ou mudar o default aqui quando houver ambiente de produção).

## Conflitos factuais consolidados (para decisão do owner editorial)

| Tema | Variantes no código | Onde |
|---|---|---|
| Pioneirismo | "único de Santa Catarina" · "Único no Brasil" · "primeiro do Sul do Brasil" · "1º curso focado…" · "3 de 3 cursos no Brasil" | Hero/About, CursoHero, AboutPillars, Numbers, MetricsSection |
| Data de criação | 04/08/2009 (REUNI) · 2014 · "15 anos (desde 2009)" | StoryJourney, AboutHistory, Numbers |
| Investimento | R$ 600 bi (manifesto, HowItWorks) · R$ 103 bi "Novo PAC" (Numbers) | Home |
| Relações com empresas | "parceiras", "destinos de egressos", "patrocínio da Rumo", "parcerias estratégicas com ANTT/DNIT" | Companies, Partners, NewsGrid, HowItWorks |
| CREA | "dupla atribuição", "sem restrições", lista de atribuições | CourseCrea |
| Dados pessoais | Marcos Imhof (primeiro engenheiro ferroviário do país), Raphael Garcia (Editor Chefe) | StoryJourney, NewsFeatured |
| Eventos/visitas/notícias 2022–2026 | 4 eventos, 8 visitas, 7 notícias, 1 calendário | Events*, Visits*, News* |
| Imagens | vídeo do hero, 6 imagens Unsplash como registro documental, 7 logos sem autorização | Hero, Innovation, Visits, PastEvents, Companies |

## Validação

`npm run lint` 0/0 · `npm run typecheck` ok · `npm test` **78/78** · `npm run build` 25 páginas · `npm run test:e2e` **102/102** (crawler de links passou a 300 s de timeout: 19 rotas) · visual: selo no topo-direito das seções, canto inferior-esquerdo nos heros (não colide com a Navbar).

## Impactos

- Copy móvel: selo tem 11 px, cabe em 360 px; posição absoluta não altera o layout das seções.
- PT/EN: selo e explicação vêm do catálogo (`quarantine.*`).
- Temas: cores por token (`warning`/`surface`) — legível no shell escuro; nas seções claras (Numbers, Innovation) aparece como pill escura.
- Segurança/privacidade: dados pessoais e logos só saem da quarentena com consentimento/licença registrados (teste).

## Pendências

- **Owner editorial**: cada uma das 90 linhas precisa de confirmar/corrigir/descartar com fonte (pergunta 1 do doc 33).
- Conteúdo aprovado por locale alimenta as traduções EN (I18N) e a projeção pública (PUB-001); este JSON é o staging até existir o modelo de conteúdo (20/18).
- `NEXT_PUBLIC_CONTENT_MODE=strict` no pipeline de produção quando existir.
- Affordances falsas listadas como `cta` (filtros, paginação, newsletter, "Ver Edital", "Inscrever Equipe") → PUBLIC-002.
