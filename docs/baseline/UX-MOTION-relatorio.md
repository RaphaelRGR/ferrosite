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

## Complemento: Shorts do curso (2026-09-22)

A coordenação enviou 10 links de Shorts do canal do curso no YouTube e pediu que apareçam no site (Curso e onde fizer sentido), sempre sorteados para "parecer algo novo".

| Área | Implementação |
|---|---|
| Dados | `src/content/videos.ts`: só os 10 ids (fonte: mensagem da coordenação). Título e canal vêm do **oEmbed do YouTube** no servidor (`src/lib/content/videos.ts`, cache 1 dia, tolerante a falha): nenhum título inventado. |
| Componente | `ShortsStrip` (client): sorteio por semente no cliente depois da hidratação (`useSyncExternalStore`, sem mismatch; páginas continuam estáticas/ISR), esqueleto no HTML do servidor, cartões 9:16 com miniatura (`i.ytimg.com`, fallback `hqdefault`), botão "Assistir" com rótulo acessível, "Ver no YouTube" (`rel=noopener`), botão "Outros vídeos" refaz o sorteio. |
| Privacidade | Fachada: nada do YouTube carrega antes do clique; o player usa `youtube-nocookie.com`. Aviso visível: "O player do YouTube só carrega quando você clica em um vídeo." |
| CSP | `img-src` + `https://i.ytimg.com`; novo `frame-src https://www.youtube-nocookie.com` (antes `default-src 'self'` bloqueava qualquer iframe). |
| Onde | **Um vídeo por vez** (pedido da coordenação: vários ao mesmo tempo poluía): Home (após "Visitas técnicas e palestras realizadas") e Curso (após os pilares), texto à esquerda e cartão 9:16 à direita; "Outro vídeo" avança na ordem sorteada. Textos PT/EN em `dict.videos`. |
| Testes | `tests/e2e/shorts.spec.ts`: um cartão por página, zero requisições ao YouTube antes do clique, iframe só do nocookie após o clique, CSP publicada, "Outro vídeo" fecha o player e troca o vídeo. Suíte pública (axe, smoke, i18n, links, quarentena, headers, reduced-motion) verde. |

Limpeza pendente da seção anterior executada em modo Manual: os 2 PNGs de teste foram para a lixeira do Drive e 5 registros de teste saíram do banco.

## Complemento: um vídeo por vez e responsividade no celular (2026-09-22)

- **Shorts**: um vídeo por vez (Home e Curso), texto à esquerda e cartão 9:16 à direita; no celular, empilhado. Botões "Outro vídeo" e "Ver no YouTube" ficam **embaixo do vídeo** (pedido da coordenação), com o aviso de privacidade.
- **Rodapé**: no celular, marca em cima e as duas listas de navegação lado a lado (antes: uma coluna longa com metade da tela vazia); linha final com copyright à esquerda e a locomotiva à direita.
- **Selo "Conteúdo em verificação"**: no celular fica pendurado na borda superior do bloco (`-top-3`), sem cobrir o título; de `sm` em diante volta ao canto interno.
- **Cartões**: badge de categoria não estica mais (`self-start`); projetos/experiências sem capa não mostram retângulo vazio.
- **Botões empilhados** (hero da Home e do Curso, CTAs finais): largura total no celular, automática de `sm` em diante; CTA com padding menor no celular.
- **Artigos** (experiência, notícia, projeto): padding `p-5` no celular (`p-8`/`p-12` acima); experiências datadas pelo **evento** (não pela publicação), com o local; capa logo abaixo do título.
- **Curso**: rótulo "Grades oficiais (PDF)" em linha própria no celular.
- Auditoria feita com capturas segmentadas a 375 px de Home, Curso, Projetos, Experiências, Para Empresas, Notícias, Sobre, Laboratórios, Eventos e páginas de detalhe; sem overflow horizontal em nenhuma. Testes: axe 37/37, quarentena, shorts, experiências, smoke, hubs, i18n, reduced-motion verdes.
