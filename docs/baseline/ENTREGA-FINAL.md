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

## Addendum — banco na nuvem aplicado (2026-09-15, tarde)

Com a senha do banco fornecida pelo usuário:

- `npm run db:push` aplicou as **6 migrations** no projeto `dsookutmubatecxzxtix` (25 tabelas, todas com RLS; `anon` só lê `public_publication`). Host correto é o direto `db.<ref>.supabase.co:5432` (o pooler regional anterior estava errado); `.env.local` atualizado.
- Perfis retroativos criados para contas anteriores ao trigger; `e2e-admin@ferrosite.test` (admin) e `raphaelgarciar@gmail.com` (admin, e-mail confirmado, **senha a definir pelo próprio usuário** via link mágico em `/login` ou pelo Supabase Auth) ativos; `e2e-reviewer@ferrosite.test` (coordenação) criado com senha gerada para o fluxo de aprovação por terceiro.
- `npm run test:integration` 8/8; e2e autenticado real: `auth.spec` 6/6 e novo `portal-journey.spec` 7/7 (projeto → missões/Kanban/calendário → equipe → arquivo → conteúdo: rascunho 404, autor não aprova, revisor aprova e publica, artigo no site sem selo e com XSS escapado, despublicação → 404 → CRM + desafio pelo site com protocolo real → relatórios/CSV).
- Bugs encontrados só com o banco real e corrigidos: `formatDate` quebrava ao combinar `dateStyle` com componentes (`day/month/year`); mensagens dos guards (ex.: "autor não aprova o próprio conteúdo") apareciam como "sem permissão" genérico; logout passou a encerrar só a sessão atual (`scope: local`), revogação global fica com "desativar conta".
- Suíte completa: **260/260** e2e, 135 unit, 49 RLS.

Pendente ainda: `npm run db:types` contra a nuvem exige Docker (postgres-meta) — os tipos gerados localmente (`db:types:local`) são idênticos ao schema aplicado; rotação das chaves antes de ir ao ar.

## Addendum — MAIL-001 e-mail transacional (2026-09-17)

Gancho do grupo "integrações pendentes" implementado a pedido do usuário (provedor Resend): fila `mail_outbox` por trigger, entrega pós-resposta/cron, templates PT/EN, painel em Configurações. Relatório `docs/baseline/MAIL-001-relatorio.md`. Migration aplicada na nuvem. Números: unit 144, RLS 54, e2e 261 (ver relatório). Depende do usuário: conta Resend com domínio verificado e variáveis de ambiente.

## Addendum — DRIVE-001 Google Drive (2026-09-21)

Segundo gancho de integração: conta de serviço via REST, verificação auditada, proxy autenticado no Portal e capa pública condicionada (`docs/baseline/DRIVE-001-relatorio.md`). Migration 8 aplicada na nuvem. Números: unit 153, RLS 58, e2e 262. Depende do usuário: credencial da conta de serviço e pasta institucional.

## Addendum — OPS-002 sink de erros (2026-09-21)

Terceiro gancho de integração: webhook genérico para erros/avisos do servidor e do navegador, com teste pelo Portal (`docs/baseline/OPS-002-relatorio.md`). Sem migration. Números: unit 160, RLS 58, e2e 263. Depende do usuário: escolher o coletor e definir `ERROR_SINK_URL`/`ERROR_SINK_TOKEN`.

## Addendum — DRIVE-002 Google Drive por OAuth (2026-09-21)

Conexão institucional do Drive por OAuth 2.0 (`docs/GOOGLE_DRIVE_INTEGRATION.md`, `docs/baseline/DRIVE-002-relatorio.md`): Configurações → Integrações com conectar/testar/pasta/desconectar, tokens cifrados no banco, refresh automático e revogação tratada; DRIVE-001 continua como alternativa por conta de serviço. Migration 9 aplicada na nuvem. Números: unit 170, RLS 61, e2e 266/266. Depende do usuário: `npm run google:env`, conta de teste no Google Auth Platform, consentimento real.

## Addendum — DRIVE-003 upload pelo Portal (2026-09-21)

Upload Portal → Drive com escopo `drive.file`, estrutura por entidade, magic bytes e trava de concorrência (`docs/baseline/DRIVE-003-relatorio.md`). Migration 10 aplicada; Drive institucional conectado com escrita e uploads reais verificados no e2e. Números: unit 177, RLS 64, e2e 271.
