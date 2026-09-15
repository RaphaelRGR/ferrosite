# FLOW-001 + FLOW-002 — Fonte canônica curricular e explorador do fluxograma

Data: 2026-09-15 · Fase F4 · Depende de BASE-001 (invariantes), DS-001 (Dialog/tokens), PUBLIC-001 (página do Curso)

## FLOW-001 — fonte canônica

Os três PDFs em `public/grades/` são exportações oficiais "CURRÍCULO DO CURSO — 604 Engenharia Ferroviária e Metroviária" (SeTIC/UFSC), com fases, códigos, cargas, aulas semanais, pré-requisitos (incluindo grupos `eh(...)` = todos e `ou(...)` = alternativas), equivalências e ementas. Passaram a ser **a fonte**:

- `scripts/curriculum_from_pdf.py` (ferramenta de manutenção; requer `pypdf`) gera `content/curriculum/{2025,2016,2012}.json` com `source` (arquivo, código do currículo, **sha256 do PDF**, data, ferramenta), `prerequisitesSource`, `unknownPrerequisites`, fases, optativas e atividades. Trata repetição de linha em quebra de página, cargas coladas ao tipo e slots "Optativa Obrigatória I–IV".
- `src/data/curriculums.ts` é um loader tipado do JSON (`Subject` ganhou `shortName`, `classesPerWeek`, `preAny`, `equivalents`, `syllabus`); `src/data/curriculums.legacy.ts` preserva o dataset antigo como insumo de categorias/nomes curtos/flag de extensão.
- Teste de invariantes reescrito (30): estrutura, contagens do snapshot, IDs, ementa para todo código oficial, pré-requisitos existentes ou em `unknownPrerequisites`, aciclicidade, exceções conhecidas e **sha256 do PDF confere com o JSON** (trocar o PDF sem regenerar falha o CI).

### O que a comparação TS × PDF revelou (e como ficou)

| Matriz | Antes (protótipo) | PDF oficial | Decisão |
|---|---|---|---|
| 2025 | 60 obrigatórias, 15 optativas; 4 disciplinas sem pré-requisito registrado (EMB5554, EMB5555, EMB5100, EMB5556) | 62 obrigatórias (+EMB5598 Atividades Complementares, +EMB5997 Atividades de Extensão), 24 optativas, pré-requisitos completos | **PDF** |
| 2016 | 61 (57 + 4 slots), 15 optativas; faltavam EMB5103 na fase 5 e pré-requisitos de EMB5010/5047/5528/5537/5519 | 61 obrigatórias, 28 optativas; cita EMB5109 e EMB5628 (fora do currículo) | **PDF**; códigos externos em `unknownPrerequisites` |
| 2012 | 61 obrigatórias com pré-requisitos; EMB5032 nas optativas | 61 obrigatórias, 7 optativas; **o PDF não traz nenhum pré-requisito** | Estrutura do PDF; **arestas legadas preservadas** com `prerequisitesSource: "legacy-unverified"` e aviso na UI |
| Ementas | 38 textos editoriais ("a disciplina mais complexa e exclusiva…") | ementas oficiais para todas as disciplinas com código | ementas oficiais na UI; editoriais descartadas (inventário) |

Os dois casos `[CONTEÚDO PENDENTE]` de BASE-001: `EMB5512→EMB5107` (2012) agora **é desenhável** (optativas entram no grafo) mas segue sem fonte oficial; `EMB5605→EMB5116` (2012) — o PDF coloca ambas na fase 6 e não declara o pré-requisito: a aresta é legada e continua registrada como exceção até a coordenação confirmar.

## FLOW-002 — explorador

`src/components/curriculum/CurriculumExplorer.tsx` + `SubjectDialog.tsx` + `src/lib/curriculum/graph.ts` (funções puras: ancestrais, dependentes, vizinhança/arestas, busca; 5 testes).

Critérios de aceite de `09`:
1. **Matrizes 2025/2016/2012 na URL** (`?matriz=`, `?disciplina=`, `?vista=lista`; `router.replace` sem scroll).
2. **Seleção mostra ancestrais e dependentes** com legenda textual e anúncio `aria-live` ("X pré-requisitos e Y dependentes"); linhas SVG azuis (pré-requisitos) e verdes (dependentes), calculadas por offsets reais e recalculadas via `ResizeObserver`.
3. **Mouse, toque e teclado equivalentes**: hover = prévia; clique/toque = seleção persistente; segundo toque = detalhes; setas/Home/End movem entre cards, Enter seleciona, Shift+Enter detalha, Escape limpa; cards são `<button aria-pressed>`.
4. **Diálogo acessível** (DS-001): ementa oficial, carga/aulas, categoria, extensão, pré-requisitos com alternativas, dependentes e equivalências; códigos relacionados trocam a seleção.
5. **Notebook/tablet/smartphone**: zoom −/+, ajustar à largura, tamanho original, navegação por fase (rola a coluna), região rolável focável com `role=region`, sem scroll horizontal do documento.
6. **Resize** recalcula a geometria (offsets + `ResizeObserver`).
7. **Movimento reduzido** não remove informação (transições só decorativas; teste).
8. **Lista equivalente** com relações em texto; **optativas** como 11ª coluna (toggle); busca por código/nome; link para o PDF oficial; aviso quando os pré-requisitos são legados (2012); códigos externos listados.

## Validação

`npm run lint` 0/0 · `npm run typecheck` ok · `npm test` **103/103** · `npm run test:rls` 13/13 · build ok · `npm run test:e2e` **128/128** (7 novos do explorador: clique/URL/diálogo, teclado, 2012 com optativas e aviso, lista, busca + ajustar, axe estrito, reduced motion; teste de diálogo atualizado).

## Pendências

- Confirmação institucional (owner + `verified_at`) dos três currículos e dos pré-requisitos de 2012.
- Minimap e modo "foco" (09: só se teste provar utilidade).
- `CurriculumFlowchart.tsx`/`SubjectModal.tsx` legados sem consumidor → CLEAN-001.
- Tradução EN dos nomes de disciplinas (24: nomes oficiais não se traduzem arbitrariamente) — só rótulos de UI estão em EN.
