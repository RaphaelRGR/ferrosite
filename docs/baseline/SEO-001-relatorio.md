# SEO-001: imagem de compartilhamento (OG) (2026-09-22)

## Problema

O site declarava `og:title`, `og:description`, canonical e hreflang, mas **nenhuma imagem**: compartilhar qualquer link no WhatsApp, LinkedIn ou Slack mostrava um cartão sem foto (critério de aceitação "canonical/hreflang/sitemap/OG corretos", spec 04; spec 25 pedia IMG-002 para isso).

## Entregue

| Área | Implementação |
|---|---|
| Cartão institucional | `GET /og/<locale>` gera 1200x630 PNG com `next/og`: logotipo oficial, "UFSC JOINVILLE", Centro Tecnológico de Joinville, nome do curso e a frase do catálogo do locale (PT/EN) — nada inventado. Cache de 1 h com revalidação de 1 dia. Locale desconhecido responde 404. |
| Foto real quando existe | Home (foto institucional `home_hero`), experiência, notícia, evento e projeto publicados usam a **própria capa** em `?w=1280` como `og:image`, com `og:image:alt` do acervo. |
| Metadata | `publicPageMetadata` ganhou `image` opcional e passou a emitir `og:image` (+ `twitter:card=summary_large_image` e `twitter:image`) em todas as páginas públicas. Sem capa, cai no cartão do locale. |
| Rota | O cartão é uma rota (`/og/[locale]`) e não `opengraph-image.tsx` porque cada página define seu próprio bloco `openGraph`, e metadata de segmento filho **substitui** a do pai (regra de merge do Next): a URL precisa ser estável para entrar no helper. `/og` entrou na lista de caminhos sem prefixo de locale no proxy. |
| robots | `Allow: /api/midia/` antes do `Disallow: /api`: a foto que representa a página não fica bloqueada para quem respeita robots.txt ao buscar o `og:image`. |

## Testes

`tests/e2e/og.spec.ts` (novo): nas 9 páginas públicas amostradas, `og:image` é absoluta e **responde 200 com content-type de imagem**; `twitter:card` presente; o cartão tem 1200x630 reais (lidos do cabeçalho PNG) em PT e EN; locale inválido dá 404; Home e experiência usam a própria foto com `alt`; robots libera `/api/midia/`.

Validação: lint 0/0 · typecheck · unit 182 · build · e2e **291/291**.

## Fica para depois

- Cartão usa a fonte padrão do `next/og` (não a Geist do site): embutir a fonte exigiria carregar o arquivo no runtime da imagem.
- Páginas de laboratório, eventos e notícias sem capa continuam no cartão institucional — quando houver foto autorizada, passam a usar a própria.
