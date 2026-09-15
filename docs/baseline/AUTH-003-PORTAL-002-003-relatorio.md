# AUTH-003 / PORTAL-002 / PORTAL-003 — papéis, projetos + equipe, missões

Data: 2026-09-15 · Fases F3/F4 · Depende de AUTH-001/002, PORTAL-001 · Docs 10, 11, 21

## Entregue

### Banco (`supabase/migrations/20260915000200_projects_missions.sql`)

| Área | Implementação |
|---|---|
| Estados do projeto (10) | enum ganha `draft` e `cancelled`; trigger `guard_project_transition` valida a cadeia rascunho → planejamento → ativo → pausado → concluído → arquivado (cancelado terminal), preenche/limpa `archived_at`, exige overseer para reativar/reabrir e **audita** arquivar/reativar; `DELETE` de projeto e missão é barrado por trigger (só arquivar/cancelar). |
| Estados da missão (10) | `guard_mission_transition`: Planejada → Em execução → Em validação → Concluída; pausar/cancelar/validar/reabrir só líder ou overseer; `completed_at` derivado; **atrasada é condição** (`due_at < now`), não estado. Missão não muda de projeto. |
| Integridade | responsável precisa ser membro vigente (ou overseer); remover membro com missão aberta atribuída falha até reatribuir; externo continua exigindo prazo; grant expirado perde acesso. |
| Histórico ≠ auditoria | `activity_event` (ator/origem/destino/data) visível aos membros, escrito só por triggers/`log_activity` (nem `authenticated` chama direto); `audit_event` continua restrito a overseers. |
| Checklist e comentários | `mission_checklist_item` (gestão por quem gere a missão) e `mission_comment` (autor = sessão; edição só do autor; remoção autor/líder/overseer). |
| Busca com escopo (11) | `find_profile_by_email(email)`: só overseer ou líder de algum projeto; devolve id/nome/e-mail/status; registra `profile.lookup` na auditoria. |
| Campos mínimos (10) | projeto: `name_en`, `summary_en`, `category`, `starts_on`/`ends_on` (CHECK), `modules`; missão: `deliverables`, `completed_at`. |

Tipos: `scripts/db-types-local.mjs` gera `src/types/database.ts` das migrations em Postgres embutido (sem nuvem nem Docker — `supabase gen types` exige a imagem postgres-meta). Clientes Supabase agora são tipados com `Database`.

### Aplicação (Portal)

- `src/lib/portal/authz.ts`: matriz (11) e máquinas de estado em TS, espelho da migration — a UI só oferece o que o servidor aceita; decisão final continua no banco.
- Server Actions (`src/lib/portal/actions/{projects,missions,people}.ts`): validação cedo + RLS/triggers; **edição concorrente** detectada por `version` (UPDATE condicionado; 0 linhas ⇒ "alguém alterou… recarregue"); erros de guard viram mensagem legível.
- Rotas: `/portal/projetos` (busca, filtro de situação e paginação como estado de URL; arquivados/cancelados fora do padrão), `/portal/projetos/novo`, `/portal/projetos/[slug]` (visão geral, transições permitidas, missões abertas, histórico), `/editar`, `/equipe` (adicionar por e-mail cadastrado, papel/prazo, remoção soft), `/missoes` (**lista, Kanban e calendário** da mesma consulta; transição por botões em qualquer visão — drag nunca é o único mecanismo), `/missoes/nova`, `/missoes/[id]` (edição, transição, responsáveis só da equipe, checklist, comentários, histórico), `/portal/pessoas` (admin/coordenação veem; só admin altera papel/situação — auditado; item de menu por papel).
- Primitivos novos: `Select`/`Textarea` (`src/components/ui/Field.tsx`), `StatusActions`, `ActionFeedback`; tudo nos dois temas e uma coluna no mobile.

## Validação

`npm run lint` 0/0 · `npm run typecheck` ok · `npm test` **122/122** (novo `portal-authz.test.ts`) · `npm run test:rls` **28/28** (novo `projects-missions.test.ts`: matriz positiva/negativa, cross-project por ID, visualizador, grant externo expirado, busca com escopo + auditoria, cadeia de estados do projeto, arquivado consultável/reativação auditada, cancelado terminal, concorrência por versão, criação de missão com histórico, responsável ∈ equipe, fluxo com validação do líder e reabertura, pausar/cancelar, missão não muda de projeto, remoção com missão aberta, checklist/comentários, histórico somente leitura) · build ok · `npm run test:e2e` **228/228** (rotas novas do Portal redirecionam anônimo para `/login?next=` allowlisted).

## Decisões

1. Cadeia de estados fixa no servidor (10 "sugestão inicial"); `draft` é o estado inicial de criação.
2. Concorrência por `version` no UPDATE (10) em vez de bloqueio: perda silenciosa impossível; conflito devolve mensagem e pede recarga.
3. Kanban agrupa `paused` com `planned` na coluna inicial; cancelamentos/concluídas ficam visíveis só em "Todas"/coluna Concluída.
4. Convite/aceite (11) ficam com o Supabase Auth (invite by e-mail); a página Pessoas cobre ativação, papel e desativação — não há auto-cadastro.
5. E2E autenticado das telas novas depende da migration na nuvem (senha do banco pendente, ver AUTH-001-002); a cobertura de banco é o harness embutido.

## Pendências

- Aplicar migrations na nuvem (`npm run db:push`) e rodar `npm run test:integration` + e2e autenticado das telas.
- Módulos de projeto além de visão/equipe/missões (pipeline, roadmap, arquivos…) chegam com FILE-001/PUB-001/REPORT-001.
- Drag-and-drop no Kanban como conveniência adicional (nunca exclusivo).
