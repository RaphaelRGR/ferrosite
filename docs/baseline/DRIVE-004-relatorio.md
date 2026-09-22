# DRIVE-004 — Experiências reais a partir do acervo (visitas, palestras, galeria)

Data: 2026-09-21 · Pedido do usuário ("analise as fotos e visitas do Drive e organize o que puder no site, com datas"). Docs 17, 18, 21, 24. Base: DRIVE-003.

## Levantamento (só leitura, Drive humano `FERROVIÁRIA/03 - Visitas, Eventos e Relatórios`)

| Pasta | Data | Fontes no acervo |
|---|---|---|
| 2025-1/DIA DO FERROVIÁRIO | 30/04/2025 | 2 fotos |
| 2025-1/Metrô - SP | 12/09/2025 (data das fotos) | 100 fotos |
| 2025-1/Marcopolo Rail, Visita FastParts | — | pastas vazias |
| 2026-1/PALESTRA LANFRANCO (29/04) | 29/04/2026 13h30, Sala de Cinema U116 | 30 fotos + relatório (docx) |
| 2026-1/DIA DO FERROVIÁRIO (30/04) | 30/04/2026 | 32 fotos |
| 2026-1/FTC (15/05) | 15/05/2026, Ferrovia Tereza Cristina | relatório (pdf/docx), convite, 10 vídeos (fora) |
| 2026-1/RUMO LOGÍSTICA 18/06 | 18/06/2026, Curitiba | 95 fotos + relatório (pdf/docx) + 3 vídeos e 1 zip (fora) |
| 2026-1/PALESTRA VIBTECH 24/06 | 24/06/2026 13h30, Sala de Cinema U116 | 30 fotos + relatório (pdf/docx) |
| 2026-1/PALESTRA RUMO 08/07/2026 | 08/07/2026 13h30, Sala de Cinema Bloco U | 32 fotos + relatório (pdf) + 6 vídeos (fora) |
| 2026-1/FEIRA DE CURSOS 2026 | — | pasta vazia |

Os relatórios de evento (modelo institucional) trazem data, local, programação, áreas visitadas, contagem de participantes e descrição — e **listas nominais de participantes** (PII): usados só como fonte factual; nenhuma pessoa é nomeada no site. Os relatórios foram copiados para `relatorios/2026` com classificação **interna**.

## Entregue

| Área | Implementação |
|---|---|
| Modelo | Migration 11: `content_file` (galeria/anexos de conteúdo, RLS de autor/overseer; alterar a galeria de item aprovado volta a rascunho), `publication.gallery_file_ids` (snapshot: só arquivos com consentimento e verificados entram), `public_publication.gallery_file_ids`, `public_file_info` aceita capa **ou** galeria de publicação viva, `public_gallery(publication)` para o site. |
| Site | `experience` ganha caminho público `/experiencias/<slug>`: hub lista as publicações reais ("Realizadas — publicadas pelo Portal", ordenadas por data, sem selo) antes do staging em quarentena; detalhe usa o artigo publicado + `PublishedGallery` (imagens só pelo proxy `/api/midia`, `alt` obrigatório, crédito/legenda). EN sem publicações EN continua honesto. |
| Portal | Página do conteúdo ganha **Galeria** (miniaturas, consentimento/classificação/verificação com aviso "vai ao site / fica interno", legenda e ordem, vincular existente, desvincular, enviar direto para `conteudos/<tipo>/<slug>`). Upload aceita destino `content`. |
| Importar do Drive | `/portal/arquivos/importar` (admin/coordenação): pasta de origem → galeria de um conteúdo, projeto ou área; copia item a item pelo pipeline do upload (magic bytes, allowlist, subpasta, registro verificado, vínculo), **idempotente** por md5 (repetir só religa o que já existe), vídeos/ZIP ignorados, nada movido/apagado na origem; por lotes de 5 com progresso e cancelamento; auditoria `drive.import`. |
| Conteúdo | 8 experiências criadas como rascunho (autor: conta admin de teste) só com fatos dos relatórios e das pastas: título, data/hora, local, resumo, corpo em Markdown, `source_note`; lacunas como `[CONTEÚDO PENDENTE]`; sem nomes de pessoas. Fotos importadas para as galerias com classificação interna e consentimento **pendente**. |

## Publicação (ver seção final)

Regra aplicada: texto vai ao ar; fotos só quando verificadas, públicas e com consentimento — o que exige decisão da coordenação foto a foto (há pessoas identificáveis na maioria). Capas escolhidas entre fotos **sem pessoas identificáveis** (`consent = not_required`, `classification = public`).

## Validação

`npm run lint` 0/0 · `npm run typecheck` ok · `npm test` 177/177 · `npm run test:rls` **67/67** (novo `experiences-gallery.test.ts`: RLS da galeria, snapshot só com consentimento, alteração volta a rascunho, republicação necessária, despublicar tira do site) · build · e2e novo `experiences.spec.ts` (hub/detalhe/galeria pelo proxy com alt; EN sem fallback; galeria no Portal; importar só overseer). Importação real executada pela UI (ver tabela abaixo).

## Publicação executada (2026-09-21, autorização da coordenação pelo chat)

A coordenação autorizou o uso no site das fotos das visitas/palestras (inclusive com pessoas identificáveis) e escolheu a capa principal. Registro aplicado foto a foto: sem pessoas → `consent = not_required`; com pessoas → `consent = granted` com `consent_note` "Uso no site autorizado pela coordenação do curso (chat, 2026-09-21)"; todas `classification = public`, verificadas, com `alt` PT/EN e crédito "Acervo do curso". Fluxo real: rascunho → revisão → aprovação (revisor) → `publish_content` (snapshot de capa + galeria).

| Experiência | Capa | Fotos públicas |
|---|---|---|
| Dia do Ferroviário 2025 | sim | 2 |
| Visita técnica: Metrô de São Paulo | sim | 19 |
| Palestra Lanfranco | sim | 3 |
| Dia do Ferroviário 2026 | sim | 6 |
| Visita técnica: FTC | — (pasta só tem vídeos) | 0 |
| Visita técnica: RUMO Logística | sim (foto da turma) | 28 |
| Palestra VIBTECH | sim | 13 |
| Palestra RUMO | sim | 3 |

72 das 312 fotos importadas estão públicas; o restante fica interno (consentimento pendente) e pode ser liberado pela Galeria do conteúdo no Portal.

**Imagens do site (`site_image`)** — migration 12: tabela `site_image(key → file_asset)` (só coordenação/admin; trigger audita), `public_site_image(key)` e `public_file_info` estendido. Chave `home_hero` aponta para a foto escolhida pela coordenação (turma na RUMO, Curitiba, jun/2026 — Drive `1-yYF54gIupA3GUArXYVqbCNqbXG86HIM`), que também é a capa da experiência RUMO. As duas cópias duplicadas dessa foto (importadas antes da tolerância a nome sem extensão) foram desvinculadas da galeria e seguem internas.

**Projetos reais (PROJ-001)** — migration 13: `project.description_md/_en`, projeção `public_project` (classificação pública, status planejado/ativo/pausado/concluído, capa só com consentimento) e `public_project_gallery(slug)`; migration 14 acrescenta `created_at` à projeção para ordenar o hub pela ordem de cadastro. Os 9 projetos informados pela coordenação foram cadastrados (líder/criador: coordenador; público/ativo): Comunica Ferro (BigBoy, Dinâmica, Café com Ferroviário), Cavalos de Ferro (+ Academia), Missões Ferroviárias, VIGIA, FerroLab, Ferrovia nas Escolas (+ Turma da Ferrovia), Simulador Ferroviário, FerroCards (+ jogos e kits), CAFER. Textos só com o que a coordenação escreveu; sem números/datas/parceiros inventados. `/projetos` e `/projetos/<slug>` (PT/EN, Markdown, capa/galeria pelo proxy) e a Home usam os projetos reais; os itens de staging `ferro-lab` e `extensao` (Navbar do legado) foram removidos por estarem cobertos. Capas/galerias dos projetos ainda não há fotos específicas — ficam sem imagem até a coordenação enviar pelo Portal (`projetos/<slug>/galeria`).

**Limpeza** — fixtures E2E removidas do banco (script de sessão com triggers `forbid_delete` desligados só na transação, auditado) e as pastas `projetos/projeto-e2e-*` movidas para a lixeira do Drive (script de sessão com o token da conexão; o Portal continua sem apagar nada no Drive). Cada rodada E2E volta a criar fixtures no banco real — recomendação registrada em 33: projeto Supabase separado para testes.

**Validação final**: lint 0/0 · typecheck ok · unit 177/177 · RLS 70/70 (novos `site-images` e `public-projects`) · build · e2e **274/274** (quarentena atualizada: Home 4 seções, `/projetos` 0). Correção achada pelo e2e em produção: `actions/site.ts` exportava uma constante num arquivo `"use server"` (só funções assíncronas são permitidas) — movida para escopo interno.
