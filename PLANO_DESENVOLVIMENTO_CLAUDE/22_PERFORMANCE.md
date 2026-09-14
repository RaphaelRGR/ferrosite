# Performance

## Baseline observada

MP4 de hero ~35 MB; logos PNG ~828 KB; imagens remotas sem pipeline; Home com muitos Client Components, listeners, observers e GSAP; middleware cobre quase todo site; Portal vazio não permite medir escala real.

## Budgets iniciais (validar por baseline)

- LCP p75 ≤2,5 s, INP p75 ≤200 ms, CLS p75 ≤0,1 em móvel real.
- JS inicial por rota pública: alvo ≤170 KB gzip; exceção documentada.
- imagem LCP: AVIF/WebP responsiva, alvo geralmente ≤250 KB.
- vídeo não bloqueia LCP; poster ≤200 KB; não baixar 35 MB automaticamente em mobile/economia de dados.
- nenhuma rota carrega coleção completa: cursor pagination; thumbnails antes de originais.
- Portal: interação comum responde visualmente <100 ms; consulta p95 alvo definido após massa de teste.

## Estratégia

Server Components e streaming; importar animação/gráfico/mapa sob demanda; remover GSAP onde CSS basta; centralizar registro; `next/image`/pipeline local; fontes com subset; cache com invalidação por publicação; agregações/indexes; prevenir N+1; virtualização apenas para listas grandes.

## Cenários de teste

Cold/warm, 4G lento, CPU limitada, sem cache, imagem/vídeo bloqueado, 1/100/10k registros, galeria grande, Kanban denso, troca de tema, fluxograma em resize. Lighthouse CI + Web Vitals reais; analisar bundle por rota.

Não declarar Portal rápido enquanto vazio. Performance é gate por fatia.
