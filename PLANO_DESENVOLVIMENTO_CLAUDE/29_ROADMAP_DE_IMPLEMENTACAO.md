# Roadmap de implementação

Cada fase termina em artefato demonstrável e gate. Não iniciar fase seguinte apenas porque UI “parece pronta”.

## F0 — baseline (1 fatia)

Instalação reproduzível, CI mínimo, lint/type/build, link scan, screenshots, testes curriculares. Gate: baseline verde ou falhas registradas com issue.

## F1 — fundação de experiência

Root/public/Portal shells separados; tokens; catálogo de componentes; i18n routing; tema Portal persistente; reduced motion/landmarks. Gate: página-laboratório em PT/EN, temas e viewports passando axe.

## F2 — segurança vertical

Schema/migrations, auth, perfil, papéis, membership, RLS e auditoria mínima. Gate: testes cross-project e anônimo; callback/login/logout; produção fail-closed.

## F3 — núcleo Portal

Projeto + equipe + missão + atividade + histórico; lista/Kanban/calendário básico. Gate: fluxo end-to-end por Admin/Líder/Membro/Externo e temas/mobile.

## F4 — fluxograma

Fonte canônica, testes de paridade, grafo responsivo/acessível, optativas, dependentes, fullscreen/painel. Gate: três matrizes em mouse/touch/teclado sem regressão.

## F5 — site público essencial

Home, Curso, Projetos/detalhe, Experiências/detalhe, Notícias/detalhe e Comunidade em PT/EN com conteúdo validado. Gate: SEO/links/CWV/axe e nenhum placeholder factual.

## F6 — empresas e P&D

Capacidades/labs, Para Empresas, formulário de desafio, triagem, organizações/CRM. Gate: desafio público chega restrito ao Portal; labs validados.

## F7 — conteúdo e acervo

Drive/files/gallery, approvals, publication projection. Gate: conteúdo não aprovado é impossível de consultar publicamente; links privados expiram.

## F8 — gestão institucional

Oportunidades, experiências internas, coordenação, notificações, relatórios/indicadores. Gate: fórmulas/fontes/snapshots e alertas deduplicados.

## F9 — acabamento

Performance real, segurança, acessibilidade, responsividade, observabilidade, remoção do legado e runbooks. Gate: `32` executado pelo Codex, P0/P1 fechados.

## Ordem de valor

Se houver redução de escopo: F0–F4 são inegociáveis; publicar Home/Curso/Projetos antes de módulos avançados; CRM/P&D antes de financeiro; financeiro é último e pode ficar fora do MVP.
