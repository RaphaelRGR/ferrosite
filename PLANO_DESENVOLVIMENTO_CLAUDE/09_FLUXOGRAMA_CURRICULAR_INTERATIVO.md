# Fluxograma curricular interativo

## Estado atual

Fonte React: `src/data/curriculums.ts` + `CurriculumFlowchart.tsx` + `SubjectModal.tsx`. Há três matrizes (2025, 2016, 2012), dez fases, optativas em dados, seletor de ano, hover que percorre ancestrais de pré-requisito, linhas SVG e modal de disciplina. PDFs e HTMLs legados existem em `public/grades/`.

Auditoria estrutural encontrou 60 disciplinas principais em 2025, 61 em 2016 e 61 em 2012; IDs principais são únicos e pré-requisitos apontam para IDs existentes. Isso precisa virar teste automatizado, não permanecer apenas constatação.

## Problemas

- `min-w-[1500px]` e dez colunas obrigam scroll horizontal extenso.
- hover é a única forma clara de evidenciar relações; toque abre modal diretamente.
- destaca ancestrais, não dependentes.
- cards são `div` sem semântica/teclado/foco.
- linhas são `any[]`, calculadas por DOM e não respondem explicitamente a resize/zoom/scroll interno.
- recursão não protege ciclo, embora o dataset atual aparente válido.
- optativas não são renderizadas.
- caso concreto: na matriz 2012, `EMB5512` referencia `EMB5107`, que está nas optativas; como optativas não geram nós, a aresta não pode ser desenhada hoje.
- modal não é acessível e muitas ementas usam texto genérico.
- dados duplicados nos três HTMLs podem divergir.

## Funcionalidades que não podem ser perdidas

Três matrizes; fase; código/nome/carga; extensão; clique/toque para detalhes; pré-requisitos encadeados; leitura visual de relações; PDFs oficiais; desempenho suficiente para uso real.

## Arquitetura proposta

1. Normalizar cada currículo em nós/arestas com schema validado.
2. Funções puras: ancestrais, dependentes, vizinhança, ciclo, órfão e fit.
3. Estado por URL: matriz, disciplina, fase e modo quando útil.
4. Renderização desacoplada do painel de detalhes.
5. Layout responsivo calculado; avaliar biblioteca somente após protótipo nativo e orçamento de bundle.
6. `ResizeObserver` e geometria estável; cancelar/recalcular com debounce.
7. Versão antiga disponível atrás de fallback durante migração.

## Comportamento

### Desktop/notebook

Hover oferece prévia; clique fixa seleção. Ações: fit, zoom +/−, reset, fullscreen, centralizar, mostrar pré-requisitos/dependentes/ambos, fase anterior/próxima. Minimap só se teste provar utilidade. Painel lateral contém ementa, carga, categoria, extensão, pré-requisitos e dependentes.

### Tablet/smartphone

Primeiro toque seleciona e destaca; segundo/ação “Detalhes” abre painel. Navegação por fase e busca por código/nome. Pinch e botões de zoom; pan confinado com instrução acessível. Oferecer modo “foco” em uma disciplina com vizinhança, mantendo grafo. Não reduzir à lista estática; lista é alternativa acessível.

### Teclado/leitor de tela

Nós são botões/elementos focáveis; setas navegam espacialmente ou Tab em ordem documentada; Enter seleciona; Escape limpa/fecha; anúncio diz “X pré-requisitos, Y dependentes”. Disponibilizar tabela/lista equivalente e link para PDF.

## Estratégia das três matrizes

- manter datasets separados com versão e fonte;
- registrar data de validação e responsável;
- comparar com PDFs/HTML antes de publicação;
- testes: ano, fases, IDs únicos, arestas válidas, aciclicidade, carga e optativas;
- nenhuma correção curricular baseada em suposição; divergência vira `[CONTEÚDO PENDENTE]`.

## Critérios de aceite

1. 2025/2016/2012 disponíveis e persistem na URL/estado.
2. Seleção mostra ancestrais e dependentes com legenda textual.
3. Mouse, touch e teclado concluem a mesma tarefa.
4. Modal/painel atende diálogo acessível.
5. Nenhum nó inacessível em 1366×768; mobile tem foco/fase/zoom sem scroll do documento.
6. Redimensionar/reorientar não desalinha arestas.
7. Movimento reduzido não remove informação.
8. Testes de invariantes e E2E passam; PDFs permanecem acessíveis.
