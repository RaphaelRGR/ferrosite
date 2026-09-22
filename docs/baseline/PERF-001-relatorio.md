# PERF-001: fotos do Drive em miniatura responsiva (2026-09-22)

## Problema medido

Auditoria das specs (22 "Performance" e critério de aceitação "galeria pagina/lazy-load e **não carrega originais em massa**") mostrou que o proxy público `/api/midia/[id]` devolvia o arquivo cru do Drive em qualquer contexto. Medição em produção com celular emulado (375 px), somando `encodedBodySize`:

| Página | Antes | Depois (medido em dev) |
|---|---|---|
| Home | 9.455 KB · capa de 1,98 MB | **408 KB em imagens** · maior 182 KB |
| Experiência RUMO (28 fotos) | 96.001 KB · fotos de até 3,2 MB | **1.088 KB em imagens** · maior 109 KB |

## Entregue

| Área | Implementação |
|---|---|
| Rota | `/api/midia/[id]?w=<largura>` devolve a miniatura do Drive naquela largura; sem `w`, o original. A largura vem de uma lista fixa (240, 320, 480, 640, 960, 1280, 1600) e qualquer outra responde 400 — não é um gerador aberto de variações. Mesma autorização de antes (`public_file_info`) e mesmo cache curto (5 min + revalidação), para que despublicar ou revogar consentimento continue sumindo em minutos. |
| Cliente Drive | `thumbnail()` passou a trocar o sufixo do `thumbnailLink` por `=w<largura>` (limita a **largura**, não o maior lado): o descritor `w` do `srcset` passa a corresponder ao pixel real. |
| Helpers | `src/lib/content/media.ts`: `mediaUrl`, `mediaSrcSet` e presets (`hero`, `card`, `article`, `thumb`, `full`) com `widths`/`sizes`/`fallback`. Um lugar só decide tamanho por contexto. |
| Consumo | As funções de conteúdo devolvem o **id do arquivo** (`publicCoverIds`, `publicCoverId`, `publicSiteImage.fileId`, `PublicGalleryItem.fileId`) e o componente monta `src`/`srcSet`/`sizes`. Hero, capas de cartão, capa do artigo, capa do projeto e grade da galeria usam miniatura; o original só existe atrás do clique — e mesmo o lightbox usa no máximo 1600 px. |
| Sem JS | O link da miniatura aponta para `?w=1600` (antes, para o arquivo inteiro). |

Exemplo da capa da Home (2.025.545 bytes no original): 240→21 KB, 480→58 KB, 640→109 KB, 960→242 KB, 1280→417 KB, 1600→635 KB. O `sizes` faz o celular pedir 480/640 e o desktop 960/1280.

## Testes

- `tests/unit/media.test.ts` (novo): presets só usam larguras aceitas pela rota, srcset com descritor correto, nenhum preset aponta para o original.
- `tests/unit/drive.test.ts`: miniatura troca o sufixo do `thumbnailLink` por `=w<largura>`.
- `tests/e2e/media.spec.ts` (novo): em `/pt`, `/pt/experiencias/<slug>` e `/pt/projetos`, **nenhum** pedido a `/api/midia` sem largura e **nenhuma** imagem acima de 300 KB, com a página rolada até o fim; largura fora da lista responde 400; lightbox abre em 960–1600.
- Suíte completa: lint 0/0 · typecheck · unit 182 · RLS 70 · build · e2e **279/279**.

## Fica para depois

- Galeria continua carregando todas as miniaturas ao rolar (28 ≈ 1 MB). Se crescer muito, paginar ("ver mais") como a spec 22 sugere.
- Formato ainda é JPEG (o que o Drive gera). AVIF/WebP exigiria pipeline próprio de imagem.
