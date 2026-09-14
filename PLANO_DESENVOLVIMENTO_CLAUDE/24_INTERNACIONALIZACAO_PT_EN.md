# Internacionalização PT/EN

## Escopo

Site público integral: UI, metadata, títulos, corpo, projetos, notícias, labs, formulários, mensagens/erros, datas e emails. Portal: fundação traduzível desde o início; decisão pendente se todo conteúdo operacional exige EN no primeiro release.

## Rotas e SEO

Locale explícito, troca preserva rota/item/filtros, canonical e `hreflang`, sitemap por locale, OG localizado. Não misturar idiomas nem redirecionar agressivamente por navegador depois que o usuário escolheu.

## Conteúdo

UI em catálogos tipados; conteúdo editorial em registros de tradução com status/completude independente. Nunca usar PT como fallback invisível em página EN publicada; mostrar indisponibilidade ou impedir publicação conforme política.

## Formatação

`Intl` para data/hora/número/moeda/lista/plural; armazenar UTC e timezone; não concatenar frases; tradução de status separada da chave persistida. Slugs localizados têm mapa e redirects permanentes.

## Workflow

Rascunho PT/EN → revisão linguística/técnica → aprovação por locale → publicação. Registrar fonte, tradutor/revisor e versão. Nomes oficiais/siglas não são traduzidos arbitrariamente.

## Testes

Cobertura de chaves; ausência de strings de UI hard-coded; expansão de texto; acentos; URLs; troca no mesmo item; formulário/erro/email; metadata; datas/timezone; screenshot móvel. Pseudo-locale é recomendado para detectar clipping.
