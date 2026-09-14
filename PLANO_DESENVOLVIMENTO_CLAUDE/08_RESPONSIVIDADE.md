# Responsividade

## Viewports de verificação

Testar pelo menos 360×800, 390×844, 768×1024, 1024×768, 1366×768, 1440×900 e ≥1920. Breakpoints são consequência do conteúdo, não rótulos de dispositivo.

## Site público

- Header vira menu acessível; PT/EN permanece evidente.
- Heroes não dependem de `100vh`; considerar barras móveis e safe areas.
- Imagem possui crop por breakpoint e foco do assunto.
- Grids reduzem colunas sem achatar conteúdo.
- Mapa sempre tem alternativa em lista.
- Títulos usam `clamp`; corpo não cai abaixo de legibilidade.

## Portal

- Desktop: sidebar + área de trabalho; notebook: sidebar compacta e densidade controlada.
- Tablet: drawer/rail, filtros recolhíveis e painéis laterais em drawer.
- Smartphone: bottom navigation curta ou drawer; ações primárias fixas com cuidado a safe area.
- Tabela vira lista de registros/colunas prioritárias; “ver detalhes” revela restante.
- Kanban mobile mostra uma coluna por vez com seletor de status; arrastar não é único meio.
- Calendário alterna agenda/dia; mês denso não é padrão móvel.
- Modais complexos viram páginas/drawers fullscreen.
- Dashboard ordena “depende de mim”, não miniaturiza todos os widgets.

## Fluxograma

Desktop amplo: grafo completo com zoom/pan/minimap opcional. Notebook: fullscreen e fit-to-width. Tablet: pan/zoom e navegação por fase. Smartphone: foco em disciplina/fase com grafo navegável e painel; nunca lista estática como única experiência.

## Aceite

Sem scroll horizontal no documento. Scroll interno só em componentes que o anunciam e possuem alternativa. Nenhum controle fica sob navegador/teclado virtual. Alvos de toque ≥44×44 CSS px quando possível. Conteúdo e ações permanecem completos em zoom de 200%.
