# Entrega final do roadmap Codex — 2026-09-15

Todas as etapas do backlog (`PLANO_DESENVOLVIMENTO_CLAUDE/30_BACKLOG_CLAUDE_CODE.md`) foram implementadas e testadas em commits locais na branch `main`. Cada etapa tem relatório próprio em `docs/baseline/` e addenda em `01_AUDITORIA_PROJETO_ATUAL.md` e `33_DECISOES_E_CONFLITOS_ENCONTRADOS.md`.

## Etapas e commits

| Etapa | Commit | Relatório |
|---|---|---|
| BASE-001 baseline | 174dbe8 | BASE-001-relatorio.md |
| ARCH-001 arquitetura | 81eea8c | ARCH-001-relatorio.md |
| DS-001 design system | 9c293ba | DS-001-relatorio.md |
| I18N-001 PT/EN | 8836ec2 | I18N-001-relatorio.md |
| BASE-002 quarentena editorial | b20e879 | BASE-002-relatorio.md |
| AUTH-001/002 identidade | 9ccf5bd | AUTH-001-002-relatorio.md |
| PORTAL-001 shell | 0c92cda | PORTAL-001-relatorio.md |
| PUBLIC-001 Home/Curso | ae6aedc | PUBLIC-001-relatorio.md |
| FLOW-001/002 currículo | 7b8c62a | FLOW-001-002-relatorio.md |
| PUBLIC-002 hubs | 06fa09c | PUBLIC-002-relatorio.md |
| LAB-001 laboratórios/Para Empresas | 5021747 | LAB-001-relatorio.md |
| AUTH-003 + PORTAL-002/003 | 76dd02c | AUTH-003-PORTAL-002-003-relatorio.md |
| CRM-001 organizações/desafios | 6ba2ce0 | CRM-001-relatorio.md |
| FILE-001 + PUB-001 | 148b8ce, dcf0666 | FILE-001-PUB-001-relatorio.md |
| REPORT-001 indicadores | bf3952c | REPORT-001-relatorio.md |
| OPS-001 hardening/observabilidade | 7a3c3b9 | OPS-001-relatorio.md |
| CLEAN-001 legado | 5ff6240 | CLEAN-001-relatorio.md |

## Estado final da verificação

`npm run lint` 0/0 · `npm run typecheck` ok · `npm test` 135/135 · `npm run test:rls` 49/49 (migrations reais em Postgres embutido) · `npm run build` 84 páginas · `npm run test:e2e` 253/253 (smoke, links, axe estrito PT/EN, quarentena, fluxograma, hubs, formulário de desafio, publicação, cabeçalhos) · `npm audit --omit=dev` 0. CI (`.github/workflows/ci.yml`) roda tudo isso, incluindo a suíte RLS.

## O que depende de você (não pude fazer no automático)

1. **Push**: os commits estão só locais (`git push origin main`).
2. **Banco na nuvem**: definir a senha do banco no Supabase (Settings → Database), colocar em `.env.local` como `SUPABASE_DB_PASSWORD`, rodar `npm run db:push` (6 migrations) e `npm run db:types`; depois `npm run test:integration` e o e2e autenticado. Promover `e2e-admin@ferrosite.test` a admin ativo para os testes de shell.
3. **Rotacionar as chaves** usadas na configuração (anon/service role) antes de ir ao ar e definir `CHALLENGE_HASH_SECRET`.
4. **Decisões institucionais** (33): fonte/owner de cada conteúdo em quarentena (140 entradas), autorização de logos e fotos, credencial do Google Drive, provedor de e-mail, retenção dos dados de desafios, SLOs, continuidade de Questões/Simuladores, modalidades de cooperação com empresas.
5. **Conteúdo real**: criar notícias/eventos/atualizações no Portal (Conteúdos → revisão → aprovação → publicar) para substituir o staging do protótipo.

## Garantias mantidas do início ao fim

Nada inventado (empresas, pessoas, números, datas) — lacunas como `[CONTEÚDO PENDENTE]`; contatos/PII nunca publicados; autorização sempre no servidor/RLS com auditoria append-only; conteúdo institucional sob selo até verificação; grades legadas e PDFs preservados; dados curriculares só dos PDFs oficiais (duas pendências de 2012 registradas).
