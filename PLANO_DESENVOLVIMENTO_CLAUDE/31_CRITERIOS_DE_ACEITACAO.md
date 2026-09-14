# Critérios de aceitação

## Global

- instalação limpa, lint, typecheck, testes e build passam;
- exatamente um `<main>`, skip link e heading principal por página;
- nenhum link/fragmento interno 404; nenhum botão/cursor sem ação;
- vazio/loading/erro/sem permissão/sucesso implementados;
- 360–1920 px e zoom 200% sem overflow global/corte;
- reduced motion entrega todo conteúdo visível e estático.
- manifesto e jornada permanecem com contraste normal em reduced motion; teste Playwright específico impede regressão de `opacity: 0`.

## Site público

- PT/EN cobre UI, conteúdo, metadata, formulários e mensagens; troca mantém contexto;
- identidade oficial, interface clara e imagens com dimensões/alt/crédito;
- nenhum número/parceiro/notícia/data sem fonte, validação e autorização;
- canonical/hreflang/sitemap/OG corretos;
- LCP p75 ≤2,5 s, INP ≤200 ms, CLS ≤0,1; vídeo não baixa em mobile/Save-Data/reduced motion;
- conteúdo essencial navegável sem JS.

## Fluxograma

- matrizes 2025/2016/2012, optativas e PDFs preservados;
- IDs únicos, arestas válidas, ciclos detectados e divergências documentadas;
- seleção mostra pré-requisitos e dependentes; mouse/touch/teclado equivalentes;
- zoom/pan/fase/foco e painel funcionam em notebook/tablet/smartphone;
- resize/orientação não desalinha linhas; dialog acessível.

## Portal

- anônimo não acessa `/portal/**`; callback inválido não cria sessão;
- Claro/Escuro alternam sem reload/flash, persistem entre rotas/sessões;
- dashboard varia por perfil e todo indicador declara fonte/período;
- tabelas, Kanban, calendário, gráficos, forms, modais e viewers funcionam nos dois temas;
- foco é visível; estados têm texto/ícone além de cor;
- nenhuma coleção inteira é carregada por padrão.

## Permissões/privacidade

- membro A não lê/escreve B alterando ID/API/busca/exportação;
- externo vê somente grant vigente; desativação revoga sessão/acesso;
- nenhuma tabela privada sem RLS; nenhuma chave privilegiada no cliente;
- mudança de papel, publicação, exportação e remoção têm auditoria;
- PII/desafio/arquivo não é publicado automaticamente.

## Publicação/arquivos/relatórios

- somente snapshot aprovado chega ao site; preview não indexa;
- link privado expira e revogação Drive é respeitada;
- galeria pagina/lazy-load e não carrega originais em massa;
- relatório guarda snapshot e mesmas permissões/fórmula da tela;
- “sem dados” não é apresentado como zero.
