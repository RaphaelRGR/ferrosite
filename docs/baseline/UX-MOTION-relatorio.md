# UX-MOTION: movimento leve, cartões clicáveis, lightbox e sem travessões (2026-09-22)

Pedido da coordenação: site mais dinâmico e leve (animações ao rolar e ao passar o mouse, vapor ferroviário, easter eggs), título/imagem dos cartões levando à experiência/projeto, ver as fotos inteiras, e remover todos os travessões ("—") do site.

## Entregue

| Área | Implementação |
|---|---|
| Movimento | `src/components/public/motion/motion.css` (importado em `globals.css`): revelação ao rolar (`data-reveal` / `data-reveal-group` com escalonamento por `:nth-child`), entrada em cascata do hero, parallax da foto do hero dirigido pelo scroll (`animation-timeline: view()`, só onde há suporte), elevação + zoom da mídia nos cartões (`.card-lift` / `.zoom-media`), barrinha de seção que "desenha" (`.rail-mark`), sublinhado deslizante no menu (`.link-rail`, só com mouse). Zero dependências. |
| Sem JS / a11y | `MotionProvider` (um `IntersectionObserver` + `MutationObserver`) só marca `html.js-motion` quando existe e o usuário não pediu movimento reduzido: sem JS nada fica escondido; `prefers-reduced-motion: reduce` desliga tudo (teste `reduced-motion.spec.ts` continua verde). A revelação usa a propriedade `translate` para compor com o `transform` do hover. |
| Vapor e locomotiva | `Locomotive.tsx`: silhueta SVG decorativa (`aria-hidden`) com puffs de vapor em CSS e rodas que giram ao passar o mouse; no rodapé de todas as páginas públicas. |
| Easter eggs | `EasterEggs.tsx`: digitar "trem"/"train" fora de campos, o código Konami ou 5 cliques no logotipo (3 s) fazem um trem cruzar a base da tela (6 s, sem som, `pointer-events: none`). |
| Cartões clicáveis | Experiências (Home e hub) e projetos (Home, hub): título vira `<h3><a>` com link esticado (`after:absolute after:inset-0`), cobrindo imagem e cartão inteiro; "Ver experiência →" passa a ser texto decorativo (um único destino por cartão, sem tab stops duplicados). |
| Lightbox | `PublishedGallery` (agora client): clique abre a foto inteira num `<dialog>` nativo (Esc, clique fora, ← → e botões; contador "n de N"; legenda + crédito). Sem JS o link continua abrindo a imagem. Novas chaves `published.lightbox` PT/EN. |
| Travessões | Removidos de todo texto visível: dicionários PT/EN (nome do site "· UFSC Joinville", campus "UFSC, Campus Joinville", placeholders "nenhum/none", intervalos "→"), staging, componentes, e-mails; conteúdo do banco (9 projetos, 8 experiências e publicações) reescrito por regra (par de travessões → parênteses; "X — CAFER" → "(CAFER)"; "Palestra: X — Y" → "Palestra X: Y"; " — e/mais/ou" → vírgula; demais → dois-pontos) e republicado pelo fluxo normal (rascunho → revisão → aprovação → publicação). Comentários de código mantêm travessões (não são site). |
| Produção | `SITE_URL` cai para `VERCEL_PROJECT_PRODUCTION_URL` quando `NEXT_PUBLIC_SITE_URL` não está definida (canonical/sitemap/robots não apontam mais para localhost); `getDriveClient` só exige `GOOGLE_CLIENT_*` na renovação (token válido no banco serve). |

## Validação

`npm run lint` 0/0 · typecheck · unit 177/177 · build · e2e (`experiences`, `quarantine`, `public-hubs`, `drive-upload`, `a11y`, `reduced-motion` e suíte completa). Verificado no navegador (1280 e 375 px): revelação ao rolar, hover com elevação/zoom, trem do easter egg, vapor animado, lightbox com navegação e sem overflow horizontal.

## Cuidados

- `drive-upload.spec` passa a **criar o próprio projeto de teste** (`projeto-e2e-…`, interno) quando o slug configurado não existe; antes, com a fixture purgada, o formulário caía no primeiro projeto real e o teste enviou dois PNGs para `projetos/cavalos-de-ferro/documentos` no Drive institucional. Esses dois arquivos (e as linhas `file_asset` correspondentes) ainda precisam ser removidos por script (bloqueado em modo automático).
- Cada rodada e2e volta a criar fixtures no banco e uma pasta `projetos/projeto-e2e-…` no Drive: decisão pendente de um projeto Supabase separado para testes.
