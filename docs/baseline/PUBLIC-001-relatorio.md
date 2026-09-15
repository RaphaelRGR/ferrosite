# PUBLIC-001 — Home e Curso claros (+ hub de projetos e header/footer novos)

Data: 2026-09-15 · Fase F5 (adiantada com a liberdade concedida) · Depende de DS-001, I18N-001, BASE-002

## Entregue

- **Shell público claro** (guia §2/§5, referências `telas principais`): `PublicHeader` (logo oficial + marca em texto, Início/Curso/Projetos/Experiências/Notícias, PT|EN, botão Portal; drawer acessível no mobile) e footer institucional com navegação primária e "Mais" (Sobre, Eventos, Simuladores, Portal). `<html data-theme="light">` no site; a Navbar escura antiga saiu de uso (arquivo preservado para CLEAN-001).
- **Home** (04, guia §6): hero editorial com arte conceitual SVG (não fotográfica — 25; slot IMG-002 anotado) → indicadores (quarentena) → 4 frentes (derivadas das áreas curriculares; sem fatos) → projetos em destaque (quarentena) → experiências Brasil/Internacional em timeline (quarentena) → notícias (quarentena) → faixa de logos (quarentena, explicitamente "relações em verificação") → CTA em três públicos. Removidos "Portal não oficial", números como fato e o CTA `#portal` morto.
- **O Curso** (guia §7): hero → sobre + dados básicos (quarentena) → 4 pilares (quarentena) → **trajetória por fase derivada do dataset** (disciplinas, horas via `Intl`, disciplinas ferroviárias em destaque, downloads dos 3 PDFs oficiais) → fluxograma interativo preservado (`#fluxograma`, FLOW-002 refaz) → **laboratórios do portfólio** (14, fonte: PDF p.2; LABMCI/LASC/IDA Lab marcados "detalhes pendentes") → CTA.
- **Projetos**: hub `/projetos` e detalhe `/projetos/[slug]` para os 4 nomes citados no protótipo (pré-renderizados), com aviso explícito de conteúdo pendente. **A lista de links quebrados ficou vazia.**
- **Experiências**: `/visitas` → `/experiencias` (redirect permanente em `next.config.ts`; guia §9).
- **Staging tipado** (`src/content/staging.ts`): valores copiados dos componentes legados e do PDF, todos UNVERIFIED, com origem; inventário atualizado (105 entradas, 43 seções; seções legadas marcadas "sem consumidor" com texto preservado).
- **Tokens**: `action` recalibrado (#C63D0E: 5,1:1 com branco, 4,76:1 sobre canvas) e novo `--text-link`/`text-link` (claro #A8330B; escuro #FF8A5B) — botão e texto de link são necessidades diferentes; o teste de contraste agora cobre canvas/surface/surface-2 nos dois temas.
- Fluxograma legado: contraste da aba ativa/EXT e região rolável focável (`role=region`, `tabIndex`) — mínimo até FLOW-002.

## Validação

- `npm run lint` 0/0 · `npm run typecheck` ok · `npm test` **97/97** · `npm run test:rls` 13/13 · build 34 páginas.
- `npm run test:e2e` **121/121**: axe **estrito** (sem violações sérias/críticas) em `/pt`, `/en`, `/pt/curso`, `/pt/projetos`, `/pt/projetos/comunica-ferro` + catálogo + login; crawler sem links quebrados; quarentena (5 selos na Home, 6 no Curso, 1 no hub/detalhe); `/en` sem PT; reduced motion na Home clara e numa página legada; redirects de locale; smoke/landmarks em 23 rotas HTML.
- Visual: Home/Curso desktop, Home mobile e drawer conferidos.

## Decisões

1. Copy do hero e das 4 frentes vem do guia/dataset (mensagem de produto), não de fatos institucionais — sem selo. Tudo que é número, data, projeto, parceiro, pessoa ou narrativa institucional está sob selo.
2. Nenhuma foto: arte SVG conceitual no lugar, com nota visível. Fotos reais/autorizadas (ou geradas com os prompts do 25 como ambientação) entram por asset.
3. CREA e "único no Brasil" **não** aparecem nas páginas novas (alegações legais/absolutas sem fonte); textos preservados no inventário.
4. Sobre, Eventos, Notícias, Simuladores continuam com as seções antigas (escuras) dentro do shell claro até PUBLIC-002; acessíveis pelo footer "Mais".
5. `Comunidade` e `Para Empresas` não entram no menu até existirem (03).

## Pendências

- PUBLIC-002: hubs/detalhes reais de Experiências, Notícias, Eventos; remover ações falsas das páginas legadas.
- FLOW-002: fluxograma claro/responsivo/acessível.
- LAB-001: páginas por laboratório (portfólio).
- Fotografia oficial (IMG-002/003) e logo em vetor.
