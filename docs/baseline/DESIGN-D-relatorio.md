# DESIGN-D: "O curso na linha" (redesign editorial do site público)

Branch `redesign/design-d`. Nada vai para `main` sem aprovação do usuário sobre o preview. Plano aprovado em 2026-10-16. A taste-skill e a impeccable entram como **referência de qualidade, não como checklist**.

## Fase 0: linha de base e teste tipográfico (2026-10-16)

### Linha de base da produção (antes de qualquer mudança)
- **`scripts/screens.mjs`** (Playwright, que o projeto já usa):
  - captura página inteira em 1440 e 390 px;
  - mede LCP antes de rolar e CLS da carga inteira, além da rolagem lateral.
- **Saída:** `docs/baseline/DESIGN-D/antes/` (screenshots + `metrics.json`). Com `--metrics-only --runs 3`, grava a mediana do LCP em `metrics-lcp.json`.
- **Páginas:**
  - Home PT/EN;
  - Curso (grafo e lista);
  - Projetos + um projeto;
  - Experiências + uma experiência;
  - Calendário (lista e grade);
  - Notícias, Para empresas, Laboratórios + um laboratório, Sobre, Login.
- **Portal:** fica fora do script (exige login). A prova de que ele não muda é pelo escopo do código (fonte e tokens só sob `data-site="public"`) e por screenshots manuais claro/escuro antes do merge.
- **Resultados da produção:**
  - nenhuma página tem rolagem lateral em 390 px;
  - o CLS máximo foi 0,084 (página de uma experiência no celular), ainda abaixo de 0,1;
  - os demais CLS ficaram ≤ 0,011.

### Fontes servidas pelo projeto
- **Motivo:** o `next/font/google` baixa as fontes do Google no build/dev. Na rede local (~8 s por arquivo) o Turbopack desiste: "Can't resolve '@vercel/turbopack-next/internal/font/google/font'".
- **Solução:**
  - as candidatas ficam em `src/fonts/` (woff2 do subconjunto latin, que cobre o português, com a licença OFL ao lado), obtidas dos pacotes Fontsource (`npm pack`);
  - são carregadas por `next/font/local`, sem depender de rede no build;
  - é também a recomendação da impeccable (fonte própria hospedada).

### Teste tipográfico: `/design-system/tipografia`
- **Conteúdo real em cada candidata:**
  - título da Home (desktop e coluna de 390 px);
  - descrição do hero;
  - o parágrafo de uma experiência publicada;
  - a tabela de datas do calendário (`tabular-nums`);
  - um mês com eventos;
  - um card de disciplina do fluxograma;
  - acentuação.
- **Candidatas:**
  - **Archivo variável:** um arquivo de 90 KB, eixos `wght` 100–900 e `wdth` 62–125.
  - **Barlow + Barlow Condensed:** 6 arquivos de ~22 KB.
  - **Geist** (controle).
- **Observação do teste:** a Archivo em largura 72 com tracking negativo deixava as palavras coladas ("Ferroviáriae"). Em **largura 80, tracking −0,01em e word-spacing +0,04em**, o título fica firme e legível. O texto longo em Archivo de largura normal tem leitura confortável.
