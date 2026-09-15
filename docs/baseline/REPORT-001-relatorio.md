# REPORT-001 — indicadores e relatórios

Data: 2026-09-15 · Fase F5 · Depende de PORTAL-002/003, CRM-001 · Doc 19

## Entregue

| Área | Implementação |
|---|---|
| Fórmula única (19) | `compute_indicators(início, fim)` no banco (`supabase/migrations/20260915000600_reports.sql`): o painel e a exportação leem o mesmo JSON. Período em `America/Sao_Paulo`, fim inclusivo; `formulas_version` versionada (mudar fórmula = incrementar). |
| Dicionário mínimo | projetos ativos (instante), missões concluídas (transições → concluída, não estado atual), taxa de atraso (numerador e denominador publicados; exclui canceladas), organizações envolvidas (vínculo definido: parceria confirmada ou desafio vinculado), alunos envolvidos (deduplicado), funil de desafios (recebidos/triados/aceitos). Visitas, horas e captação devolvem **`null` = "sem dados"** (entidades ainda não existem) — nunca zero. |
| Snapshot | `snapshot_indicators` grava `report_snapshot` (append-only por trigger, RLS só overseers, **auditado**); relatório histórico não muda quando os dados operacionais mudam. |
| Exportação | `/portal/relatorios/[id]/export` → CSV (BOM, período, fonte, fórmula, versão, gerado em), só overseers, `no-store`, **registrada na auditoria** (`report.export`). |
| Portal | `/portal/relatorios`: período como estado de URL, tabela indicador/valor/fonte/fórmula (com "sem dados"), botão de snapshot, lista de snapshots com exportação. Início do Portal ganha widgets por perfil com dados canônicos: minhas missões abertas (atraso derivado), meus projetos e, para overseers, filas de triagem/revisão. |

## Validação

`npm run lint` 0/0 · `npm run typecheck` ok · `npm test` **132/132** · `npm run test:rls` **49/49** (novo `reports.test.ts`: acesso restrito, período inválido, fórmulas com cenário real (concluída após o prazo + aberta vencida = 2/2), `null` sem fonte, zero com fonte, snapshot imutável/auditado/isolado das mudanças operacionais) · build ok · `npm run test:e2e` **251/251**.

## Decisões

1. Indicadores sem entidade-fonte (visitas, horas, captação) ficam declarados no dicionário com `null` e a fórmula prevista — evita "zero" enganoso (19).
2. Exportação em CSV (planilha) com a mesma fórmula do painel; PDF fica para quando houver template institucional aprovado.
3. Geração é síncrona (volume atual pequeno); assíncrona/idempotente quando houver relatórios pesados.

## Pendências

- Relatórios narrativos (Projeto, Extensão, Semestral…) dependem de templates institucionais versionados.
- Alunos envolvidos usa papel global `member` como proxy de "aluno" até haver campo de vínculo institucional.
