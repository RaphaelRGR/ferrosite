# Acessibilidade

Alvo: WCAG 2.2 AA, teclado e leitores de tela contemporâneos. Automação ajuda, não substitui teste manual.

## Fundação

Landmarks únicos; skip link; headings ordenados; `lang` por locale; nome/descrição de controles; foco visível; reflow/zoom 200–400%; targets 44 px quando possível; erro textual; status não só por cor; alt/crédito administrável.

## Movimento

`prefers-reduced-motion` desativa pin, parallax, marquee, partículas, contadores animados e transformações não essenciais. Conteúdo começa visível quando JS falha ou movimento é reduzido. Autoplay de vídeo não contém informação exclusiva.

## Componentes críticos

- Navbar/dropdown/mobile: teclado, Escape, foco, `aria-expanded`, scroll lock.
- Dialog: trap/retorno de foco e anúncio.
- Kanban: lista e comandos de mover; live region moderada.
- Calendar: navegação de teclado e agenda alternativa.
- Charts: título, descrição, tabela/dados equivalentes.
- Map: lista equivalente.
- Flowchart: grafo focável + lista/tabela equivalente.
- Forms: label, instrução, erro relacionado, resumo e sucesso persistente.

## QA

axe sem violações sérias/críticas; teste manual somente teclado em PT/EN e temas; NVDA/Chrome ou combinação aprovada; contraste medido por estado; escala de cinza; 200% zoom; reduced motion; high contrast quando suportado.
