# Checklist Codex — revisão final

## Preparação

- [ ] Ler plano e changelog; comparar escopo entregue.
- [ ] Instalação limpa, env documentado, migrations/seeds reproduzíveis.
- [ ] Lint/typecheck/unit/integration/E2E/build verdes.
- [ ] Revisar diff, dependências, TODO/FIXME, arquivos mortos e segredos.

## UX/UI e responsividade

- [ ] Objetivo/CTA em 5 segundos; navegação e busca coerentes.
- [ ] 360, 390, 768, 1024, 1366, 1440 e 1920; portrait/landscape.
- [ ] Sem overflow global; tabela/Kanban/calendário/fluxograma têm estratégia móvel.
- [ ] Estados vazio/loading/error/offline/sem permissão/arquivado.
- [ ] Tema claro/escuro em todas as rotas/componentes/estados; persistência e sem flash.
- [ ] Consistência de tokens, espaçamento, tipografia, ícones, foco e densidade.

## PT/EN e conteúdo

- [ ] Troca mantém rota/item/filtros; nada misturado.
- [ ] Metadata, slug, canonical, hreflang, sitemap, OG e mensagens traduzidos.
- [ ] Dados institucionais têm fonte/owner/data; nenhuma fixture no público.
- [ ] Labs, pessoas, logos, fotos e contatos autorizados.
- [ ] Datas, números, moeda/plural/timezone corretos.

## Acessibilidade

- [ ] Um main, skip link, headings e landmarks.
- [ ] Somente teclado; foco/menus/dialogs/drawers.
- [ ] NVDA/leitor aprovado; live regions sem ruído.
- [ ] Contraste AA nos temas/estados; escala de cinza.
- [ ] Zoom 200/400%, fonte ampliada, reduced motion, sem JS público.
- [ ] Alt/créditos; charts/mapas/grafo com alternativa.

## Segurança/privacidade/autorização

- [ ] Anônimo, cross-project, externo expirado e usuário desativado.
- [ ] Guards server + RLS + Storage; busca/export/report respeitam acesso.
- [ ] Callback/redirect/session/CSRF/rate-limit testados.
- [ ] Upload MIME/magic/size/malware/name; signed links/revogação.
- [ ] XSS/HTML/embed/SQL/IDOR; CSP/headers; segredos/logs.
- [ ] Consentimento/classificação/retenção e ações destrutivas.
- [ ] Auditoria append-only com ator/alvo/resultado, sem payload sensível.

## Performance/resiliência

- [ ] CWV p75 e Lighthouse; trace mobile/Save-Data.
- [ ] Bundle por rota, Server/Client boundaries, long tasks.
- [ ] Imagens/fontes/vídeo responsivos; zero CLS de mídia.
- [ ] Paginação, N+1, índices, massa grande, jobs e cache/invalidação.
- [ ] Falha de rede/serviço, retry idempotente, concorrência e restore.

## Fluxograma

- [ ] 2025/2016/2012, optativas, IDs, arestas, ciclos e PDFs.
- [ ] Ancestrais/dependentes, touch/mouse/teclado.
- [ ] Resize/zoom/pan/fullscreen/fase/modal e mobile.
- [ ] Paridade com fonte validada e fallback/redirect do legado.

## Código/arquitetura

- [ ] Sem componentes gigantes, duplicação, abstração prematura ou configuração espalhada.
- [ ] Dados fora de componentes; módulos/domínios claros; tipos gerados.
- [ ] Dependências justificadas/licenças; código/import/assets mortos removidos com segurança.
- [ ] Comentários explicam por quê; README/runbooks atualizados.

## Resultado

Registrar achados P0–P3 com evidência e reprodução. P0/P1 bloqueiam release. Reexecutar somente a matriz afetada após correção e, por fim, regressão completa.
