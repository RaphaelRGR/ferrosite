# EDIT-001: produção sem conteúdo não verificado (Bloco A da auditoria de design, 2026-09-26)

## Problema

A auditoria de design encontrou 17 selos "Conteúdo em verificação" em 7 páginas do site em produção: notícias de exemplo com miniaturas vazias, indicadores sem fonte, logos de parceiros não autorizados, história e missão. O modo editorial padrão era `review` porque, quando foi escrito, "não havia deploy de produção" (BASE-002) — premissa que deixou de valer. A spec 04 manda não expor placeholder em produção. A Home ainda repetia as visitas: o bloco do protótipo ("…pelo Brasil e pelo mundo") duplicava a visita à RUMO e anunciava datas já passadas.

## Decisão da coordenação (chat, 2026-09-25)

Fluxograma, grades e laboratórios podem ser marcados como verificados: vêm dos PDFs oficiais das matrizes e do Portfólio de Laboratórios EFM/UFSC.

## Entregue

| Área | Implementação |
|---|---|
| Inventário | 33 entradas viraram `VERIFIED` (owner "Coordenação do curso", `verified_at` 2026-09-25, `decision: confirmar`): `curso.curriculum`, `curso.flowchart`, `curso.labs`, `laboratorios.hub`, `laboratorios.detalhe` (responsáveis, com registro da base de publicação: portfólio institucional público), `laboratorios.detalhe.conteudo` e `empresas.capacidades` (contagens derivadas dos laboratórios). As ementas editoriais do protótipo continuam descartadas. |
| Modo por ambiente | `next.config.ts` fixa `NEXT_PUBLIC_CONTENT_MODE` no build: **produção da Vercel = `strict`**; preview, local e CI = `review` (para revisão editorial e para os testes da quarentena). Uma variável explícita no painel sempre vence. |
| Vazamento corrigido | `UnverifiedContent` era Client Component: em `strict` a seção sumia da tela, mas o texto oculto **ainda seguia no HTML/payload** da página (medido num build estrito: "R$ 103 bi", a notícia do hidrogênio, "REUNI" etc.). Virou Server Component que decide antes de renderizar; o selo ficou numa moldura client (`UnverifiedFrame`) montada só quando a seção pode aparecer. |
| Páginas sem conteúdo | Sobre (todas as seções em quarentena) e Notícias (nenhuma publicada) mostram um bloco "Em validação" em vez de esqueleto vazio; itens do protótipo em Notícias/Experiências/Projetos respondem 404 em `strict`; o filtro Brasil/Internacional do protótipo só aparece quando aquela lista pode aparecer. |
| Home | O bloco de experiências do protótipo só aparece se não houver experiência real publicada. |

## Verificação do build estrito (igual à produção)

| Página | Selos | Texto oculto no código-fonte |
|---|---|---|
| `/pt` | 0 | nenhum (antes: indicadores, notícia de exemplo, parceiros) |
| `/pt/curso` | 0 | nenhum; **fluxograma e laboratórios permanecem** |
| `/pt/sobre` | 0 | nenhum; bloco "Em validação" |
| `/pt/noticias` | 0 | nenhum; bloco "Em validação" |
| `/pt/experiencias` | 0 | nenhum (sem a lista do protótipo) |

Itens do protótipo (`/pt/noticias/noticias.grid.08mai`, `/pt/experiencias/visitas.gallery.rumo-2023`) → 404. `/pt/laboratorios/lav` → 200 sem selo.

## Testes

- `tests/unit/content-inventory.test.ts`: regra do modo por ambiente (produção = strict, preview/local = review, explícito vence) presa ao texto do `next.config.ts`; seções verificadas x seções que seguem em quarentena; a regressão "entrada descartada não esconde a seção" agora espera `VERIFIED` em `curso.curriculum`.
- `tests/e2e/quarantine.spec.ts`: contagens atualizadas (Home 3, Curso 3, laboratórios e Para Empresas 0).
- Validação: lint 0/0 · typecheck · unit 184 · RLS 70 · build · e2e **304/304**.

## Continua em quarentena (aguarda fonte da coordenação)

Indicadores da Home, notícias, parceiros/logos, "Sobre o curso", dados básicos, pilares, história, missão/visão e pesquisa. Em produção essas seções simplesmente não aparecem até serem verificadas no inventário.
