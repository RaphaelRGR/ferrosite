# PUBLIC-002 — Experiências, Notícias, Eventos, Sobre e Simuladores (claros e honestos)

Data: 2026-09-15 · Fase F5 · Depende de PUBLIC-001, BASE-002

## Entregue

| Rota | Antes | Agora |
|---|---|---|
| `/experiencias` (ex-`/visitas`) | hero escuro, números fictícios, galeria Unsplash, botões "Ver Relatório"/"Ver Edital" sem destino | hub claro com **filtro Brasil/Internacional como estado de URL** (funciona sem JS, `aria-current`), contagem `aria-live`, timelines "Realizadas"/"Próximas" (staging, quarentena), bloco de inscrição **honesto** ("não há período aberto"), detalhe por experiência com pendências explícitas |
| `/experiencias/[id]` | — | 6 páginas pré-renderizadas (destino, data, resumo; roteiro/galeria pendentes) |
| `/noticias` | grid com paginação e "Carregar mais" sem ação, newsletter que cancelava o submit, "Editor Chefe" nomeado | hub com 3 itens (quarentena), **sem paginação falsa**, newsletter substituída por texto de pendência (sem provedor/consentimento), detalhe **sem autor inventado** |
| `/noticias/[id]` | — | 3 páginas pré-renderizadas com corpo pendente |
| `/eventos` | 4 eventos 2026, filtros e "Inscrever equipe" falsos, galeria Unsplash | **agenda vazia e honesta** (04: "não publicar os eventos 2026 até validação"); CTA para Experiências; eventos do protótipo só no inventário |
| `/sobre` | narrativa escura com nome de pessoa, prêmios e datas | linha do tempo **sem dados pessoais**, identidade (missão/visão/valores) e linhas de pesquisa — tudo do staging, com selos |
| `/simuladores` | título/TODO | página honesta, `noindex`, mantida até a decisão de `33` |

- `src/content/staging.ts` ganhou `HISTORY` (nome de pessoa removido), `IDENTITY`, `RESEARCH_LINES`; inventário com **112 entradas em 50 seções**; 16 seções legadas marcadas "sem consumidor" (componentes preservados para CLEAN-001).
- **Bug de política corrigido**: uma entrada `DISCARDED` escondia a seção inteira (`sectionStatus`); agora entradas descartadas saem do cálculo e a seção só some se todas forem descartadas. Coberto por teste.
- Sitemap inclui `/noticias`; `/visitas` continua redirecionando.

## Validação

`npm run lint` 0/0 · `npm run typecheck` ok · `npm test` 103/103 · build 43 páginas · `npm run test:e2e` **164/164**: novo `public-hubs.spec` (filtro por URL e ausência de formulário, detalhe de experiência, eventos vazio sem botões, notícias sem paginação/newsletter/autor, sobre sem nomes, e **varredura de botões sem handler** em 7 rotas); axe estrito agora em **todas** as rotas públicas (PT e EN); quarentena por rota recontada.

## Decisões

1. Eventos não publica nada até validação (doc 04), mesmo em modo review — o único caso em que a quarentena não basta.
2. Newsletter e inscrições: texto de indisponibilidade em vez de formulário (04: "só entra com provedor, consentimento… ").
3. Dados pessoais (nome de egresso, "Editor Chefe") não aparecem em nenhuma página nova; permanecem no inventário como `person` sem consentimento.
4. Sem mapa em Experiências até existirem coordenadas/dados aprovados (08: mapa sempre com lista equivalente — a lista já é a experiência principal).

## Pendências

- Conteúdo real por locale via projeção aprovada (PUB-001) — detalhes de projetos/experiências/notícias continuam pendentes.
- Comunidade e Para Empresas (LAB-001/CRM-001) ainda não existem e por isso não entram no menu.
- Componentes legados de `src/components/sections/*` sem consumidor → CLEAN-001.
