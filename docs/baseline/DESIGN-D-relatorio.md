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

## Fase 1: fundação (só o site público)

- **Escopo:**
  - `PublicShell` ganha `data-site="public"` e a fonte (`layout/public-fonts.ts`, Archivo por `next/font/local`, variável `--font-archivo`);
  - os tokens e as regras ficam em `layout/public-theme.css`, todos sob `[data-site="public"]` e em `@layer base/components`, para que utilitários do Tailwind ainda possam ajustar caso a caso;
  - o `HtmlShell` (Portal, login, catálogo) não muda;
  - `tests/unit/public-theme-scope.test.ts` garante as duas coisas.
- **Tipografia:**
  - `h1`/`h2` na Archivo de largura 80, com `text-wrap: balance`; parágrafos com `pretty`;
  - `time`/`table`/`.tabular` com `tabular-nums`;
  - escala fluida `--step--1…5` e classes por papel (`t-display`, `t-title`, `t-section`, `t-subsection`, `t-lead`);
  - ritmo de seção em três medidas (`section-compact/regular/generous`), que cada seção escolhe pelo conteúdo.
- **Rótulos:**
  - **o eyebrow continua** quando informa, agora em caixa normal com o traço de trilho (`.eyebrow`);
  - os subtítulos de seção que eram rótulos minúsculos em MAIÚSCULAS ("Como funciona", "Áreas de desafio", "Histórico", meses do calendário em lista) viraram títulos de verdade (`t-subsection`);
  - linhas de data e local viraram `.meta` (caixa normal, números alinhados);
  - mantidos como estavam: fluxograma, diálogo da disciplina, seletor PT/EN e 404.
- **Cabeçalho:**
  - o logo é o Início no desktop;
  - 6 links (Curso, Projetos, Experiências, Calendário, **Notícias**, Para Empresas) + PT/EN + Portal;
  - o menu do celular mantém "Início";
  - fica em uma linha de 1024 a 1440 px.
- **Rodapé:** o nome do curso em tamanho de título, campus e centro, os dois grupos de links (incluindo Laboratórios e Notícias), a locomotiva e o crédito.

## Fase 2: Home (modo Persuadir)

Cada seção tem composição própria:
1. **Hero:**
   - "UFSC Joinville" como rótulo de contexto;
   - o título do curso em tamanho de display (`t-display`, fluido);
   - descrição + um botão ("Conheça o curso") + link de texto (Projetos);
   - abaixo, a foto da turma (`home_hero`) em largura total do conteúdo: 21:9 no desktop, 16:9 no tablet, 4:3 de ponta a ponta no celular;
   - preset `wide` até 1600 px, `fetchPriority="high"` e crédito.
   - O "&" deixou de ser laranja (fica o texto da marca), e o slogan saiu do hero.
2. **Experiências (`HomeExperiences`):** a mais recente em destaque (foto 3:2, tipo · data, título, local, resumo) e as 4 seguintes em lista com miniatura (preset `mini`). Substitui a grade de 6 cartões iguais.
3. **Próximos eventos do setor (`UpcomingEvents`):**
   - faixa escura com a estética de quadro de partidas: data em destaque, evento (link para o site oficial), local e região;
   - os dados vêm de `public_rail_event` via `upcomingEvents()` (pura, testada: inclui o evento em andamento, exclui passados, ordena);
   - o texto diz "Feiras, congressos e seminários", nunca horário de trem;
   - sem evento futuro, mostra uma frase com o ano + link para o calendário;
   - as cores `--board-*` têm contraste testado (texto ≥ 4,5:1, marcadores ≥ 3:1).
4. **Vídeo:** um Short por vez, como antes.
5. **Frentes do curso:** lista tipográfica de 4 linhas (nome grande, descrição, →), com destaque por tom no hover e sem ícones em quadradinho.
6. **Projetos (`ProjectShowcase`):** o primeiro na ordem da coordenação em destaque, mais 3 em lista.
   - Sem foto, o destaque vira um **cartaz** na cor da categoria (`ProjectPoster`, par AA já testado) com o nome grande, em vez de um bloco ilustrado vazio.
7. **Pesquisa e empresas (`ResearchTeaser`, só PT como as páginas de destino):**
   - "14 laboratórios descritos no portfólio institucional";
   - as 6 capacidades com mais laboratórios no nível "offered" (potencial e pendente não contam), cada uma levando a Laboratórios filtrado;
   - botão Para empresas + link Laboratórios.
- **Removidos:**
  - a grade antiga de experiências (`PublishedExperiences`);
  - o CTA final "Faça parte dessa jornada" (`FinalCta` e as chaves `home.cta`), porque o rodapé faz o fechamento e "Conheça o curso" está no topo.
- **Quarentena sem mudança:** indicadores, notícias e parceiros do protótipo continuam só em `review`.
- **Captura:** `screens.mjs` marca as entradas animadas como vistas antes da foto, porque no dev a hidratação lenta deixava seções invisíveis na captura.

## Fase 3: Projetos (lista + página do projeto)

- **Hub `/projetos`:**
  - título e descrição atuais;
  - **atalhos por categoria** (âncoras, sem JS; selo com ícone + texto + quantidade);
  - os projetos ficam **agrupados por categoria** na ordem em que a coordenação os cadastrou (`groupByCategory`, pura e testada);
  - a variação de tamanho vem dos dados: categoria com 1 projeto vira faixa larga, com 3 vira colunas.
- **Sem foto:** cada projeto é um **cartaz** na cor da categoria (`ProjectPoster`: par de cor AA já testado, trilhos em perspectiva, ícone no alto e no fluxo, para nunca cobrir o texto no celular). Com foto autorizada, a foto entra no lugar e o texto vem ao lado (faixa) ou abaixo.
- **Página do projeto:**
  - cabeçalho dentro do cartaz da categoria (voltar, categoria, nome, resumo);
  - a foto de capa logo abaixo, em largura total, **só se houver** (antes era uma ilustração 21:9 enorme mesmo sem foto);
  - texto em medida de leitura (68ch);
  - galeria pública;
  - "Mais em {categoria}" com até 3 projetos da mesma categoria.
- **Removidos:**
  - a grade `ProjectCards`: o arquivo ficou só com `projectText`;
  - a moldura arredondada de 32px com borda da página do projeto.
- **e2e `design-c`:** atualizado. Cada projeto continua precisando ter foto **ou** capa da categoria; o selo com ícone + texto agora é exigido nos atalhos de categoria.
- **Fotos:** hoje nenhum dos 9 projetos tem capa. O layout funciona sem foto, mas fica melhor com ela; a capa pode ser cadastrada pelo Portal (projeto → arquivos), que já existe.
